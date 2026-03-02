from django.contrib import admin
from .models import Report, Notification, AIViolationLog

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'reported_user', 'reported_by', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('reported_user__username', 'reported_by__username')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notif_type', 'is_read', 'created_at')
    list_filter = ('notif_type', 'is_read')
    search_fields = ('user__username',)

@admin.register(AIViolationLog)
class AIViolationLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'content_type', 'action_taken', 'violation_number', 'is_false_positive', 'flagged_at')
    list_filter = ('content_type', 'action_taken', 'is_false_positive')
    search_fields = ('user__username',)
    readonly_fields = ('flagged_at',)
