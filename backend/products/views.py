from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
import urllib.request
import urllib.parse
import json
from .models import Product, Category, Brand, Location, Wishlist
from .serializers import (
    ProductSerializer, CategorySerializer, BrandSerializer, LocationSerializer
)
from .permissions import IsSellerOrReadOnly

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]

class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsSellerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def get_queryset(self):
        queryset = Product.objects.all().select_related('seller', 'category_fk', 'brand', 'location').prefetch_related('images', 'variants')
        
        q = self.request.query_params.get('q')
        category_id = self.request.query_params.get('category')
        brand_id = self.request.query_params.get('brand')
        location_id = self.request.query_params.get('location')
        condition = self.request.query_params.get('condition')
        listing_type = self.request.query_params.get('listing_type')
        price_min = self.request.query_params.get('price_min')
        price_max = self.request.query_params.get('price_max')

        if q:
            queryset = queryset.filter(Q(name__icontains=q) | Q(description__icontains=q) | Q(model_name__icontains=q))
        if category_id:
            queryset = queryset.filter(category_fk_id=category_id)
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        if location_id:
            # If it looks like an integer, try FK match too; otherwise text-search only
            try:
                loc_pk = int(location_id)
                queryset = queryset.filter(
                    Q(location_id=loc_pk) | Q(location_text__icontains=location_id)
                )
            except ValueError:
                # Free-text location search (from autocomplete)
                queryset = queryset.filter(location_text__icontains=location_id)
        if condition:
            queryset = queryset.filter(condition=condition)
        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)
        if price_min:
            try:
                queryset = queryset.filter(price__gte=float(price_min))
            except ValueError:
                pass
        if price_max:
            try:
                queryset = queryset.filter(price__lte=float(price_max))
            except ValueError:
                pass

        return queryset

class WishlistListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        wishlist, created = Wishlist.objects.get_or_create(user=self.request.user)
        return wishlist.products.all().select_related('seller', 'category_fk', 'brand', 'location').prefetch_related('images', 'variants')

class WishlistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        
        if wishlist.products.filter(id=product.id).exists():
            wishlist.products.remove(product)
            wished = False
        else:
            wishlist.products.add(product)
            wished = True

        return Response({'wished': wished}, status=status.HTTP_200_OK)


class GeocodeProxyView(APIView):
    """Proxy for OpenStreetMap Nominatim geocoding API.
    Forwards location search queries to Nominatim and returns results.
    Covers every city, district, town, village, and small settlement in the world.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response([])
        
        params = urllib.parse.urlencode({
            'q': q,
            'format': 'json',
            'addressdetails': 1,
            'limit': 8,
            'featuretype': 'settlement',
        })
        url = f'https://nominatim.openstreetmap.org/search?{params}'
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'MarketHub-Marketplace/1.0 (marketplace-app)'}
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            
            results = []
            seen = set()
            for item in data:
                addr = item.get('address', {})
                parts = [
                    addr.get('village') or addr.get('town') or addr.get('city') or addr.get('county') or addr.get('state_district'),
                    addr.get('state') or addr.get('region'),
                    addr.get('country'),
                ]
                label = ', '.join(p for p in parts if p)
                if not label:
                    label = item.get('display_name', '')[:100]
                if label not in seen:
                    seen.add(label)
                    results.append({
                        'label': label,
                        'display_name': item.get('display_name', ''),
                        'lat': item.get('lat'),
                        'lon': item.get('lon'),
                        'type': item.get('type'),
                    })
            return Response(results)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
