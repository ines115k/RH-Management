from rest_framework.permissions import BasePermission


class IsAdminOrManager(BasePermission):
    """Autorise uniquement les rôles admin et manager."""
    message = "Accès réservé aux administrateurs et managers."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'manager')
        )


class IsAdmin(BasePermission):
    """Autorise uniquement le rôle admin."""
    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsOwnerOrAdminOrManager(BasePermission):
    """
    Autorise : admin, manager OU l'employé lui-même (via user_id).
    À utiliser sur les vues de détail.
    """
    message = "Vous n'avez pas accès à cette ressource."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'manager'):
            return True
        # L'employé peut voir sa propre fiche
        return str(obj.user_id) == str(request.user.id)