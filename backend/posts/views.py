from django.shortcuts import get_object_or_404
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes, parser_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.throttling import UserRateThrottle

from .models import Post, PostReaction, Comment, PostShare, PostBookmark
from .serializers import (
    PostSerializer,
    PostCreateSerializer,
    CommentSerializer,
    PostUpdateSerializer,
    PostReactionSerializer,
    BookmarkSerializer,
)


class PostCreateThrottle(UserRateThrottle):
    scope = 'post_create'


class CommentCreateThrottle(UserRateThrottle):
    scope = 'comment_create'


def _run_ai_moderation(user, content_type: str, obj, text: str):
    """
    Run AI moderation on text content. If flagged, soft-delete the object,
    handle the violation, and return an error dict. Returns None if content is clean.
    """
    from ai_moderation.service import check_content, handle_violation
    result = check_content(text)
    if result['flagged']:
        obj.soft_delete()
        handle_violation(
            user=user,
            content_type=content_type,
            content_id=obj.id,
            content_text=text,
            reason=result['reason'],
        )
        return {
            'error': 'Your content was removed for violating community guidelines.',
            'reason': result['reason'],
            'ai_removed': True,
        }
    return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
@throttle_classes([PostCreateThrottle])
def create_post(request):
    serializer = PostCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    post = serializer.save(user=request.user)

    text = f"{post.caption} {post.content}".strip()
    if text:
        violation = _run_ai_moderation(request.user, 'POST', post, text)
        if violation:
            return Response(violation, status=status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS)

    return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_feed(request):
    page_num = request.query_params.get('page', 1)
    # Per-user cache key so user-specific fields (user_reaction, is_bookmarked) are correct
    cache_key = f'feed_page_{page_num}_user_{request.user.id}'

    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    posts = Post.objects.filter(
        is_deleted=False
    ).select_related(
        'user', 'community'
    ).prefetch_related(
        'reactions',
        'comments',
        'shares',
        'bookmarked_by',
    ).order_by('-created_at')

    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginated_posts = paginator.paginate_queryset(posts, request)

    serializer = PostSerializer(paginated_posts, many=True, context={'request': request})
    response = paginator.get_paginated_response(serializer.data)

    cache.set(cache_key, response.data, timeout=60)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_feed(request, community_id):
    posts = Post.objects.filter(
        community_id=community_id, is_deleted=False
    ).select_related('user').prefetch_related(
        'reactions', 'comments', 'shares', 'bookmarked_by'
    ).order_by('-created_at')

    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginated = paginator.paginate_queryset(posts, request)
    serializer = PostSerializer(paginated, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_posts(request, username):
    from api.models import User as UserModel
    user = get_object_or_404(UserModel, username=username, is_deleted=False)
    posts = Post.objects.filter(
        user=user, is_deleted=False
    ).select_related(
        'user', 'community'
    ).prefetch_related(
        'reactions', 'comments', 'shares', 'bookmarked_by'
    ).order_by('-created_at')

    paginator = PageNumberPagination()
    paginator.page_size = 10
    page = paginator.paginate_queryset(posts, request)
    serializer = PostSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reaction(request):
    post_id = request.data.get('post_id')
    reaction_type = request.data.get('reaction_type', 'LIKE').upper()

    valid_types = [r[0] for r in PostReaction.REACTION_TYPES]
    if reaction_type not in valid_types:
        return Response({'error': f'Invalid reaction type. Choose from {valid_types}'}, status=400)

    post = get_object_or_404(Post, id=post_id, is_deleted=False)

    existing = PostReaction.objects.filter(user=request.user, post=post).first()
    if existing:
        if existing.reaction_type == reaction_type:
            existing.delete()
            return Response({'reacted': False, 'reaction_type': None})
        existing.reaction_type = reaction_type
        existing.save(update_fields=['reaction_type'])
        return Response({'reacted': True, 'reaction_type': reaction_type})

    PostReaction.objects.create(user=request.user, post=post, reaction_type=reaction_type)
    return Response({'reacted': True, 'reaction_type': reaction_type})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([CommentCreateThrottle])
def add_comment(request):
    post_id = request.data.get('post_id')
    content = request.data.get('content', '').strip()
    parent_id = request.data.get('parent_id')

    if not post_id:
        return Response({'error': 'post_id is required'}, status=400)
    if not content:
        return Response({'error': 'Comment content is required'}, status=400)

    post = get_object_or_404(Post, id=post_id, is_deleted=False)

    parent = None
    if parent_id:
        parent = get_object_or_404(Comment, id=parent_id, post=post, is_deleted=False)

    comment = Comment.objects.create(user=request.user, post=post, content=content, parent=parent)

    violation = _run_ai_moderation(request.user, 'COMMENT', comment, content)
    if violation:
        return Response(violation, status=status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS)

    return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_comments(request, post_id):
    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    comments = post.comments.filter(
        parent__isnull=True, is_deleted=False
    ).select_related('user').prefetch_related('replies__user')

    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated = paginator.paginate_queryset(comments, request)
    serializer = CommentSerializer(paginated, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    serializer = PostSerializer(post, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    if post.user_id != request.user.id and request.user.role not in ('ADMIN', 'MODERATOR'):
        return Response({'error': 'Not authorized'}, status=403)
    serializer = PostUpdateSerializer(post, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(PostSerializer(post).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    if post.user_id != request.user.id and request.user.role not in ('ADMIN', 'MODERATOR'):
        return Response({'error': 'Not authorized'}, status=403)
    post.soft_delete()
    return Response({'deleted': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_post(request):
    post_id = request.data.get('post_id')
    if not post_id:
        return Response({'error': 'post_id is required'}, status=400)
    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    PostShare.objects.get_or_create(user=request.user, post=post)
    return Response({'shared': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, post_id):
    post = get_object_or_404(Post, id=post_id, is_deleted=False)
    bookmark, created = PostBookmark.objects.get_or_create(user=request.user, post=post)
    if not created:
        bookmark.delete()
        return Response({'bookmarked': False})
    return Response({'bookmarked': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_bookmarks(request):
    bookmarks = PostBookmark.objects.filter(
        user=request.user
    ).select_related('post__user').order_by('-created_at')
    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginated = paginator.paginate_queryset(bookmarks, request)
    serializer = BookmarkSerializer(paginated, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
