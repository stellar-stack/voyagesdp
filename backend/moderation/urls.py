from django.urls import path
from .views import (
    create_report, list_reports, resolve_report,
    admin_delete_post, suspend_user, admin_stats,
    get_notifications, mark_notification_read, mark_all_notifications_read,
    list_ai_violations, mark_false_positive,
)

urlpatterns = [
    # Reports
    path('reports/create/', create_report, name='create-report'),
    path('reports/', list_reports, name='list-reports'),
    path('reports/<int:report_id>/resolve/', resolve_report, name='resolve-report'),

    # Admin post/user management
    path('posts/<int:post_id>/delete/', admin_delete_post, name='admin-delete-post'),
    path('users/<int:user_id>/suspend/', suspend_user, name='moderation-suspend-user'),

    # Notifications
    path('notifications/', get_notifications, name='get-notifications'),
    path('notifications/<int:notif_id>/read/', mark_notification_read, name='mark-notification-read'),
    path('notifications/read-all/', mark_all_notifications_read, name='mark-all-read'),

    # AI violation management
    path('ai-violations/', list_ai_violations, name='ai-violations'),
    path('ai-violations/<int:violation_id>/false-positive/', mark_false_positive, name='mark-false-positive'),

    # Admin dashboard stats
    path('stats/', admin_stats, name='admin-stats'),
]
