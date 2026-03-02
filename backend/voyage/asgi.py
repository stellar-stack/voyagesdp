import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voyage.settings')

# Import Django ASGI app first before importing consumers
django_asgi_app = get_asgi_application()

from voyage.middleware import JWTAuthMiddleware
from api.consumers import NotificationConsumer
from messaging.consumers import MessagingConsumer

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': JWTAuthMiddleware(
        URLRouter([
            path('ws/notifications/', NotificationConsumer.as_asgi()),
            path('ws/messages/<int:conversation_id>/', MessagingConsumer.as_asgi()),
        ])
    ),
})
