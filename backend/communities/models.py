from django.db import models
from api.models import User


class Community(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    about = models.TextField(max_length=1000, blank=True)

    # Community guidelines / rules shown to members
    rules = models.TextField(
        blank=True,
        help_text='Community rules displayed to members. One rule per line.'
    )

    banner = models.ImageField(upload_to='community_banners/', null=True, blank=True)

    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_communities'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return self.name


class CommunityMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_memberships')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='members')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'community')

    def __str__(self):
        return f'{self.user.username} in {self.community.name}'


class CommunityModerator(models.Model):
    """
    Community-level moderator. Different from the platform-wide MODERATOR role.
    A community moderator can only manage content within their assigned community.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moderated_communities')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='moderators')
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='moderation_assignments'
    )

    class Meta:
        unique_together = ('user', 'community')

    def __str__(self):
        return f'{self.user.username} (mod) in {self.community.name}'
