from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Location(models.Model):
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.city}, {self.state}, {self.country}"

class Product(models.Model):
    CONDITION_CHOICES = (
        ('NEW', 'New'),
        ('USED', 'Used'),
        ('REFURBISHED', 'Refurbished'),
    )
    LISTING_TYPE_CHOICES = (
        ('CLASSIFIED', 'Classified'),
        ('FIXED', 'Fixed Price'),
    )

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)

    # Transition fields - Keep string category to avoid DB type errors
    category_str = models.CharField(max_length=100, null=True, blank=True)
    image_legacy = models.ImageField(upload_to='products/', null=True, blank=True)

    # New Fields
    category_fk = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    # Free-text location: city, district, town, village – any place on earth (from Nominatim)
    location_text = models.CharField(max_length=500, blank=True, null=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='NEW', null=True, blank=True)
    listing_type = models.CharField(max_length=20, choices=LISTING_TYPE_CHOICES, default='FIXED', null=True, blank=True)
    is_digital = models.BooleanField(default=False)
    model_name = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def category(self):
        return self.category_str or (self.category_fk.name if self.category_fk else None)

    @property
    def image(self):
        return self.image_legacy

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    is_main = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Image for {self.product.name}"

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=100, unique=True)
    size = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} - {self.color} {self.size}"

class Wishlist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, related_name='wished_by', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wishlist for {self.user.username}"
