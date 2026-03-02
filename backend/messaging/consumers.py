"""
WebSocket consumer for real-time direct messaging.
Clients connect to ws://host/ws/messages/{conversation_id}/.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class MessagingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']

        if not self.user.is_authenticated:
            await self.close()
            return

        # Verify the user is a participant in this conversation
        if not await self._is_participant():
            await self.close()
            return

        self.group_name = f'conversation_{self.conversation_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming message from WebSocket client."""
        try:
            data = json.loads(text_data)
            content = data.get('content', '').strip()
            if not content:
                return

            message = await self._save_message(content)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'chat_message',
                    'data': {
                        'id': message.id,
                        'sender': self.user.username,
                        'content': message.content,
                        'created_at': message.created_at.isoformat(),
                        'conversation_id': self.conversation_id,
                    },
                },
            )
        except Exception:
            pass

    async def chat_message(self, event):
        """Broadcast message to WebSocket."""
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def _is_participant(self):
        from messaging.models import Conversation
        from django.db.models import Q
        return Conversation.objects.filter(
            id=self.conversation_id
        ).filter(
            Q(participant_1=self.user) | Q(participant_2=self.user)
        ).exists()

    @database_sync_to_async
    def _save_message(self, content):
        from messaging.models import Conversation, Message
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )
        conversation.save(update_fields=['updated_at'])
        return message
