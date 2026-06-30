from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, OrderViewSet, AdminOrderViewSet, SellerDashboardView

router = DefaultRouter()
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'admin/orders', AdminOrderViewSet, basename='admin-orders')

urlpatterns = [
    path('', include(router.urls)),
    path('seller/dashboard/', SellerDashboardView.as_view(), name='seller-dashboard'),
]
