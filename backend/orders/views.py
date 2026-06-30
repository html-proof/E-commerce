from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from .models import Cart, CartItem, Order, OrderItem
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer
from products.models import Product
from chat.models import Conversation, Offer
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    def get_cart(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def current(self, request):
        return self.get_cart(request)

    @action(detail=False, methods=['post'])
    def add(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
        except (Product.DoesNotExist, ValueError):
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        cart_item.quantity += quantity
        cart_item.save()

        return Response({'message': 'Product added to cart'}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'])
    def remove(self, request):
        product_id = request.data.get('product_id')
        cart = Cart.objects.get(user=request.user)
        try:
            item = CartItem.objects.get(cart=cart, product_id=product_id)
            item.delete()
            return Response({'message': 'Product removed from cart'}, status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({'error': 'Product not found in cart'}, status=status.HTTP_404_NOT_FOUND)

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    queryset = Order.objects.all()

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        cart = Cart.objects.get(user=request.user)
        items = cart.items.all()

        if not items:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate total price accounting for accepted offers
        total_price = 0
        for item in items:
            accepted_offer = Offer.objects.filter(
                product=item.product,
                conversation__participants=request.user,
                status='ACCEPTED'
            ).first()
            price = accepted_offer.amount if accepted_offer else item.product.price
            total_price += price * item.quantity

        order = Order.objects.create(
            user=request.user,
            total_price=total_price,
            status='Pending'
        )

        for item in items:
            accepted_offer = Offer.objects.filter(
                product=item.product,
                conversation__participants=request.user,
                status='ACCEPTED'
            ).first()
            price = accepted_offer.amount if accepted_offer else item.product.price

            OrderItem.objects.create(
                order=order,
                product=item.product,
                price=price,
                quantity=item.quantity
            )
            # Update product stock
            product = item.product
            product.stock -= item.quantity
            product.save()

            # Expire the accepted offer so it cannot be reused
            if accepted_offer:
                accepted_offer.status = 'EXPIRED'
                accepted_offer.save()

        # Clear cart
        items.delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AdminOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = OrderSerializer
    queryset = Order.objects.all()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_users = User.objects.count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        total_revenue = Order.objects.aggregate(Sum('total_price'))['total_price_sum'] or 0

        return Response({
            'total_users': total_users,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': total_revenue
        })


class SellerDashboardView(APIView):
    """Seller analytics dashboard — returns stats for the logged-in seller."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        seller = request.user
        products = Product.objects.filter(seller=seller)

        # Total listings
        total_listings = products.count()

        # Sold (stock == 0 and at least one order item)
        sold_product_ids = OrderItem.objects.filter(
            product__seller=seller
        ).values_list('product_id', flat=True).distinct()
        sold_listings = products.filter(id__in=sold_product_ids, stock=0).count()
        active_listings = products.filter(stock__gt=0).count()

        # Total units sold & revenue earned
        order_items = OrderItem.objects.filter(product__seller=seller)
        total_units_sold = order_items.aggregate(total=Sum('quantity'))['total'] or 0
        total_revenue = order_items.aggregate(
            revenue=Sum('price')
        )['revenue'] or 0

        # Total orders containing seller's products
        total_orders = Order.objects.filter(
            items__product__seller=seller
        ).distinct().count()

        # Chat requests (conversations about seller's products)
        chat_requests = Conversation.objects.filter(product__seller=seller).count()

        # Revenue over last 7 days (day-by-day)
        today = timezone.now().date()
        revenue_chart = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_revenue = OrderItem.objects.filter(
                product__seller=seller,
                order__created_at__date=day
            ).aggregate(rev=Sum('price'))['rev'] or 0
            revenue_chart.append({
                'date': day.strftime('%b %d'),
                'revenue': float(day_revenue),
            })

        # Per-product breakdown
        product_stats = []
        for product in products:
            items = OrderItem.objects.filter(product=product)
            units = items.aggregate(total=Sum('quantity'))['total'] or 0
            rev = items.aggregate(rev=Sum('price'))['rev'] or 0
            product_stats.append({
                'id': product.id,
                'name': product.name,
                'category': product.category,
                'price': float(product.price),
                'stock': product.stock,
                'image': request.build_absolute_uri(product.image.url) if product.image else None,
                'units_sold': units,
                'revenue': float(rev),
                'status': 'Active' if product.stock > 0 else 'Sold Out',
            })

        return Response({
            'summary': {
                'total_listings': total_listings,
                'active_listings': active_listings,
                'sold_listings': sold_listings,
                'total_revenue': float(total_revenue),
                'total_units_sold': total_units_sold,
                'total_orders': total_orders,
                'chat_requests': chat_requests,
            },
            'revenue_chart': revenue_chart,
            'products': product_stats,
        })
