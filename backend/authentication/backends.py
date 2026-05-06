"""
Backend JWT pour MongoEngine.

On utilise BaseAuthentication (pas JWTAuthentication) pour éviter
tout lookup ORM Django. AccessToken est utilisé uniquement pour la
vérification cryptographique du token (signature + expiration),
sans jamais appeler User.objects.get() de Django.
"""
from bson import ObjectId
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User


class MongoJWTAuthentication(BaseAuthentication):
    """
    Authentification JWT avec MongoEngine.
    Décode manuellement le token JWT sans passer par l'ORM Django.
    """

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')

        if not header.startswith('Bearer '):
            return None

        raw_token = header.split(' ', 1)[1].strip()
        if not raw_token:
            return None

        # Décoder et valider le token sans toucher l'ORM Django
        payload = self._decode_token(raw_token)

        user_id = payload.get('user_id')
        if not user_id:
            raise AuthenticationFailed("Token invalide : claim 'user_id' manquant.")

        # Lookup MongoDB
        try:
            oid  = ObjectId(str(user_id))
            user = User.objects.get(pk=oid)
        except Exception:
            raise AuthenticationFailed("Utilisateur introuvable.")

        if not user.is_active:
            raise AuthenticationFailed("Ce compte est désactivé.")

        return (user, payload)

    def _decode_token(self, raw_token):
        """
        Valide le token JWT en utilisant PyJWT directement —
        sans importer quoi que ce soit de django.contrib.auth.
        """
        from django.conf import settings
        import jwt as pyjwt

        try:
            payload = pyjwt.decode(
                raw_token,
                settings.SECRET_KEY,
                algorithms=['HS256'],
            )
            return payload
        except pyjwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token expiré. Veuillez vous reconnecter.")
        except pyjwt.InvalidTokenError as e:
            raise AuthenticationFailed(f"Token invalide : {e}")

    def authenticate_header(self, request):
        return 'Bearer realm="api"'