from rest_framework.permissions import BasePermission

class IsAdminOrHRManager(BasePermission):
    """Autorise uniquement admin et manager RH"""
    message = "Accès réservé aux administrateurs et managers RH"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'manager')


class IsOwnerOrAdmin(BasePermission):
    """Autorise l'admin ou le propriétaire de la candidature"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True