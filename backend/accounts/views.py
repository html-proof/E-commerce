from rest_framework import generics, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import UserSerializer, UserProfileSerializer, SellerProfileSerializer, SellerApplicationSerializer
from .models import UserProfile, SellerProfile
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "user": serializer.data,
                "message": "User created successfully"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return get_object_or_404(UserProfile, user=self.request.user)

class SellerProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SellerProfileSerializer

    def get_object(self):
        return get_object_or_404(SellerProfile, user=self.request.user)

class BecomeSellerView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SellerApplicationSerializer

    def perform_create(self, serializer):
        seller_profile = serializer.save(user=self.request.user)
        return seller_profile

    def create(self, request, *args, **kwargs):
        if hasattr(request.user, 'seller_profile'):
            return Response(
                {"error": "User is already a seller"},
                status=status.HTTP_400_BAD_REQUEST
            )
        response = super().create(request, *args, **kwargs)
        return response
