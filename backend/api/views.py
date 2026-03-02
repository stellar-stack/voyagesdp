from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, parser_classes, throttle_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .serializers import (
    RegisterSerializer, UserAdminSerializer,
    UserPrivateSerializer, UserPublicSerializer, UserUpdateSerializer,
)
from .models import User
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from moderation.views import is_admin


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'


class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            tokens = response.data
            access = tokens.get('access')
            refresh = tokens.get('refresh')

            res = Response({'success': True})
            res.set_cookie(key='access_token', value=access, httponly=True, secure=True, samesite='None', path='/')
            res.set_cookie(key='refresh_token', value=refresh, httponly=True, secure=True, samesite='None', path='/')
            return res
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)


class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            refresh = request.COOKIES.get('refresh_token')
            request.data['refresh'] = refresh
            response = super().post(request, *args, **kwargs)
            access = response.data.get('access')

            res = Response({'refreshed': True})
            res.set_cookie(key='access_token', value=access, httponly=True, secure=True, samesite='None', path='/')
            return res
        except Exception:
            return Response({'success': False})


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
@throttle_classes([RegisterRateThrottle])
def register(request):
    username = request.data.get('username')
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)

    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        _send_verification_email(user)
        return Response({'success': True, 'message': 'User registered. Check your email to verify your account.'}, status=201)

    return Response(serializer.errors, status=400)


def _send_verification_email(user):
    from django.core.mail import send_mail
    from django.conf import settings
    try:
        verify_url = f"http://localhost:3000/verify-email?token={user.email_verification_token}"
        send_mail(
            subject='Verify your Voyage account',
            message=f'Hi {user.username},\n\nClick the link to verify your email:\n{verify_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.query_params.get('token')
    if not token:
        return Response({'error': 'Token is required'}, status=400)
    try:
        user = User.objects.get(email_verification_token=token)
        user.email_verified = True
        user.save(update_fields=['email_verified'])
        return Response({'verified': True})
    except User.DoesNotExist:
        return Response({'error': 'Invalid token'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        res = Response({'success': True})
        res.delete_cookie('access_token', path='/', samesite='None')
        res.delete_cookie('refresh_token', path='/', samesite='None')
        return res
    except Exception:
        return Response({'success': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    serializer = UserPrivateSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request, username):
    user = get_object_or_404(User, username=username, is_deleted=False)
    if request.user.role == 'ADMIN':
        serializer = UserAdminSerializer(user, context={'request': request})
    elif request.user == user:
        serializer = UserPrivateSerializer(user)
    else:
        serializer = UserPublicSerializer(user, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_my_profile(request):
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    from django.core.cache import cache
    cache.delete(f'user_profile_{request.user.username}')

    return Response(UserPrivateSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_follow(request):
    target_username = request.data.get('username')
    target_user = get_object_or_404(User, username=target_username, is_deleted=False)

    if target_user == request.user:
        return Response({'error': 'Cannot follow yourself'}, status=400)

    user = request.user
    if target_user in user.following.all():
        user.following.remove(target_user)
        return Response({'following': False})
    else:
        user.following.add(target_user)
        _notify_follow(user, target_user)
        return Response({'following': True})


def _notify_follow(follower, target):
    from moderation.models import Notification
    from ai_moderation.service import _push_ws_notification
    notif = Notification.objects.create(
        user=target,
        notif_type='FOLLOW',
        message=f'@{follower.username} started following you.',
    )
    _push_ws_notification(target.id, notif)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_followers(request, username):
    user = get_object_or_404(User, username=username, is_deleted=False)
    followers = user.followers.filter(is_deleted=False).order_by('username')

    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated = paginator.paginate_queryset(followers, request)
    serializer = UserPublicSerializer(paginated, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_following(request, username):
    user = get_object_or_404(User, username=username, is_deleted=False)
    following = user.following.filter(is_deleted=False).order_by('username')

    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated = paginator.paginate_queryset(following, request)
    serializer = UserPublicSerializer(paginated, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_all_users(request):
    """Admin: paginated list of all users, optionally filtered by search query."""
    if request.user.role not in ('ADMIN', 'MODERATOR'):
        return Response({'detail': 'Not authorized'}, status=403)

    from django.db.models import Q
    q = request.query_params.get('q', '').strip()
    users = User.objects.filter(is_deleted=False).order_by('-date_joined')
    if q:
        users = users.filter(
            Q(username__icontains=q) | Q(first_name__icontains=q) |
            Q(last_name__icontains=q) | Q(email__icontains=q)
        )

    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated = paginator.paginate_queryset(users, request)
    serializer = UserAdminSerializer(paginated, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([])

    from django.db.models import Q
    users = User.objects.filter(
        Q(username__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q),
        is_deleted=False,
        is_active=True,
    ).exclude(id=request.user.id)[:30]

    serializer = UserPublicSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suspend_user(request, user_id):
    if not is_admin(request.user):
        return Response({'detail': 'Not authorized'}, status=403)

    user = get_object_or_404(User, id=user_id)

    if is_admin(user):
        return Response({'detail': 'Cannot suspend admin/moderator'}, status=400)

    days = int(request.data.get('days', 0))
    if days not in [1, 7, 30, 90]:
        return Response({'detail': 'Invalid suspension duration. Allowed: 1, 7, 30, 90 days'}, status=400)

    user.suspended_until = timezone.now() + timedelta(days=days)
    user.save(update_fields=['suspended_until'])

    from moderation.models import Notification
    Notification.objects.create(
        user=user,
        notif_type='SUSPENSION',
        message=f'Your account has been suspended for {days} days by an administrator.',
    )

    return Response({'success': True, 'message': f'User suspended for {days} days'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_violations(request, user_id):
    """Admin can clear a user's AI violation count (e.g., after reviewing false positives)."""
    if request.user.role != 'ADMIN':
        return Response({'detail': 'Only admins can clear violations'}, status=403)

    user = get_object_or_404(User, id=user_id)
    cleared = user.violation_count
    user.violation_count = 0
    user.last_violation_at = None
    if not user.is_active:
        user.is_active = True
    if user.suspended_until:
        user.suspended_until = None
    user.save()

    return Response({'success': True, 'violations_cleared': cleared})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def promote_user(request, user_id):
    """Admin can promote a user to MODERATOR or demote back to USER."""
    if request.user.role != 'ADMIN':
        return Response({'detail': 'Only admins can change roles'}, status=403)

    user = get_object_or_404(User, id=user_id)
    new_role = request.data.get('role', '').upper()

    if new_role not in ('USER', 'MODERATOR'):
        return Response({'detail': 'Invalid role. Allowed: USER, MODERATOR'}, status=400)

    user.role = new_role
    user.save(update_fields=['role'])
    return Response({'success': True, 'new_role': new_role})
