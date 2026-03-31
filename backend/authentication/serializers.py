from rest_framework import serializers
from .models import User


class UserSerializer(serializers.Serializer):
    """Sérialise un User pour les réponses (lecture seule pour les champs sensibles)."""
    id         = serializers.CharField(read_only=True)
    email      = serializers.EmailField(read_only=True)
    first_name = serializers.CharField()
    last_name  = serializers.CharField()
    role       = serializers.ChoiceField(choices=('admin', 'manager', 'employee'))
    is_active  = serializers.BooleanField()
    created_at = serializers.DateTimeField(read_only=True)


class RegisterSerializer(serializers.Serializer):
    """Validation + création d'un nouvel utilisateur."""
    email      = serializers.EmailField()
    password   = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=100, default='', allow_blank=True)
    last_name  = serializers.CharField(max_length=100, default='', allow_blank=True)
    role       = serializers.ChoiceField(
        choices=('admin', 'manager', 'employee'),
        default='employee'
    )

    def validate_email(self, value):
        if User.objects(email=value.lower()).first():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Validation des données de connexion."""
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower()


class UpdateProfileSerializer(serializers.Serializer):
    """Mise à jour du profil (champs autorisés seulement)."""
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name  = serializers.CharField(max_length=100, required=False, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Au moins 8 caractères requis.")
        return value