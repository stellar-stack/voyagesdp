from django.contrib import admin
from .models import Post, Comment, PostReaction, PostShare, PostBookmark

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post_type', 'ai_flagged', 'is_deleted', 'created_at')
    list_filter = ('post_type', 'ai_flagged', 'is_deleted')
    search_fields = ('user__username', 'caption', 'content')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'ai_flagged', 'is_deleted', 'created_at')
    list_filter = ('ai_flagged', 'is_deleted')

@admin.register(PostReaction)
class PostReactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'reaction_type', 'created_at')
    list_filter = ('reaction_type',)
