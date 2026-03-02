from rest_framework.permissions import BasePermission


class IsAdminOrModerator(BasePermission):
    """Platform ADMIN or MODERATOR."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('ADMIN', 'MODERATOR')
        )


class IsAdmin(BasePermission):
    """Platform ADMIN only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'
