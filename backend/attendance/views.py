from datetime import datetime, date, timedelta
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Attendance, LeaveRequest
from .serializers import (
    AttendanceSerializer, CheckInSerializer, CheckOutSerializer,
    LeaveRequestSerializer, LeaveCreateSerializer, LeaveDecisionSerializer,
)
from employees.models import Employee


def get_employee_name(employee_id):
    """Récupère le nom complet d'un employé depuis son ID."""
    try:
        emp = Employee.objects.get(pk=ObjectId(employee_id))
        return emp.full_name
    except Exception:
        return ''


# ══════════════════════════════════════════════════════════════════
# POINTAGE
# ══════════════════════════════════════════════════════════════════

class CheckInView(APIView):
    """POST /api/attendance/checkin/ — Enregistrer l'arrivée."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        employee_id = serializer.validated_data['employee_id']
        note        = serializer.validated_data.get('note', '')
        today       = date.today()
        now         = datetime.utcnow()

        # Vérifier s'il existe déjà un pointage aujourd'hui
        existing = Attendance.objects(
            employee_id=employee_id,
            date=today
        ).first()

        if existing:
            if existing.check_in:
                return Response(
                    {'detail': 'Vous avez déjà pointé votre arrivée aujourd\'hui.',
                     'check_in': existing.check_in.isoformat()},
                    status=status.HTTP_400_BAD_REQUEST
                )
            existing.check_in = now
            existing.note = note
            existing.save()
            record = existing
        else:
            record = Attendance(
                employee_id=employee_id,
                employee_name=get_employee_name(employee_id),
                date=today,
                check_in=now,
                status='present',
                note=note,
                created_by=str(request.user.pk),
            )
            record.save()

        return Response({
            'detail': 'Arrivée enregistrée avec succès.',
            'record': AttendanceSerializer(record).data,
        }, status=status.HTTP_201_CREATED)


class CheckOutView(APIView):
    """POST /api/attendance/checkout/<employee_id>/ — Enregistrer le départ."""
    permission_classes = [IsAuthenticated]

    def post(self, request, employee_id):
        serializer = CheckOutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        note  = serializer.validated_data.get('note', '')

        record = Attendance.objects(
            employee_id=employee_id,
            date=today
        ).first()

        if not record or not record.check_in:
            return Response(
                {'detail': 'Aucun pointage d\'arrivée trouvé pour aujourd\'hui.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if record.check_out:
            return Response(
                {'detail': 'Départ déjà enregistré aujourd\'hui.',
                 'check_out': record.check_out.isoformat()},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.check_out = datetime.utcnow()
        if note:
            record.note = note
        record.save()  # compute_duration appelé dans save()

        return Response({
            'detail': 'Départ enregistré avec succès.',
            'record': AttendanceSerializer(record).data,
        })


class AttendanceListView(APIView):
    """
    GET /api/attendance/
    Paramètres : employee_id, date_from, date_to, status, page, limit
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Attendance.objects.all()

        # Filtre par employé
        emp_id = request.query_params.get('employee_id')
        if emp_id:
            qs = qs.filter(employee_id=emp_id)
        elif request.user.role == 'employee':
            # Un employé ne voit que ses propres pointages
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
                qs = qs.filter(employee_id=str(emp.pk))
            except Exception:
                return Response({'total': 0, 'records': []})

        # Filtre par date
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Filtre par statut
        stat = request.query_params.get('status')
        if stat:
            qs = qs.filter(status=stat)

        # Mois courant par défaut si aucun filtre de date
        if not date_from and not date_to:
            today = date.today()
            first_day = today.replace(day=1)
            qs = qs.filter(date__gte=first_day)

        total   = qs.count()
        page    = max(1, int(request.query_params.get('page', 1)))
        limit   = min(100, int(request.query_params.get('limit', 31)))
        records = list(qs.skip((page - 1) * limit).limit(limit))

        return Response({
            'total':   total,
            'page':    page,
            'records': AttendanceSerializer(records, many=True).data,
        })


