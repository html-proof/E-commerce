import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

def reset_tables():
    tables = [
        'products_brand',
        'products_location',
        'products_productimage',
        'products_productvariant',
        'products_category',
    ]
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA foreign_keys = OFF;")
        for table in tables:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
                print(f"Dropped table {table}")
            except Exception as e:
                print(f"Could not drop table {table}: {e}")
        cursor.execute("PRAGMA foreign_keys = ON;")

if __name__ == "__main__":
    reset_tables()
