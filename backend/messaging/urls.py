from django.urls import path
from .views import list_conversations, send_message, get_messages, delete_message

urlpatterns = [
    path('', list_conversations, name='list-conversations'),
    path('send/', send_message, name='send-message'),
    path('<int:conversation_id>/messages/', get_messages, name='get-messages'),
    path('messages/<int:message_id>/delete/', delete_message, name='delete-message'),
]
