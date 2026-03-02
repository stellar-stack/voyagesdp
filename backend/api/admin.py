from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'violation_count', 'is_suspended', 'is_active', 'date_joined')
    list_filter = ('role', 'email_verified', 'is_active', 'is_deleted')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    readonly_fields = ('violation_count', 'last_violation_at', 'date_joined', 'deleted_at')

    fieldsets = UserAdmin.fieldsets + (
        ('Voyage Profile', {
            'fields': ('gender', 'dob', 'country', 'bio', 'profile_picture', 'role')
        }),
        ('Account Status', {
            'fields': ('suspended_until', 'email_verified', 'is_deleted', 'deleted_at')
        }),
        ('AI Moderation', {
            'fields': ('violation_count', 'last_violation_at')
        }),
    )