class AttendanceTodayView(APIView):
    """GET /api/attendance/today/ — Pointages du jour (admin/manager)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today   = date.today()
        records = Attendance.objects(date=today)

        # Stats rapides
        total_employees = Employee.objects(status='active').count()
        present  = records.filter(status='present').count()
        absent   = total_employees - records.count()
        late     = records.filter(status='late').count()

        return Response({
            'date':             today.isoformat(),
            'total_employees':  total_employees,
            'present':          present,
            'absent':           max(0, absent),
            'late':             late,
            'records':          AttendanceSerializer(list(records), many=True).data,
        })


class MyAttendanceTodayView(APIView):
    """GET /api/attendance/my-today/ — Pointage du jour pour l'employé connecté."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            emp = Employee.objects.get(user_id=str(request.user.pk))
        except Exception:
            return Response({'detail': 'Fiche employé introuvable.'}, status=404)

        today  = date.today()
        record = Attendance.objects(
            employee_id=str(emp.pk),
            date=today
        ).first()

        return Response({
            'employee_id':   str(emp.pk),
            'employee_name': emp.full_name,
            'date':          today.isoformat(),
            'record':        AttendanceSerializer(record).data if record else None,
        })


class AttendanceStatsView(APIView):
    """GET /api/attendance/stats/ — Statistiques du mois."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today     = date.today()
        month     = int(request.query_params.get('month', today.month))
        year      = int(request.query_params.get('year', today.year))
        emp_id    = request.query_params.get('employee_id')

        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)

        qs = Attendance.objects(date__gte=first_day, date__lte=last_day)
        if emp_id:
            qs = qs.filter(employee_id=emp_id)

        total_days = (last_day - first_day).days + 1
        present    = qs.filter(status='present').count()
        absent     = qs.filter(status='absent').count()
        late       = qs.filter(status='late').count()
        half_day   = qs.filter(status='half_day').count()

        # Heures totales
        pipeline = [
            {'$match': {
                'date': {'$gte': first_day.isoformat(), '$lte': last_day.isoformat()},
                **(({'employee_id': emp_id}) if emp_id else {}),
            }},
            {'$group': {'_id': None, 'total_hours': {'$sum': '$duration'}}},
        ]
        agg = list(qs.aggregate(*[
            {'$group': {'_id': None, 'total_hours': {'$sum': '$duration'}}}
        ]))
        total_hours = round(agg[0]['total_hours'], 1) if agg else 0.0

        return Response({
            'month':       month,
            'year':        year,
            'total_days':  total_days,
            'present':     present,
            'absent':      absent,
            'late':        late,
            'half_day':    half_day,
            'total_hours': total_hours,
        })


# ══════════════════════════════════════════════════════════════════
# CONGÉS
# ══════════════════════════════════════════════════════════════════

class LeaveRequestListView(APIView):
    """
    GET  /api/attendance/leaves/     — liste des demandes
    POST /api/attendance/leaves/     — créer une demande
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = LeaveRequest.objects.all()

        # Un employé ne voit que ses propres demandes
        if request.user.role == 'employee':
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
                qs  = qs.filter(employee_id=str(emp.pk))
            except Exception:
                return Response({'total': 0, 'leaves': []})

        # Filtres
        emp_id = request.query_params.get('employee_id')
        if emp_id and request.user.role in ('admin', 'manager'):
            qs = qs.filter(employee_id=emp_id)

        stat = request.query_params.get('status')
        if stat:
            qs = qs.filter(status=stat)

        ltype = request.query_params.get('leave_type')
        if ltype:
            qs = qs.filter(leave_type=ltype)

        total  = qs.count()
        page   = max(1, int(request.query_params.get('page', 1)))
        limit  = min(100, int(request.query_params.get('limit', 20)))
        leaves = list(qs.skip((page - 1) * limit).limit(limit))

        return Response({
            'total':  total,
            'page':   page,
            'leaves': LeaveRequestSerializer(leaves, many=True).data,
        })

    def post(self, request):
        serializer = LeaveCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Trouver la fiche employé de l'utilisateur connecté
        if request.user.role == 'employee':
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
            except Exception:
                return Response(
                    {'detail': 'Fiche employé introuvable pour ce compte.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            employee_id   = str(emp.pk)
            employee_name = emp.full_name
        else:
            # Admin/manager peut créer pour n'importe quel employé
            employee_id = request.data.get('employee_id', '')
            if not employee_id:
                return Response(
                    {'detail': 'employee_id requis.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            employee_name = get_employee_name(employee_id)

        # Vérifier les chevauchements
        data = serializer.validated_data
        overlap = LeaveRequest.objects(
            employee_id=employee_id,
            status__in=('pending', 'approved'),
            start_date__lte=data['end_date'],
            end_date__gte=data['start_date'],
        ).first()
        if overlap:
            return Response(
                {'detail': f"Chevauchement avec une demande existante ({overlap.start_date} → {overlap.end_date})."},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave = LeaveRequest(
            employee_id=employee_id,
            employee_name=employee_name,
            leave_type=data['leave_type'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            reason=data.get('reason', ''),
        )
        leave.save()

        return Response(
            LeaveRequestSerializer(leave).data,
            status=status.HTTP_201_CREATED
        )


class LeaveRequestDetailView(APIView):
    """
    GET    /api/attendance/leaves/<pk>/  — détail
    DELETE /api/attendance/leaves/<pk>/  — annuler (par l'employé)
    """
    permission_classes = [IsAuthenticated]

    def _get_leave(self, pk):
        try:
            return LeaveRequest.objects.get(pk=ObjectId(pk))
        except Exception:
            return None

    def get(self, request, pk):
        leave = self._get_leave(pk)
        if not leave:
            return Response({'detail': 'Demande introuvable.'}, status=404)
        return Response(LeaveRequestSerializer(leave).data)

    def delete(self, request, pk):
        leave = self._get_leave(pk)
        if not leave:
            return Response({'detail': 'Demande introuvable.'}, status=404)

        if leave.status not in ('pending',):
            return Response(
                {'detail': 'Seules les demandes en attente peuvent être annulées.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = 'cancelled'
        leave.save()
        return Response({'detail': 'Demande annulée.'})


class LeaveDecisionView(APIView):
    """
    POST /api/attendance/leaves/<pk>/decision/
    Approuver ou rejeter une demande (admin/manager seulement).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ('admin', 'manager'):
            return Response(
                {'detail': 'Réservé aux managers et administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

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

        # Si approuvé → marquer les jours comme congé dans Attendance
        if decision == 'approved':
            current = leave.start_date
            while current <= leave.end_date:
                existing = Attendance.objects(
                    employee_id=leave.employee_id,
                    date=current
                ).first()
                if existing:
                    existing.status = 'holiday'
                    existing.note   = f"Congé {leave.leave_type}"
                    existing.save()
                else:
                    Attendance(
                        employee_id=leave.employee_id,
                        employee_name=leave.employee_name,
                        date=current,
                        status='holiday',
                        note=f"Congé {leave.leave_type}",
                        created_by=str(request.user.pk),
                    ).save()
                current += timedelta(days=1)

        label = 'approuvée' if decision == 'approved' else 'rejetée'
        return Response({
            'detail': f'Demande {label} avec succès.',
            'leave':  LeaveRequestSerializer(leave).data,
        })


class LeaveSummaryView(APIView):
    """GET /api/attendance/leaves/summary/ — Résumé congés d'un employé (ou global si admin sans filtre)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        emp_id = request.query_params.get('employee_id')
        year = int(request.query_params.get('year', datetime.utcnow().year))

        # Pour un employé simple : on force son propre employee_id
        if request.user.role == 'employee':
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
                emp_id = str(emp.pk)
            except Exception:
                return Response({'detail': 'Fiche employé introuvable.'}, status=404)

        # Si aucun employee_id n'est fourni et que l'utilisateur est admin/manager,
        # on retourne un résumé vide (ou on pourrait calculer un résumé global)
        if not emp_id:
            return Response({
                'year': year,
                'approved_days': {},
                'total_approved': 0,
                'pending_count': 0,
                'message': 'Aucun employé sélectionné. Utilisez le filtre pour voir les congés d’un employé.'
            }, status=200)

        # Sinon, calcul normal pour l'employé spécifié
        approved = LeaveRequest.objects(
            employee_id=emp_id,
            status='approved',
            start_date__gte=date(year, 1, 1),
            end_date__lte=date(year, 12, 31),
        )

        by_type = {}
        for leave in approved:
            t = leave.leave_type
            by_type[t] = by_type.get(t, 0) + leave.days_count

        pending_count = LeaveRequest.objects(
            employee_id=emp_id,
            status='pending',
        ).count()

        return Response({
            'year': year,
            'employee_id': emp_id,
            'approved_days': by_type,
            'total_approved': sum(by_type.values()),
            'pending_count': pending_count,
        })