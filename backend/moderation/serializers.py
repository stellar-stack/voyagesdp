from rest_framework import serializers
from .models import Report, Notification, AIViolationLog
from api.serializers import UserPublicSerializer
from posts.serializers import PostSerializer


class ReportSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)
    reported_by = UserPublicSerializer(read_only=True)
    reported_user = UserPublicSerializer(read_only=True)
    resolved_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = Report
        fields = (
            'id', 'post', 'reported_by', 'reported_user',
            'reason', 'status', 'resolved_by', 'resolved_at', 'created_at',
        )


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('post', 'reason')

    def validate(self, attrs):
        request = self.context['request']
        post = attrs['post']
        if post.user == request.user:
            raise serializers.ValidationError('You cannot report your own post.')
        if post.is_deleted:
            raise serializers.ValidationError('Cannot report a deleted post.')
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'notif_type', 'message', 'is_read', 'created_at')


class AIViolationLogSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = AIViolationLog
        fields = (
            'id', 'user', 'content_type', 'content_id', 'content_text',
            'reason', 'flagged_at', 'action_taken', 'violation_number',
            'is_false_positive', 'reviewed_by',
        )
