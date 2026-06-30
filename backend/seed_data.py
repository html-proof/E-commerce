import os
import django
from django.utils.text import slugify

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.models import Category, Brand, Location

def seed_db():
    print("Seeding database categories, brands, and locations...")

    # 1. Categories
    categories = [
        "Mobiles", "Electronics", "Vehicles", "Bikes", 
        "Properties", "Furniture", "Fashion", "Books", 
        "Jobs", "Services", "Pets"
    ]
    for cat_name in categories:
        cat, created = Category.objects.get_or_create(
            name=cat_name,
            defaults={'slug': slugify(cat_name), 'description': f'{cat_name} marketplace listings.'}
        )
        if created:
            print(f"Created Category: {cat_name}")

    # 2. Brands
    brands = [
        "Apple", "Samsung", "Sony", "Nike", "Toyota", "Honda", "IKEA", "Dell", "Generic"
    ]
    for brand_name in brands:
        brand, created = Brand.objects.get_or_create(
            name=brand_name,
            defaults={'slug': slugify(brand_name), 'description': f'Products by {brand_name}.'}
        )
        if created:
            print(f"Created Brand: {brand_name}")

    # 3. Locations
    locations = [
        {"city": "Miami", "state": "FL", "country": "USA"},
        {"city": "Los Angeles", "state": "CA", "country": "USA"},
        {"city": "New York", "state": "NY", "country": "USA"},
        {"city": "Houston", "state": "TX", "country": "USA"},
        {"city": "Chicago", "state": "IL", "country": "USA"},
    ]
    for loc_data in locations:
        loc, created = Location.objects.get_or_create(
            city=loc_data["city"],
            state=loc_data["state"],
            country=loc_data["country"]
        )
        if created:
            print(f"Created Location: {loc.city}, {loc.state}")

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
