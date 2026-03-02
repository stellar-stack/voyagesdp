from django.urls import path
from .views import (
    CustomTokenObtainPairView, CustomTokenRefreshView,
    logout, register, verify_email,
    get_my_profile, get_user_profile, update_my_profile,
    toggle_follow, get_followers, get_following, search_users, list_all_users,
    suspend_user, clear_violations, promote_user,
)
from .oauth_views import google_oauth, github_oauth

urlpatterns = [
    # Auth
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register, name='register'),
    path('verify-email/', verify_email, name='verify-email'),
    path('logout/', logout, name='logout'),

    # Current user
    path('users/me/', get_my_profile, name='my-profile'),
    path('users/me/update/', update_my_profile, name='update-profile'),

    # Social — must be before <str:username> to avoid "follow" matching as a username
    path('users/follow/', toggle_follow, name='toggle-follow'),

    # User lookup
    path('users/search/', search_users, name='search-users'),
    path('users/<str:username>/', get_user_profile, name='user-profile'),
    path('users/<str:username>/followers/', get_followers, name='user-followers'),
    path('users/<str:username>/following/', get_following, name='user-following'),

    # Social OAuth
    path('social/google/', google_oauth, name='google-oauth'),
    path('social/github/', github_oauth, name='github-oauth'),

    # Admin actions
    path('admin/users/', list_all_users, name='list-all-users'),
    path('admin/users/<int:user_id>/suspend/', suspend_user, name='suspend-user'),
    path('admin/users/<int:user_id>/violations/clear/', clear_violations, name='clear-violations'),
    path('admin/users/<int:user_id>/promote/', promote_user, name='promote-user'),
]
