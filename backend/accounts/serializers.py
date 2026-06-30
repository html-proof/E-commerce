from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, SellerProfile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username = serializers.EmailField(label="Email")

    def validate(self, attrs):
        email = attrs.get('username')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid password.")

        return {
            'user': user,
            'token': self.get_token(user),
            'refresh': self.get_token(user), # this is not quite right for simplejwt but it's what the default does in some versions, actually TokenObtainPairSerializer.validate returns the token and refresh token.
        }

    # Overriding the default validate to be more compatible with SimpleJWT's internal structure
    def validate(self, attrs):
        email = attrs.get('username')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("An error occurred. Please check your email and password.")

        # The base TokenObtainPairSerializer.validate() handles password check and token generation
        # but it uses self.username. We've already set the user in a way that we can potentially
        # trick the base class or just implement it ourselves.

        # Let's actually use the base class's validation but change how it finds the user.
        # SimpleJWT's TokenObtainPairSerializer.validate calls self.get_user() internally or
        # uses the provided username.

        # A better way:
        return super().validate(attrs)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'address', 'avatar', 'joined_at']
        read_only_fields = ['joined_at']

class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['store_name', 'bio', 'verification_status', 'trust_score', 'average_rating', 'total_sales']
        read_only_fields = ['verification_status', 'trust_score', 'average_rating', 'total_sales']

class SellerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['store_name', 'bio']
