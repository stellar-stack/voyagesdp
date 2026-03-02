from django.urls import path
from .views import (
    create_post, get_feed, community_feed, user_posts,
    toggle_reaction, share_post,
    add_comment, get_comments,
    get_post, edit_post, delete_post,
    toggle_bookmark, list_bookmarks,
)

urlpatterns = [
    path('create/', create_post, name='create-post'),
    path('feed/', get_feed, name='post-feed'),
    path('community/<int:community_id>/', community_feed, name='community-feed'),
    path('user/<str:username>/', user_posts, name='user-posts'),
    path('react/', toggle_reaction, name='toggle-reaction'),
    path('share/', share_post, name='share-post'),
    path('comment/', add_comment, name='add-comment'),
    path('bookmarks/', list_bookmarks, name='list-bookmarks'),
    path('<int:post_id>/', get_post, name='get-post'),
    path('<int:post_id>/comments/', get_comments, name='get-comments'),
    path('<int:post_id>/edit/', edit_post, name='edit-post'),
    path('<int:post_id>/delete/', delete_post, name='delete-post'),
    path('<int:post_id>/bookmark/', toggle_bookmark, name='toggle-bookmark'),
]
