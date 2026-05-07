import os
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated

from .models import Employee, PositionHistory
from .serializers import (
    EmployeeSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
)


def get_employee_or_404(pk):
    try:
        return Employee.objects.get(pk=pk)
    except Exception:
        return None


# ── Liste + Création ──────────────────────────────────────────────────────────
class EmployeeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Employee.objects.all()

        # Filtres simples
        for field in ('department', 'status', 'contract_type', 'gender'):
            val = request.query_params.get(field)
            if val:
                qs = qs.filter(**{field: val})

        # Recherche texte
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(__raw__={
                '$or': [
                    {'first_name':  {'$regex': search, '$options': 'i'}},
                    {'last_name':   {'$regex': search, '$options': 'i'}},
                    {'email':       {'$regex': search, '$options': 'i'}},
                    {'employee_id': {'$regex': search, '$options': 'i'}},
                    {'department':  {'$regex': search, '$options': 'i'}},
                    {'position':    {'$regex': search, '$options': 'i'}},
                ]
            })

        # Tri
        sort_by = request.query_params.get('sort', 'last_name')
        if request.query_params.get('order', 'asc') == 'desc':
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
            'pages':     max(1, (total + limit - 1) // limit),
            'employees': EmployeeSerializer(employees, many=True).data,
        })

    def post(self, request):
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = EmployeeCreateSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Détail + Modification + Suppression ──────────────────────────────────────
class EmployeeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role == 'employee' and emp.user_id != str(request.user.pk):
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(EmployeeSerializer(emp).data)

    def patch(self, request, pk):
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmployeeUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Historique automatique si le poste change
        new_position = data.get('position')
        if new_position and new_position != emp.position:
            emp.position_history.append(PositionHistory(
                title=emp.position,
                department=emp.department,
                start_date=emp.hire_date or datetime.utcnow(),
            ))

        for field, value in data.items():
            setattr(emp, field, value)
        emp.save()

        return Response(EmployeeSerializer(emp).data)

    def delete(self, request, pk):
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


# ── Upload photo ──────────────────────────────────────────────────────────────
class EmployeePhotoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, pk):
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        photo = request.FILES.get('photo')
        if not photo:
            return Response({'detail': 'Aucune photo fournie.'}, status=status.HTTP_400_BAD_REQUEST)

        if photo.content_type not in ('image/jpeg', 'image/png', 'image/webp'):
            return Response({'detail': 'Format accepté : JPEG, PNG ou WebP.'}, status=status.HTTP_400_BAD_REQUEST)

        if photo.size > 5 * 1024 * 1024:
            return Response({'detail': 'Taille maximale : 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        upload_dir = os.path.join(settings.MEDIA_ROOT, 'employees', 'photos')
        os.makedirs(upload_dir, exist_ok=True)
        ext      = photo.name.rsplit('.', 1)[-1].lower()
        filename = f"{emp.employee_id}.{ext}"
        with open(os.path.join(upload_dir, filename), 'wb+') as f:
            for chunk in photo.chunks():
                f.write(chunk)

        emp.photo_url = f"/media/employees/photos/{filename}"
        emp.save()
        return Response({'photo_url': emp.photo_url})


# ── Statistiques Dashboard ────────────────────────────────────────────────────
class EmployeeStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Comptages simples — pas d'ORM Django, 100% MongoEngine
        total      = Employee.objects.count()
        active     = Employee.objects(status='active').count()
        on_leave   = Employee.objects(status='on_leave').count()
        inactive   = Employee.objects(status='inactive').count()
        terminated = Employee.objects(status='terminated').count()

        # Nouvelles recrues (30 derniers jours)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_hires = Employee.objects(
            hire_date__gte=thirty_days_ago,
            status__ne='terminated'
        ).count()

        # Répartition par département (agrégation MongoDB native)
        dept_pipeline = [
            {'$match': {'status': {'$ne': 'terminated'}}},
            {'$group': {'_id': '$department', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
        ]
        by_dept_raw = list(Employee.objects.aggregate(*dept_pipeline))
        by_dept = [
            {'department': d['_id'] or 'Non défini', 'count': d['count']}
            for d in by_dept_raw
        ]

        # Répartition par type de contrat
        contract_pipeline = [
            {'$match': {'status': 'active'}},
            {'$group': {'_id': '$contract_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
        ]
        by_contract_raw = list(Employee.objects.aggregate(*contract_pipeline))
        by_contract = [
            {'contract_type': c['_id'] or 'Non défini', 'count': c['count']}
            for c in by_contract_raw
        ]

        return Response({
            'total':        total,
            'active':       active,
            'on_leave':     on_leave,
            'inactive':     inactive,
            'terminated':   terminated,
            'recent_hires': recent_hires,
            'by_department': by_dept,
            'by_contract':   by_contract,
        })


# ── Historique des postes ─────────────────────────────────────────────────────
class EmployeeHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        emp = get_employee_or_404(pk)
        if not emp:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        from .serializers import PositionHistorySerializer
        history = list(reversed(emp.position_history))
        return Response({
            'employee_id':        emp.employee_id,
            'full_name':          emp.full_name,
            'current_position':   emp.position,
            'current_department': emp.department,
            'history': PositionHistorySerializer(history, many=True).data,
        })


# ── Informations de l'employé connecté ────────────────────────────────────────
class MyEmployeeInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            emp = Employee.objects.get(user_id=str(request.user.pk))
            return Response(EmployeeSerializer(emp).data)
        except Employee.DoesNotExist:
            # Si pas d'employé trouvé, retourner une structure compatible
            return Response({
                'id': None,
                'user_id': str(request.user.pk),
                'first_name': request.user.first_name or '',
                'last_name': request.user.last_name or '',
                'email': request.user.email,
                'employee_id': 'N/A',
                'department': 'Non défini',
                'position': 'Non défini',
                'base_salary': 0,
                'status': 'unknown',
                'hire_date': None,
                'contract_type': 'unknown',
                'message': 'Profil employé non configuré. Contactez votre administrateur.'
            })
        except Exception as e:
            return Response(
                {'detail': f'Erreur serveur : {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )