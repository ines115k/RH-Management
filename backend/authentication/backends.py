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

        user = self.get_user(validated_token)
        
        if not user.is_active:
            raise AuthenticationFailed("Ce compte est désactivé.")

        return (user, validated_token)

    def get_user(self, validated_token):
        """Récupère l'utilisateur à partir du token JWT validé."""
        try:
            user_id = validated_token.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Token invalide : user_id manquant.')
            
            # Conversion explicite en ObjectId pour MongoDB
            user = User.objects.get(pk=ObjectId(user_id))
            return user
        except Exception as e:
            print(f"Erreur get_user: {e}")
            raise AuthenticationFailed('Utilisateur introuvable ou token expiré.')

    def authenticate_header(self, request):
        return 'Bearer realm="api"'