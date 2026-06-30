from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message, Offer
from products.models import Product


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_username', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'conversation']


class OfferSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    is_received = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            'id', 'conversation', 'product', 'sender', 'sender_username',
            'amount', 'status', 'created_at', 'expires_at', 'is_received'
        ]
        read_only_fields = ['sender', 'status']

    def get_is_received(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender != request.user
        return False


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.ReadOnlyField(source='product.price')
    product_image = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    active_offer = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'other_user', 'product', 'product_name', 'product_price',
            'product_image', 'last_message', 'unread_count', 'active_offer', 'updated_at'
        ]

    def get_other_user(self, obj):
        request_user = self.context['request'].user
        other = obj.participants.exclude(id=request_user.id).first()
        if other:
            return {'id': other.id, 'username': other.username}
        return None

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product and obj.product.image and request:
            return request.build_absolute_uri(obj.product.image.url)
        return None

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'content': msg.content, 'sender_username': msg.sender.username, 'created_at': msg.created_at.isoformat()}
        return None

    def get_unread_count(self, obj):
        request_user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=request_user).count()

    def get_active_offer(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        offer = obj.offers.filter(status__in=['PENDING', 'ACCEPTED', 'COUNTERED']).first()
        if offer:
            return OfferSerializer(offer, context=self.context).data
        return None

