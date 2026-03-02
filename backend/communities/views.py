from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from api.models import User
from api.serializers import UserPublicSerializer

from .models import Community, CommunityMembership, CommunityModerator
from .serializers import CommunityListSerializer, CommunityDetailSerializer
from .permissions import IsCommunityCreator, IsCommunityModeratorOrAdmin
from .pagination import CommunityPagination


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_community(request):
    if request.user.role != 'ADMIN':
        return Response({'detail': 'Only admins can create communities.'}, status=403)
    serializer = CommunityDetailSerializer(data=request.data)
    if serializer.is_valid():
        community = serializer.save(created_by=request.user)
        CommunityMembership.objects.create(user=request.user, community=community)
        return Response(CommunityDetailSerializer(community).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_communities(request):
    queryset = Community.objects.all().order_by('-created_at')
    paginator = CommunityPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = CommunityListSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_detail(request, id):
    community = get_object_or_404(Community, id=id)
    serializer = CommunityDetailSerializer(community, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_community(request, id):
    community = get_object_or_404(Community, id=id)

    if request.user.role != 'ADMIN':
        return Response({'detail': 'Only admins can update communities.'}, status=403)

    serializer = CommunityDetailSerializer(community, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_community(request, id):
    community = get_object_or_404(Community, id=id)

    if request.user.role != 'ADMIN':
        return Response({'detail': 'Only admins can delete communities.'}, status=403)

    community.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_join_community(request):
    community_id = request.data.get('community_id')
    community = get_object_or_404(Community, id=community_id)

    membership, created = CommunityMembership.objects.get_or_create(
        user=request.user, community=community
    )
    if not created:
        membership.delete()
        return Response({'joined': False})
    return Response({'joined': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_members(request, id):
    community = get_object_or_404(Community, id=id)
    users = User.objects.filter(community_memberships__community=community, is_deleted=False)

    paginator = CommunityPagination()
    page = paginator.paginate_queryset(users, request)
    serializer = UserPublicSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_communities(request):
    communities = Community.objects.filter(members__user=request.user).distinct()
    serializer = CommunityListSerializer(communities, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_communities(request, username):
    user = get_object_or_404(User, username=username, is_deleted=False)
    communities = Community.objects.filter(members__user=user).distinct()
    serializer = CommunityListSerializer(communities, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_moderator(request, id):
    community = get_object_or_404(Community, id=id)

    if request.user.role != 'ADMIN':
        return Response({'detail': 'Not allowed'}, status=403)

    username = request.data.get('username')
    user = get_object_or_404(User, username=username, is_deleted=False)

    CommunityModerator.objects.get_or_create(
        user=user, community=community,
        defaults={'assigned_by': request.user}
    )
    return Response({'moderator_added': True})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_moderator(request, id, user_id):
    community = get_object_or_404(Community, id=id)

    if request.user.role != 'ADMIN':
        return Response({'detail': 'Not allowed'}, status=403)

    mod = get_object_or_404(CommunityModerator, community=community, user_id=user_id)
    mod.delete()
    return Response({'moderator_removed': True})
