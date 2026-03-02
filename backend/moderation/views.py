from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import UserRateThrottle

from api.models import User
from posts.models import Post
from .models import Report, Notification, AIViolationLog
from .serializers import ReportSerializer, ReportCreateSerializer, NotificationSerializer, AIViolationLogSerializer
from .permissions import IsAdminOrModerator, IsAdmin


class ReportThrottle(UserRateThrottle):
    scope = 'report'


def is_admin(user):
    """Returns True if user has platform admin or moderator role."""
    return user.role in ('ADMIN', 'MODERATOR')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ReportThrottle])
def create_report(request):
    serializer = ReportCreateSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    post = serializer.validated_data['post']

    if Report.objects.filter(post=post, reported_by=request.user).exists():
        return Response({'error': 'You have already reported this post.'}, status=400)

    report = serializer.save(reported_by=request.user, reported_user=post.user)

    Notification.objects.create(
        user=post.user, post=post,
        notif_type='REPORT_USER',
        message='Your post has been reported and is under review.',
    )

    admins = User.objects.filter(role__in=('ADMIN', 'MODERATOR'), is_active=True)
    Notification.objects.bulk_create([
        Notification(user=a, post=post, notif_type='REPORT_ADMIN', message='A new post report requires your review.')
        for a in admins
    ])

    return Response({'success': True, 'report': ReportSerializer(report).data}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_reports(request):
    if not is_admin(request.user):
        return Response({'detail': 'Not authorized'}, status=403)

    status_filter = request.query_params.get('status')
    reports = Report.objects.select_related('post', 'reported_by', 'reported_user').order_by('-created_at')
    if status_filter:
        reports = reports.filter(status=status_filter.upper())

    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated = paginator.paginate_queryset(reports, request)
    return paginator.get_paginated_response(ReportSerializer(paginated, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def resolve_report(request, report_id):
    if not is_admin(request.user):
        return Response({'detail': 'Not authorized'}, status=403)

    report = get_object_or_404(Report, id=report_id)
    action = request.data.get('action', 'RESOLVED').upper()
    if action not in ('RESOLVED', 'DISMISSED'):
        return Response({'detail': 'Invalid action. Use RESOLVED or DISMISSED.'}, status=400)

    report.status = action
    report.resolved_by = request.user
    report.resolved_at = timezone.now()
    report.save(update_fields=['status', 'resolved_by', 'resolved_at'])

    return Response(ReportSerializer(report).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_post(request, post_id):
    if not is_admin(request.user):
        return Response({'detail': 'Not authorized'}, status=403)

    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    Report.objects.filter(post=post, status='PENDING').update(status='RESOLVED')
    post.soft_delete()

    return Response({'success': True, 'message': 'Post deleted and related reports resolved'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suspend_user(request, user_id):
    if not is_admin(request.user):
        return Response({'detail': 'Not authorized'}, status=403)

    user = get_object_or_404(User, id=user_id)
    if is_admin(user):
        return Response({'detail': 'Cannot suspend admin/moderator'}, status=400)

    days = int(request.data.get('days', 7))
    if days not in (1, 7, 30, 90):
        return Response({'detail': 'Invalid days. Allowed: 1, 7, 30, 90'}, status=400)

    from datetime import timedelta
    user.suspended_until = timezone.now() + timedelta(days=days)
    user.save(update_fields=['suspended_until'])

    Notification.objects.create(
        user=user,
        notif_type='SUSPENSION',
        message=f'Your account has been suspended for {days} days by a moderator.',
    )

    return Response({'success': True, 'suspended_until': user.suspended_until})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = request.user.notifications.all()
    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated = paginator.paginate_queryset(notifications, request)
    return paginator.get_paginated_response(NotificationSerializer(paginated, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notif_id):
    notif = get_object_or_404(Notification, id=notif_id, user=request.user)
    notif.is_read = True
    notif.save(update_fields=['is_read'])
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    request.user.notifications.filter(is_read=False).update(is_read=True)
    return Response({'success': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_ai_violations(request):
    """Admin view: list all AI violation logs."""
    if not is_admin(request.user):
        return Response({'detail': 'Not authorized'}, status=403)

    violations = AIViolationLog.objects.select_related('user').order_by('-flagged_at')

    user_filter = request.query_params.get('user_id')
    if user_filter:
        violations = violations.filter(user_id=user_filter)

    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated = paginator.paginate_queryset(violations, request)
    return paginator.get_paginated_response(AIViolationLogSerializer(paginated, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_false_positive(request, violation_id):
    """Admin marks an AI violation as a false positive and optionally reduces user's violation count."""
    if request.user.role != 'ADMIN':
        return Response({'detail': 'Only admins can mark false positives'}, status=403)

    violation = get_object_or_404(AIViolationLog, id=violation_id)
    violation.is_false_positive = True
    violation.reviewed_by = request.user
    violation.save(update_fields=['is_false_positive', 'reviewed_by'])

    # Reduce the user's violation count by 1
    user = violation.user
    if user.violation_count > 0:
        user.violation_count -= 1
        user.save(update_fields=['violation_count'])

    return Response({'success': True, 'user_violation_count': user.violation_count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """Dashboard summary counts for admin/moderator."""
    if not is_admin(request.user):
        return Response({'detail': 'Not authorized'}, status=403)

    return Response({
        'pending_reports': Report.objects.filter(status='PENDING').count(),
        'total_users': User.objects.filter(is_deleted=False, is_active=True).count(),
        'total_posts': Post.objects.filter(is_deleted=False).count(),
        'active_violations': AIViolationLog.objects.filter(is_false_positive=False).count(),
        'suspended_users': User.objects.filter(suspended_until__gt=timezone.now()).count(),
    })
