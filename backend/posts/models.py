from django.db import models
from django.utils import timezone
from api.models import User
from communities.models import Community
from posts.validators import validate_image_file, validate_video_file


class Post(models.Model):
    POST_TYPE = (
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    community = models.ForeignKey(
        Community, on_delete=models.CASCADE, related_name='posts', null=True, blank=True
    )

    caption = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)

    image = models.ImageField(
        upload_to='posts/images/', null=True, blank=True, validators=[validate_image_file]
    )
    video = models.FileField(
        upload_to='posts/videos/', null=True, blank=True, validators=[validate_video_file]
    )

    post_type = models.CharField(max_length=10, choices=POST_TYPE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # AI moderation flags
    ai_flagged = models.BooleanField(default=False)
    ai_flag_reason = models.TextField(blank=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} — {self.post_type}'


class PostReaction(models.Model):
    REACTION_TYPES = (
        ('LIKE', 'Like'),
        ('LOVE', 'Love'),
        ('LAUGH', 'Laugh'),
        ('ANGRY', 'Angry'),
        ('SAD', 'Sad'),
        ('WOW', 'Wow'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES, default='LIKE')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f'{self.user.username} {self.reaction_type} on post {self.post_id}'


# Keep PostLike as alias so old code doesn't break during migration
class PostLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')

    # Nested comments: null parent = top-level comment
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, related_name='replies', null=True, blank=True
    )

    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # AI moderation flags
    ai_flagged = models.BooleanField(default=False)
    ai_flag_reason = models.TextField(blank=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.username} on post {self.post_id}'


class PostShare(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='shares')
    shared_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')


class PostBookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} bookmarked post {self.post_id}'
