from rest_framework import serializers
from .models import Community
from api.serializers import UserPublicSerializer


class CommunityListSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    created_by = serializers.StringRelatedField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ('id', 'name', 'about', 'created_by', 'members_count', 'is_member', 'created_at')

    def get_members_count(self, obj):
        return obj.members.count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user).exists()
        return False


class CommunityDetailSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    members_count = serializers.SerializerMethodField()
    moderators = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = (
            'id', 'name', 'about', 'rules', 'banner',
            'created_by', 'members_count', 'moderators', 'is_member', 'created_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_members_count(self, obj):
        return obj.members.count()

    def get_moderators(self, obj):
        users = [m.user for m in obj.moderators.all()]
        return UserPublicSerializer(users, many=True).data

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user).exists()
        return False
