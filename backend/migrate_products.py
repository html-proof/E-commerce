import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.models import Product, Category, ProductImage
from django.utils.text import slugify

def migrate_data():
    print("Starting data migration...")
    products = Product.objects.all()

    for product in products:
        # 1. Migrate Category
        if product.category:
            cat_name = product.category.strip()
            cat, created = Category.objects.get_or_create(
                name=cat_name,
                defaults={'slug': slugify(cat_name)}
            )
            product.category_fk = cat

            # Handle potential slug collisions if get_or_create failed to set a unique one
            # in a real scenario we'd handle this better, but for this demo we'll keep it simple.

        # 2. Migrate Image
        if product.image:
            ProductImage.objects.create(
                product=product,
                image=product.image,
                is_main=True
            )

        product.save()
        print(f"Migrated product: {product.name}")

    print("Data migration completed successfully.")

if __name__ == "__main__":
    migrate_data()
