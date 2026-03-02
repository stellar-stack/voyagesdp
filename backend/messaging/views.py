from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import UserRateThrottle

from api.models import User
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class MessageSendThrottle(UserRateThrottle):
    scope = 'message_send'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    """List all conversations for the current user, ordered by most recent activity."""
    from django.db.models import Q
    conversations = Conversation.objects.filter(
        Q(participant_1=request.user) | Q(participant_2=request.user)
    ).select_related('participant_1', 'participant_2').order_by('-updated_at')

    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(conversations, request)
    serializer = ConversationSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([MessageSendThrottle])
def send_message(request):
    """
    Start or continue a conversation with another user.
    Body: { "username": "...", "content": "..." }
    """
    username = request.data.get('username')
    content = request.data.get('content', '').strip()

    if not username:
        return Response({'error': 'username is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not content:
        return Response({'error': 'content is required'}, status=status.HTTP_400_BAD_REQUEST)
    if len(content) > 5000:
        return Response({'error': 'Message too long (max 5000 chars)'}, status=400)

    target = get_object_or_404(User, username=username, is_active=True, is_deleted=False)

    if target == request.user:
        return Response({'error': 'Cannot message yourself'}, status=status.HTTP_400_BAD_REQUEST)

    conversation, _ = Conversation.get_or_create_between(request.user, target)

    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        content=content,
    )

    # Touch conversation updated_at for ordering
    conversation.save(update_fields=['updated_at'])

    # Push real-time notification to recipient
    _push_new_message(conversation, message, target)

    return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    """Get paginated messages for a conversation (most recent first)."""
    from django.db.models import Q
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id
    )

    # Ensure requester is a participant
    if request.user not in (conversation.participant_1, conversation.participant_2):
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    messages = conversation.messages.filter(is_deleted=False).order_by('-created_at')

    paginator = PageNumberPagination()
    paginator.page_size = 50
    page = paginator.paginate_queryset(messages, request)

    # Mark unread messages from the other user as read
    conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    serializer = MessageSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    """Sender can soft-delete their own message."""
    message = get_object_or_404(Message, id=message_id, sender=request.user)
    message.is_deleted = True
    message.deleted_at = timezone.now()
    message.save(update_fields=['is_deleted', 'deleted_at'])
    return Response({'deleted': True})


def _push_new_message(conversation, message, recipient):
    """Push a real-time WebSocket notification to the message recipient."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        async_to_sync(channel_layer.group_send)(
            f'conversation_{conversation.id}',
            {
                'type': 'chat_message',
                'data': {
                    'id': message.id,
                    'sender': message.sender.username,
                    'content': message.content,
                    'created_at': message.created_at.isoformat(),
                    'conversation_id': conversation.id,
                },
            },
        )
    except Exception:
        pass  # WebSocket push is non-critical
