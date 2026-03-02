from django.contrib import admin
from .models import Community, CommunityMembership, CommunityModerator

@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'created_at')
    search_fields = ('name',)

@admin.register(CommunityMembership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'community', 'joined_at')

@admin.register(CommunityModerator)
class ModeratorAdmin(admin.ModelAdmin):
    list_display = ('user', 'community', 'assigned_by', 'assigned_at')
