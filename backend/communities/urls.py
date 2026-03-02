from django.urls import path
from .views import (
    create_community, list_communities, community_detail, update_community,
    delete_community, toggle_join_community, community_members, my_communities,
    user_communities, assign_moderator, remove_moderator,
)

urlpatterns = [
    path('create/', create_community, name='create-community'),
    path('', list_communities, name='list-communities'),
    path('<int:id>/', community_detail, name='community-detail'),
    path('<int:id>/update/', update_community, name='update-community'),
    path('<int:id>/delete/', delete_community, name='delete-community'),
    path('join/', toggle_join_community, name='join-community'),
    path('<int:id>/members/', community_members, name='community-members'),
    path('me/', my_communities, name='my-communities'),
    path('user/<str:username>/', user_communities, name='user-communities'),
    path('<int:id>/moderators/add/', assign_moderator, name='assign-moderator'),
    path('<int:id>/moderators/<int:user_id>/remove/', remove_moderator, name='remove-moderator'),
]
