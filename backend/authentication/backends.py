"""
Backend JWT personnalisé pour MongoEngine.
Lit le header Authorization: Bearer <token>,
valide le JWT et retourne l'utilisateur MongoDB.
"""
from bson import ObjectId
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import User


class MongoJWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')

        if not header.startswith('Bearer '):
            return None

        raw_token = header.split(' ', 1)[1].strip()
        if not raw_token:
            return None

        try:
            validated_token = AccessToken(raw_token)
        except (InvalidToken, TokenError) as exc:
            raise AuthenticationFailed(f"Token invalide : {exc}")

        user_id = validated_token.get('user_id')
        if not user_id:
            raise AuthenticationFailed("Token invalide : user_id manquant.")

        # user_id est une str (ex: "6613a2f4e3b1c2d3e4f50001")
        # On convertit en ObjectId pour MongoEngine
        try:
            oid = ObjectId(str(user_id))
            user = User.objects.get(pk=oid)
        except Exception:
            raise AuthenticationFailed("Utilisateur introuvable ou token expiré.")

        if not user.is_active:
            raise AuthenticationFailed("Ce compte est désactivé.")

        return (user, validated_token)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'