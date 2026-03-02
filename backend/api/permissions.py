from rest_framework.permissions import BasePermission


class IsPostOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            obj.user == request.user
            or request.user.role in ('ADMIN', 'MODERATOR')
        )


class IsAdminRole(BasePermission):
    """Only platform ADMIN can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsAdminOrModeratorRole(BasePermission):
    """Platform ADMIN or MODERATOR can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('ADMIN', 'MODERATOR')
