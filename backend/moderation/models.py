from django.db import models
from api.models import User
from posts.models import Post


class Report(models.Model):
    STATUS = (
        ('PENDING', 'Pending'),
        ('RESOLVED', 'Resolved'),
        ('DISMISSED', 'Dismissed'),
    )

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received')
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(max_length=10, choices=STATUS, default='PENDING', db_index=True)
    resolved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('post', 'reported_by')
        ordering = ['-created_at']

    def __str__(self):
        return f'Report on post {self.post_id} by {self.reported_by.username}'


class Notification(models.Model):
    NOTIF_TYPE = (
        ('REPORT_USER', 'Your post was reported'),
        ('REPORT_ADMIN', 'New report to review'),
        ('AI_VIOLATION', 'Content removed by AI'),
        ('SUSPENSION', 'Account suspended'),
        ('FOLLOW', 'New follower'),
        ('REACTION', 'Post reaction'),
        ('COMMENT', 'New comment'),
        ('MESSAGE', 'New message'),
        ('SYSTEM', 'System notification'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    notif_type = models.CharField(max_length=20, choices=NOTIF_TYPE, db_index=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.notif_type}] for {self.user.username}'


class AIViolationLog(models.Model):
    """
    Audit log of every piece of content removed by the AI moderation system.
    Admins can review these to validate AI decisions and clear false positives.
    """
    CONTENT_TYPE = (
        ('POST', 'Post'),
        ('COMMENT', 'Comment'),
    )

    ACTION_TAKEN = (
        ('WARNED', 'Warning issued'),
        ('SUSPENDED_7', 'Suspended 7 days'),
        ('SUSPENDED_30', 'Suspended 30 days'),
        ('BANNED', 'Permanently banned'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_violations')
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPE)
    content_id = models.PositiveIntegerField()
    content_text = models.TextField(blank=True, help_text='Snapshot of the removed content')
    reason = models.TextField()
    flagged_at = models.DateTimeField(auto_now_add=True, db_index=True)
    action_taken = models.CharField(max_length=15, choices=ACTION_TAKEN)
    violation_number = models.PositiveIntegerField(help_text='Violation count at time of flagging')

    # Admin can mark a log as a false positive and reinstate the content
    is_false_positive = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_violations'
    )

    class Meta:
        ordering = ['-flagged_at']

    def __str__(self):
        return f'AI removed {self.content_type} from {self.user.username} (violation #{self.violation_number})'
