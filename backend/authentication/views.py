from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer,
    UserSerializer, UpdateProfileSerializer,
    ChangePasswordSerializer
)


def get_tokens_for_user(user):
    """
    Génère access + refresh JWT pour un utilisateur MongoEngine.
    IMPORTANT : on convertit explicitement l'ObjectId en str —
    jwt.encode() ne sait pas sérialiser ObjectId en JSON.
    """
    # str(user.pk) fonctionne même si la propriété @id est écrasée par MongoEngine
    user_id_str = str(user.pk)

    refresh = RefreshToken()
    refresh['user_id']    = user_id_str          # ← str, pas ObjectId
    refresh['email']      = str(user.email)
    refresh['role']       = str(user.role)
    refresh['first_name'] = str(user.first_name or '')
    refresh['last_name']  = str(user.last_name  or '')

    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


# ── Register ──────────────────────────────────────────────────────────────────
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                'user':   UserSerializer(user).data,
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Login ─────────────────────────────────────────────────────────────────────
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Chercher l'utilisateur par email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': f'Erreur serveur : {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Vérifier le mot de passe
        if not user.check_password(password):
            return Response(
                {'detail': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Vérifier que le compte est actif
        if not user.is_active:
            return Response(
                {'detail': 'Ce compte est désactivé. Contactez votre administrateur.'},
                status=status.HTTP_403_FORBIDDEN
            )

        tokens = get_tokens_for_user(user)
        return Response({
            'user':   UserSerializer(user).data,
            'tokens': tokens,
        })


# ── Logout ────────────────────────────────────────────────────────────────────
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Déconnexion réussie.'})


# ── Profile ───────────────────────────────────────────────────────────────────
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        user.save()
        return Response(UserSerializer(user).data)


# ── Change Password ───────────────────────────────────────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Ancien mot de passe incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Mot de passe mis à jour avec succès.'})


# ── Refresh Token ─────────────────────────────────────────────────────────────
class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh = RefreshToken(request.data.get('refresh', ''))
            return Response({'access': str(refresh.access_token)})
        except Exception as e:
            return Response(
                {'detail': f'Token invalide : {e}'},
                status=status.HTTP_401_UNAUTHORIZED
            )


# ── Liste des utilisateurs (admin seulement) ──────────────────────────────────
class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        users = User.objects.all()
        return Response(UserSerializer(users, many=True).data)


# ── Détail / Modification / Désactivation d'un utilisateur (admin) ────────────
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except Exception:
            return None

    def get(self, request, pk):
        if request.user.role != 'admin' and str(request.user.pk) != str(pk):
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        u = self._get_user(pk)
        if not u:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(u).data)

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Réservé aux administrateurs.'}, status=status.HTTP_403_FORBIDDEN)
        u = self._get_user(pk)
        if not u:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        allowed = ('first_name', 'last_name', 'role', 'is_active')
        for field in allowed:
            if field in request.data:
                setattr(u, field, request.data[field])
        u.save()
        return Response(UserSerializer(u).data)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Réservé aux administrateurs.'}, status=status.HTTP_403_FORBIDDEN)
        if str(request.user.pk) == str(pk):
            return Response(
                {'detail': 'Vous ne pouvez pas supprimer votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        u = self._get_user(pk)
        if not u:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        u.is_active = False
        u.save()
        return Response({'detail': 'Compte désactivé.'})