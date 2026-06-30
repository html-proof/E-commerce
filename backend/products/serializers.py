from rest_framework import serializers
from .models import Product, Category, Brand, Location, ProductImage, ProductVariant, Wishlist

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'description']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'description']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'city', 'state', 'country']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_main', 'alt_text']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'size', 'color', 'price_override', 'stock']

class ProductSerializer(serializers.ModelSerializer):
    seller_username = serializers.ReadOnlyField(source='seller.username')
    is_wished = serializers.SerializerMethodField()
    
    # Backwards compatibility
    category = serializers.CharField(source='category_str', required=False, allow_null=True, allow_blank=True)
    image = serializers.ImageField(source='image_legacy', required=False, allow_null=True)

    # Full representation for reading
    category_detail = CategorySerializer(source='category_fk', read_only=True)
    brand_detail = BrandSerializer(source='brand', read_only=True)
    location_detail = LocationSerializer(source='location', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    # Fields for writing
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category_fk', write_only=True, required=False, allow_null=True
    )
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source='brand', write_only=True, required=False, allow_null=True
    )
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), source='location', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'stock', 
            'category', 'image', 'created_at', 'seller', 'seller_username',
            'condition', 'listing_type', 'is_digital', 'model_name',
            'category_fk', 'brand', 'location', 
            'category_detail', 'brand_detail', 'location_detail',
            'category_id', 'brand_id', 'location_id',
            'location_text',
            'images', 'variants', 'is_wished'
        ]
        read_only_fields = ['seller', 'category_fk', 'brand', 'location']

    def validate(self, attrs):
        category_fk = attrs.get('category_fk')
        if category_fk and not attrs.get('category_str'):
            attrs['category_str'] = category_fk.name
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        
        variants_data = []
        if request:
            raw_variants = request.data.get('variants')
            if raw_variants:
                import json
                try:
                    if isinstance(raw_variants, str):
                        variants_data = json.loads(raw_variants)
                    elif isinstance(raw_variants, list):
                        variants_data = raw_variants
                except Exception as e:
                    raise serializers.ValidationError({'variants': f'Invalid JSON format: {e}'})

        product = Product.objects.create(**validated_data)

        # Handle multiple images
        if request and request.FILES:
            uploaded_images = request.FILES.getlist('images')
            for index, img_file in enumerate(uploaded_images):
                ProductImage.objects.create(
                    product=product,
                    image=img_file,
                    is_main=(index == 0)
                )

        # If a single image was uploaded in image_legacy, also create a ProductImage for it if no multiple images uploaded
        if product.image_legacy and not product.images.exists():
            ProductImage.objects.create(
                product=product,
                image=product.image_legacy,
                is_main=True
            )

        # Handle variants
        for var_data in variants_data:
            ProductVariant.objects.create(
                product=product,
                sku=var_data.get('sku') or f"{product.id}-{var_data.get('color', '')}-{var_data.get('size', '')}",
                size=var_data.get('size'),
                color=var_data.get('color'),
                price_override=var_data.get('price_override'),
                stock=var_data.get('stock', 0)
            )

        return product

    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if request:
            raw_variants = request.data.get('variants')
            if raw_variants is not None:
                import json
                try:
                    if isinstance(raw_variants, str):
                        variants_data = json.loads(raw_variants)
                    else:
                        variants_data = raw_variants
                    
                    instance.variants.all().delete()
                    for var_data in variants_data:
                        ProductVariant.objects.create(
                            product=instance,
                            sku=var_data.get('sku') or f"{instance.id}-{var_data.get('color', '')}-{var_data.get('size', '')}",
                            size=var_data.get('size'),
                            color=var_data.get('color'),
                            price_override=var_data.get('price_override'),
                            stock=var_data.get('stock', 0)
                        )
                except Exception as e:
                    raise serializers.ValidationError({'variants': f'Invalid format or update failed: {e}'})

            if request.FILES:
                uploaded_images = request.FILES.getlist('images')
                if uploaded_images:
                    instance.images.all().delete()
                    for index, img_file in enumerate(uploaded_images):
                        ProductImage.objects.create(
                            product=instance,
                            image=img_file,
                            is_main=(index == 0)
                        )

        return instance

    def get_is_wished(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.wished_by.filter(user=request.user).exists()
        return False


