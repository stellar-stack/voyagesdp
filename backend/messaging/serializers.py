from rest_framework import serializers
from .models import Conversation, Message
from api.serializers import UserPublicSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'conversation_id', 'sender', 'content', 'is_read', 'created_at', 'is_deleted')
        read_only_fields = ('id', 'conversation_id', 'sender', 'is_read', 'created_at', 'is_deleted')


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'other_user', 'last_message', 'unread_count', 'updated_at')

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request:
            other = obj.other_participant(request.user)
            return UserPublicSerializer(other).data
        return None

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).last()
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.filter(is_read=False, is_deleted=False).exclude(
                sender=request.user
            ).count()
        return 0
