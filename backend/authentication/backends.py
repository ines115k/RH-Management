"""
Backend d'authentification JWT pour MongoEngine.
Remplace le backend ORM par défaut de djangorestframework-simplejwt.
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import User


class MongoJWTAuthentication(BaseAuthentication):
    """
    Lit le header :  Authorization: Bearer <access_token>
    Valide le JWT et retourne l'objet User MongoDB.
    """

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')

        if not header.startswith('Bearer '):
            return None  # Laisse passer — pas une requête JWT

        raw_token = header.split(' ', 1)[1].strip()
        if not raw_token:
            return None

        try:
            validated_token = AccessToken(raw_token)
        except (InvalidToken, TokenError) as exc:
            raise AuthenticationFailed(f"Token invalide : {exc}")

        user_id = validated_token.get('user_id')
        if not user_id:
            raise AuthenticationFailed("Token invalide : champ user_id manquant.")

        try:
            user = User.objects.get(pk=user_id)
        except Exception:
            raise AuthenticationFailed("Utilisateur introuvable ou token expiré.")

        if not user.is_active:
            raise AuthenticationFailed("Ce compte est désactivé.")

        return (user, validated_token)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'