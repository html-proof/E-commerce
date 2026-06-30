from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, BrandViewSet, LocationViewSet, WishlistListView, WishlistToggleView, GeocodeProxyView

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'locations', LocationViewSet)

urlpatterns = [
    path('products/wishlist/', WishlistListView.as_view(), name='wishlist-list'),
    path('products/wishlist/toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
    path('geocode/', GeocodeProxyView.as_view(), name='geocode-proxy'),
    path('', include(router.urls)),
]
