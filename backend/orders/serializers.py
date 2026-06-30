from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem

from chat.models import Offer

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity']

    def get_product_price(self, obj):
        # Check if there is an accepted offer for this product by the cart's owner
        accepted_offer = Offer.objects.filter(
            product=obj.product,
            conversation__participants=obj.cart.user,
            status='ACCEPTED'
        ).first()
        if accepted_offer:
            return accepted_offer.amount
        return obj.product.price

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_price']

    def get_total_price(self, obj):
        total = 0
        for item in obj.items.all():
            accepted_offer = Offer.objects.filter(
                product=item.product,
                conversation__participants=obj.user,
                status='ACCEPTED'
            ).first()
            price = accepted_offer.amount if accepted_offer else item.product.price
            total += price * item.quantity
        return total

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_price', 'status', 'created_at', 'items']
