from rest_framework import permissions

class IsSellerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow sellers of an object to edit or delete it.
    """
    def has_permission(self, request, view):
        # Allow anyone to view list/detail
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write operations require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the seller of the product or admin
        return obj.seller == request.user or request.user.is_staff
