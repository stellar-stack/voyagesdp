from django.contrib import admin
from .models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'participant_1', 'participant_2', 'updated_at')
    search_fields = ('participant_1__username', 'participant_2__username')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'is_read', 'is_deleted', 'created_at')
    search_fields = ('sender__username', 'content')
    list_filter = ('is_read', 'is_deleted')
