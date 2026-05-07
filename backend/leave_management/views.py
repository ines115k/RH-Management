from datetime import datetime, date
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import LeaveRequest
from .serializers import LeaveRequestSerializer, LeaveCreateSerializer, LeaveDecisionSerializer

try:
    from employees.models import Employee
except ImportError:
    Employee = None


def _get_employee_for_user(user):
    """Retourne l'objet Employee lié à l'utilisateur, ou None."""
    if Employee is None:
        return None
    try:
        return Employee.objects.get(user_id=str(user.pk))
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════
# EMPLOYÉ — ses propres demandes
# ══════════════════════════════════════════════════════════════════

class MyLeaveRequestsView(APIView):
    """GET /api/leave/my-requests/ — Liste des congés de l'employé connecté."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        emp = _get_employee_for_user(request.user)
        if not emp:
            return Response({'detail': 'Fiche employé introuvable.'}, status=404)

        leaves = LeaveRequest.objects(
            employee_id=str(emp.pk)
        ).order_by('-created_at')

        return Response(LeaveRequestSerializer(list(leaves), many=True).data)


class CreateLeaveRequestView(APIView):
    """POST /api/leave/create/ — Soumettre une demande de congé."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        emp = _get_employee_for_user(request.user)
        if not emp:
            return Response({'detail': 'Fiche employé introuvable.'}, status=404)

        serializer = LeaveCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Vérifier chevauchement
        existing = LeaveRequest.objects(
            employee_id=str(emp.pk),
            status__in=['pending', 'approved'],
            start_date__lte=data['end_date'],
            end_date__gte=data['start_date'],
        ).first()

        if existing:
            return Response(
                {'detail': 'Vous avez déjà une demande de congé sur cette période.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave = LeaveRequest(
            employee_id=str(emp.pk),
            employee_name=emp.full_name if hasattr(emp, 'full_name') else '',
            leave_type=data['leave_type'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            reason=data.get('reason', ''),
            status='pending',
        )
        leave.save()

        return Response(
            LeaveRequestSerializer(leave).data,
            status=status.HTTP_201_CREATED
        )


class CancelLeaveRequestView(APIView):
    """DELETE /api/leave/<pk>/cancel/ — Annuler sa propre demande (si pending)."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        emp = _get_employee_for_user(request.user)
        if not emp:
            return Response({'detail': 'Fiche employé introuvable.'}, status=404)

        try:
            leave = LeaveRequest.objects.get(pk=ObjectId(pk))
        except Exception:
            return Response({'detail': 'Demande introuvable.'}, status=404)

        if str(leave.employee_id) != str(emp.pk):
            return Response({'detail': 'Action non autorisée.'}, status=403)

        if leave.status != 'pending':
            return Response(
                {'detail': 'Seules les demandes en attente peuvent être annulées.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = 'cancelled'
        leave.save()
        return Response({'detail': 'Demande annulée.'})


# ══════════════════════════════════════════════════════════════════
# ADMIN / MANAGER
# ══════════════════════════════════════════════════════════════════

class AllLeaveRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_role = getattr(request.user, 'role', 'employee')
            status_param = request.query_params.get('status')
            employee_param = request.query_params.get('employee_id')

            qs = LeaveRequest.objects.all()

            if user_role not in ('admin', 'manager'):
                qs = qs.filter(status='approved')
            else:
                if status_param:
                    qs = qs.filter(status=status_param)
                if employee_param:
                    qs = qs.filter(employee_id=employee_param)

            leaves = list(qs.order_by('-created_at'))
            return Response(LeaveRequestSerializer(leaves, many=True).data)

        except Exception as e:
            import traceback
            traceback.print_exc()          # ← log complet dans la console Django
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LeaveDecisionView(APIView):
    """POST /api/leave/<pk>/decision/ — Approuver ou rejeter."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user_role = getattr(request.user, 'role', 'employee')
        if user_role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=403)

        try:
            leave = LeaveRequest.objects.get(pk=ObjectId(pk))
        except Exception:
            return Response({'detail': 'Demande introuvable.'}, status=404)

        if leave.status != 'pending':
            return Response(
                {'detail': f'Cette demande est déjà "{leave.status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = LeaveDecisionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        decision = serializer.validated_data['decision']
        leave.status      = decision
        leave.approved_by = str(request.user.pk)
        leave.approved_at = datetime.utcnow()

        if decision == 'rejected':
            leave.rejection_reason = serializer.validated_data.get('rejection_reason', '')

        leave.save()
        label = 'approuvée' if decision == 'approved' else 'rejetée'
        return Response({
            'detail': f'Demande {label} avec succès.',
            'leave':  LeaveRequestSerializer(leave).data,
        })


# ══════════════════════════════════════════════════════════════════
# STATISTIQUES
# ══════════════════════════════════════════════════════════════════

class LeaveStatsView(APIView):
    """GET /api/leave/stats/ — Stats de l'employé connecté."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        emp = _get_employee_for_user(request.user)
        if not emp:
            return Response({'detail': 'Fiche employé introuvable.'}, status=404)

        emp_id = str(emp.pk)
        year   = int(request.query_params.get('year', datetime.utcnow().year))

        pending  = LeaveRequest.objects(employee_id=emp_id, status='pending').count()
        approved = LeaveRequest.objects(employee_id=emp_id, status='approved').count()
        rejected = LeaveRequest.objects(employee_id=emp_id, status='rejected').count()

        # Jours approuvés par type cette année
        approved_leaves = LeaveRequest.objects(
            employee_id=emp_id,
            status='approved',
            start_date__gte=date(year, 1, 1),
            end_date__lte=date(year, 12, 31),
        )
        by_type = {}
        for lv in approved_leaves:
            t = lv.leave_type
            by_type[t] = by_type.get(t, 0) + lv.days_count

        return Response({
            'year':           year,
            'pending':        pending,
            'approved':       approved,
            'rejected':       rejected,
            'total':          pending + approved + rejected,
            'approved_days':  by_type,
            'total_approved_days': sum(by_type.values()),
        })


class LeaveSummaryView(APIView):
    """GET /api/leave/summary/ — Résumé congés (admin avec employee_id, ou self)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', 'employee')
        year      = int(request.query_params.get('year', datetime.utcnow().year))

        if user_role in ('admin', 'manager'):
            emp_id = request.query_params.get('employee_id')
            if not emp_id:
                return Response({'detail': 'employee_id requis.'}, status=400)
        else:
            emp = _get_employee_for_user(request.user)
            if not emp:
                return Response({'detail': 'Fiche employé introuvable.'}, status=404)
            emp_id = str(emp.pk)

        approved = LeaveRequest.objects(
            employee_id=emp_id,
            status='approved',
            start_date__gte=date(year, 1, 1),
            end_date__lte=date(year, 12, 31),
        )
        by_type = {}
        for lv in approved:
            t = lv.leave_type
            by_type[t] = by_type.get(t, 0) + lv.days_count

        pending_count = LeaveRequest.objects(employee_id=emp_id, status='pending').count()

        return Response({
            'year':            year,
            'employee_id':     emp_id,
            'approved_days':   by_type,
            'total_approved':  sum(by_type.values()),
            'pending_count':   pending_count,
        })