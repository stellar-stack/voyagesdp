"""
JWT Cookie authentication middleware for Django Channels WebSocket connections.
Reads the access_token cookie from the WebSocket handshake headers and
authenticates the user before the consumer is called.
"""
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        scope['user'] = await self._get_user(scope)
        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def _get_user(self, scope):
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError
        from api.models import User

        headers = dict(scope.get('headers', []))
        cookies = {}
        if b'cookie' in headers:
            for part in headers[b'cookie'].decode().split('; '):
                if '=' in part:
                    k, v = part.split('=', 1)
                    cookies[k.strip()] = v.strip()

        access_token = cookies.get('access_token')
        if not access_token:
            return AnonymousUser()

        try:
            token = AccessToken(access_token)
            return User.objects.get(id=token['user_id'], is_active=True)
        except (TokenError, User.DoesNotExist):
            return AnonymousUser()
