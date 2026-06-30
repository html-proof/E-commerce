from django.urls import path
from .views import (
    ConversationListView, MessageListView, StartConversationView,
    OfferCreateView, OfferAcceptView, OfferRejectView, OfferCounterView
)

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', StartConversationView.as_view(), name='conversation-start'),
    path('conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='message-list'),
    path('conversations/<int:conversation_id>/offers/', OfferCreateView.as_view(), name='offer-create'),
    path('offers/<int:offer_id>/accept/', OfferAcceptView.as_view(), name='offer-accept'),
    path('offers/<int:offer_id>/reject/', OfferRejectView.as_view(), name='offer-reject'),
    path('offers/<int:offer_id>/counter/', OfferCounterView.as_view(), name='offer-counter'),
]
