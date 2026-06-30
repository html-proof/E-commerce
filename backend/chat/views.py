from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Conversation, Message, Offer
from .serializers import ConversationSerializer, MessageSerializer, OfferSerializer
from products.models import Product
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class ConversationListView(generics.ListAPIView):
    """List all conversations for the logged-in user."""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).prefetch_related('participants', 'messages')


class MessageListView(generics.ListAPIView):
    """List all messages in a specific conversation."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = Conversation.objects.get(id=conversation_id)
        # Mark messages as read
        conversation.messages.exclude(sender=self.request.user).update(is_read=True)
        return conversation.messages.all()


class StartConversationView(APIView):
    """
    Start or get an existing conversation between a buyer and seller about a product.
    POST { product_id: <id> }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        seller = product.seller
        if not seller:
            return Response({'error': 'This product has no seller.'}, status=status.HTTP_400_BAD_REQUEST)

        if seller == request.user:
            return Response({'error': 'You cannot chat with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find existing conversation between this buyer, seller about this product
        existing = Conversation.objects.filter(
            participants=request.user,
            product=product
        ).filter(participants=seller).first()

        if existing:
            serializer = ConversationSerializer(existing, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Create new conversation
        conversation = Conversation.objects.create(product=product)
        conversation.participants.add(request.user, seller)
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OfferCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount_dec = float(amount)
            if amount_dec <= 0:
                raise ValueError
        except ValueError:
            return Response({'error': 'amount must be a positive number'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark any active pending/countered offers for this conversation as EXPIRED
        Offer.objects.filter(conversation=conversation, status__in=['PENDING', 'COUNTERED']).update(status='EXPIRED')

        # Create new offer
        offer = Offer.objects.create(
            conversation=conversation,
            product=conversation.product,
            sender=request.user,
            amount=amount,
            status='PENDING'
        )

        serializer = OfferSerializer(offer, context={'request': request})
        
        # Broadcast via Channel Layer
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation_id}',
            {
                'type': 'offer_update',
                'offer': serializer.data
            }
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OfferAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(id=offer_id, conversation__participants=request.user)
        except Offer.DoesNotExist:
            return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)

        if offer.status != 'PENDING':
            return Response({'error': f'Offer is already {offer.status}'}, status=status.HTTP_400_BAD_REQUEST)

        if offer.sender == request.user:
            return Response({'error': 'You cannot accept your own offer'}, status=status.HTTP_400_BAD_REQUEST)

        # Accept the offer
        offer.status = 'ACCEPTED'
        offer.save()

        # Mark other offers in this conversation as EXPIRED
        Offer.objects.filter(conversation=offer.conversation, status__in=['PENDING', 'COUNTERED']).exclude(id=offer.id).update(status='EXPIRED')

        serializer = OfferSerializer(offer, context={'request': request})

        # Broadcast via Channel Layer
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{offer.conversation.id}',
            {
                'type': 'offer_update',
                'offer': serializer.data
            }
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class OfferRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(id=offer_id, conversation__participants=request.user)
        except Offer.DoesNotExist:
            return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)

        if offer.status != 'PENDING':
            return Response({'error': f'Offer is already {offer.status}'}, status=status.HTTP_400_BAD_REQUEST)

        if offer.sender == request.user:
            return Response({'error': 'You cannot reject your own offer'}, status=status.HTTP_400_BAD_REQUEST)

        # Reject the offer
        offer.status = 'REJECTED'
        offer.save()

        serializer = OfferSerializer(offer, context={'request': request})

        # Broadcast via Channel Layer
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{offer.conversation.id}',
            {
                'type': 'offer_update',
                'offer': serializer.data
            }
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class OfferCounterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(id=offer_id, conversation__participants=request.user)
        except Offer.DoesNotExist:
            return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)

        if offer.status != 'PENDING':
            return Response({'error': f'Offer is already {offer.status}'}, status=status.HTTP_400_BAD_REQUEST)

        if offer.sender == request.user:
            return Response({'error': 'You cannot counter your own offer'}, status=status.HTTP_400_BAD_REQUEST)

        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'amount is required for counter offer'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount_dec = float(amount)
            if amount_dec <= 0:
                raise ValueError
        except ValueError:
            return Response({'error': 'amount must be a positive number'}, status=status.HTTP_400_BAD_REQUEST)

        # Counter current offer (mark as COUNTERED)
        offer.status = 'COUNTERED'
        offer.save()

        # Create counter offer (new offer with current user as sender)
        counter_offer = Offer.objects.create(
            conversation=offer.conversation,
            product=offer.product,
            sender=request.user,
            amount=amount,
            status='PENDING'
        )

        serializer = OfferSerializer(counter_offer, context={'request': request})

        # Broadcast via Channel Layer
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{offer.conversation.id}',
            {
                'type': 'offer_update',
                'offer': serializer.data
            }
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

