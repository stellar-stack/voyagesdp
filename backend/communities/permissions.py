from rest_framework.permissions import BasePermission
from .models import CommunityMembership, CommunityModerator


class IsCommunityCreator(BasePermission):
    """Only the community creator can perform this action."""
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user or request.user.role == 'ADMIN'


class IsCommunityModeratorOrAdmin(BasePermission):
    """Community moderator, creator, or platform admin/moderator."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ('ADMIN', 'MODERATOR'):
            return True
        if obj.created_by == request.user:
            return True
        return CommunityModerator.objects.filter(user=request.user, community=obj).exists()


class IsCommunityMember(BasePermission):
    """Only community members can access."""
    def has_object_permission(self, request, view, obj):
        return CommunityMembership.objects.filter(user=request.user, community=obj).exists()
