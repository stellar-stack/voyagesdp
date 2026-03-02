from django.db import models
from api.models import User


class Conversation(models.Model):
    """
    A direct-message conversation between exactly two users.
    We store both participants explicitly for fast lookup.
    """
    participant_1 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='conversations_as_p1'
    )
    participant_2 = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='conversations_as_p2'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        # Prevent duplicate conversations between the same two users
        unique_together = ('participant_1', 'participant_2')
        ordering = ['-updated_at']

    @classmethod
    def get_or_create_between(cls, user_a, user_b):
        """Always store with lower PK as participant_1 to avoid duplicates."""
        if user_a.id > user_b.id:
            user_a, user_b = user_b, user_a
        conv, created = cls.objects.get_or_create(
            participant_1=user_a,
            participant_2=user_b,
        )
        return conv, created

    def other_participant(self, user):
        return self.participant_2 if self.participant_1_id == user.id else self.participant_1

    def __str__(self):
        return f'DM: {self.participant_1.username} ↔ {self.participant_2.username}'


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(max_length=5000)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)

    # Soft delete (sender can unsend within a time window)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.username}: {self.content[:50]}'
