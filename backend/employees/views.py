import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Employee, PositionHistory
from .serializers import (
    EmployeeSerializer, EmployeeCreateSerializer, EmployeeUpdateSerializer
)
from .permissions import IsAdminOrManager, IsAdmin, IsOwnerOrAdminOrManager
from rest_framework.permissions import IsAuthenticated
from authentication.backends import MongoJWTAuthentication

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_employee_or_404(pk):
    try:
        return Employee.objects.get(pk=pk)
    except Exception:
        return None


# ── Liste + Création ──────────────────────────────────────────────────────────
class EmployeeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/employees/
        Paramètres de filtrage optionnels :
          ?department=IT
          ?status=active
          ?contract_type=cdi
          ?search=dupont
          ?page=1&limit=10
        """
        qs = Employee.objects.all()

        # Filtres simples
        for field in ('department', 'status', 'contract_type', 'gender'):
            val = request.query_params.get(field)
            if val:
                qs = qs.filter(**{field: val})

        # Recherche plein texte (prénom, nom, email, employee_id)
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(__raw__={
                '$or': [
                    {'first_name':   {'$regex': search, '$options': 'i'}},
                    {'last_name':    {'$regex': search, '$options': 'i'}},
                    {'email':        {'$regex': search, '$options': 'i'}},
                    {'employee_id':  {'$regex': search, '$options': 'i'}},
                    {'department':   {'$regex': search, '$options': 'i'}},
                    {'position':     {'$regex': search, '$options': 'i'}},
                ]
            })

        # Tri
        sort_by = request.query_params.get('sort', 'last_name')
        order   = request.query_params.get('order', 'asc')
        if order == 'desc':
            sort_by = f'-{sort_by}'
        qs = qs.order_by(sort_by)

        # Pagination
        total = qs.count()
        page  = max(1, int(request.query_params.get('page', 1)))
        limit = min(100, int(request.query_params.get('limit', 10)))
        employees = list(qs.skip((page - 1) * limit).limit(limit))

        return Response({
            'total':     total,
            'page':      page,
            'limit':     limit,
            'pages':     (total + limit - 1) // limit,
            'employees': EmployeeSerializer(employees, many=True).data,
        })

    def post(self, request):
        """
        POST /api/employees/
        Crée un nouvel employé (admin/manager seulement).
        """
        if request.user.role not in ('admin', 'manager'):
            return Response(
                {'detail': 'Permission refusée.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = EmployeeCreateSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return Response(
                EmployeeSerializer(employee).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Détail + Mise à jour + Suppression ────────────────────────────────────────
class EmployeeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """GET /api/employees/<pk>/"""
        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Un employé ne peut voir que sa propre fiche
        if request.user.role == 'employee' and emp.user_id != request.user.id:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        return Response(EmployeeSerializer(emp).data)

    def patch(self, request, pk):
        """PATCH /api/employees/<pk>/ — mise à jour partielle"""
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmployeeUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Si le poste change → sauvegarder dans l'historique
        new_position   = data.get('position')
        new_department = data.get('department', emp.department)
        if new_position and new_position != emp.position:
            emp.position_history.append(PositionHistory(
                title=emp.position,
                department=emp.department,
                start_date=emp.hire_date,
            ))

        for field, value in data.items():
            setattr(emp, field, value)
        emp.save()

        return Response(EmployeeSerializer(emp).data)

    def delete(self, request, pk):
        """
        DELETE /api/employees/<pk>/
        Archivage (statut = terminated) — pas de suppression physique.
        Seul un admin peut archiver.
        """
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Seul un administrateur peut archiver un employé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        emp.status = 'terminated'
        emp.save()
        return Response({'detail': f"{emp.full_name} archivé avec succès."})


# ── Upload photo de profil ────────────────────────────────────────────────────
class EmployeePhotoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, pk):
        """POST /api/employees/<pk>/photo/ — upload de la photo de profil"""
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        photo = request.FILES.get('photo')
        if not photo:
            return Response({'detail': 'Aucune photo fournie.'}, status=status.HTTP_400_BAD_REQUEST)

        ALLOWED_TYPES = ('image/jpeg', 'image/png', 'image/webp')
        if photo.content_type not in ALLOWED_TYPES:
            return Response(
                {'detail': 'Format accepté : JPEG, PNG ou WebP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if photo.size > 5 * 1024 * 1024:  # 5 MB max
            return Response({'detail': 'Taille maximale : 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        # Sauvegarder le fichier
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'employees', 'photos')
        os.makedirs(upload_dir, exist_ok=True)

        ext      = photo.name.rsplit('.', 1)[-1].lower()
        filename = f"{emp.employee_id}.{ext}"
        filepath = os.path.join(upload_dir, filename)

        with open(filepath, 'wb+') as f:
            for chunk in photo.chunks():
                f.write(chunk)

        emp.photo_url = f"/media/employees/photos/{filename}"
        emp.save()

        return Response({'photo_url': emp.photo_url})


# ── Statistiques pour le Dashboard ───────────────────────────────────────────
class EmployeeStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/employees/stats/ — KPIs pour le tableau de bord"""
        total      = Employee.objects.count()
        active     = Employee.objects(status='active').count()
        on_leave   = Employee.objects(status='on_leave').count()
        inactive   = Employee.objects(status='inactive').count()
        terminated = Employee.objects(status='terminated').count()

        # Répartition par département
        dept_pipeline = [
            {'$match': {'status': {'$ne': 'terminated'}}},
            {'$group': {'_id': '$department', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
        ]
        by_dept = list(Employee.objects.aggregate(*dept_pipeline))

        # Répartition par type de contrat
        contract_pipeline = [
            {'$match': {'status': 'active'}},
            {'$group': {'_id': '$contract_type', 'count': {'$sum': 1}}},
        ]
        by_contract = list(Employee.objects.aggregate(*contract_pipeline))

        # Embauches récentes (30 derniers jours)
        from datetime import timedelta
        from datetime import datetime as dt
        thirty_days_ago = dt.utcnow() - timedelta(days=30)
        recent_hires = Employee.objects(
            hire_date__gte=thirty_days_ago
        ).count()

        return Response({
            'total':        total,
            'active':       active,
            'on_leave':     on_leave,
            'inactive':     inactive,
            'terminated':   terminated,
            'recent_hires': recent_hires,
            'by_department': [
                {'department': d['_id'] or 'Non défini', 'count': d['count']}
                for d in by_dept
            ],
            'by_contract': [
                {'contract_type': c['_id'] or 'Non défini', 'count': c['count']}
                for c in by_contract
            ],
        })


# ── Historique des postes ─────────────────────────────────────────────────────
class EmployeeHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """GET /api/employees/<pk>/history/"""
        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        from .serializers import PositionHistorySerializer
        history = list(reversed(emp.position_history))  # Plus récent en premier
        return Response({
            'employee_id': emp.employee_id,
            'full_name':   emp.full_name,
            'current_position': emp.position,
            'current_department': emp.department,
            'history': PositionHistorySerializer(history, many=True).data,
        })
class MyEmployeeInfoView(APIView):
    """Récupérer les infos de l'employé connecté"""
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            emp = Employee.objects.get(user_id=str(request.user.id))
            return Response({
                'first_name': emp.first_name,
                'last_name': emp.last_name,
                'position': emp.position,
                'base_salary': emp.base_salary,
                'department': emp.department,
                'employee_id': emp.employee_id,
            })
        except:
            return Response(
                {'detail': 'Employé non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )