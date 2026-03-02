import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):

    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )

    USER_ROLE = (
        ('USER', 'User'),
        ('MODERATOR', 'Moderator'),   # Platform-wide moderator
        ('ADMIN', 'Admin'),           # Full platform admin
    )

    # Profile fields
    gender = models.CharField(max_length=6, choices=GENDER_CHOICES, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    country = models.CharField(max_length=50, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profile_img/', null=True, blank=True)

    # Role & access
    role = models.CharField(max_length=10, choices=USER_ROLE, default='USER', db_index=True)

    # Follow system (LinkedIn-style, asymmetric)
    followers = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='following',
        blank=True
    )

    # Account status
    suspended_until = models.DateTimeField(null=True, blank=True)

    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)

    # AI violation tracking
    violation_count = models.PositiveIntegerField(default=0)
    last_violation_at = models.DateTimeField(null=True, blank=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def is_suspended(self):
        return bool(self.suspended_until and self.suspended_until > timezone.now())

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['is_deleted', 'deleted_at', 'is_active'])

    def __str__(self):
        return self.username
