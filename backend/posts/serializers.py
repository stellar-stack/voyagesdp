from rest_framework import serializers
from .models import Post, Comment, PostReaction, PostBookmark
from api.serializers import UserPublicSerializer


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('caption', 'content', 'post_type', 'community', 'image', 'video')

    def validate(self, data):
        post_type = data.get('post_type')
        if post_type == 'TEXT':
            if not data.get('content') and not data.get('caption'):
                raise serializers.ValidationError("Text post must have content or caption.")
        elif post_type == 'IMAGE':
            if not data.get('image'):
                raise serializers.ValidationError("Image is required for IMAGE post.")
        elif post_type == 'VIDEO':
            if not data.get('video'):
                raise serializers.ValidationError("Video is required for VIDEO post.")
        else:
            raise serializers.ValidationError("Invalid post type.")
        return data


class ReplySerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'user', 'content', 'created_at')


class CommentSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    replies = ReplySerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'user', 'content', 'parent', 'replies', 'reply_count', 'created_at')
        read_only_fields = ('id', 'user', 'created_at', 'replies', 'reply_count')

    def get_reply_count(self, obj):
        return obj.replies.filter(is_deleted=False).count()


class PostReactionSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = PostReaction
        fields = ('id', 'user', 'reaction_type', 'created_at')


class PostSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    community = serializers.StringRelatedField()
    reactions_count = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            'id', 'user', 'caption', 'content', 'image', 'video',
            'post_type', 'community', 'reactions_count', 'reactions_summary',
            'comments_count', 'shares_count', 'user_reaction', 'is_bookmarked',
            'created_at',
        )

    def get_reactions_count(self, obj):
        return obj.reactions.count()

    def get_reactions_summary(self, obj):
        from django.db.models import Count
        return dict(
            obj.reactions.values('reaction_type').annotate(count=Count('id')).values_list('reaction_type', 'count')
        )

    def get_comments_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()

    def get_shares_count(self, obj):
        return obj.shares.count()

    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        # Walk prefetched cache to avoid N+1 when called in a list
        prefetched = getattr(obj, '_prefetched_objects_cache', {})
        if 'reactions' in prefetched:
            for r in obj.reactions.all():
                if r.user_id == request.user.id:
                    return r.reaction_type
            return None
        reaction = obj.reactions.filter(user=request.user).first()
        return reaction.reaction_type if reaction else None

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Walk prefetched cache to avoid N+1 when called in a list
        prefetched = getattr(obj, '_prefetched_objects_cache', {})
        if 'bookmarked_by' in prefetched:
            return any(b.user_id == request.user.id for b in obj.bookmarked_by.all())
        return obj.bookmarked_by.filter(user=request.user).exists()


class PostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('caption', 'content')

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("At least one field must be provided.")
        return data


class BookmarkSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)

    class Meta:
        model = PostBookmark
        fields = ('id', 'post', 'created_at')
