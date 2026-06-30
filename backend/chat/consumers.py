import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Conversation, Message


class ChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get('user')
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Verify user is part of this conversation
        is_participant = await self.is_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        message_content = content.get('message', '').strip()
        if not message_content:
            return

        # Save message to database
        message = await self.save_message(message_content)

        # Broadcast to the room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message.id,
                    'content': message.content,
                    'sender_id': self.user.id,
                    'sender_username': self.user.username,
                    'created_at': message.created_at.isoformat(),
                }
            }
        )

    async def chat_message(self, event):
        await self.send_json(event['message'])

    async def offer_update(self, event):
        await self.send_json({
            'type': 'offer_update',
            'offer': event['offer']
        })


    @database_sync_to_async
    def is_participant(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        conversation.save()  # Update 'updated_at'
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )
        return message
