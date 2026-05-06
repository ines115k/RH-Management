import calendar
from datetime import datetime, date
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import PaySlip
from .serializers import PaySlipSerializer, GeneratePaySlipSerializer
from employees.models import Employee
from attendance.models import Attendance, LeaveRequest

def calculate_payroll(employee_id, month, year):
    """Calcule les éléments de paie pour un employé et un mois donnés."""
    emp = Employee.objects.get(pk=ObjectId(employee_id))
    base_salary = emp.base_salary

    first_day = date(year, month, 1)
    last_day = date(year, month, calendar.monthrange(year, month)[1])

    # Heures travaillées (présence, retard, demi-journée)
    attendances = Attendance.objects(
        employee_id=employee_id,
        date__gte=first_day,
        date__lte=last_day
    )
    worked_hours = 0.0
    for att in attendances:
        if att.status in ('present', 'late', 'half_day'):
            worked_hours += att.duration if att.duration else 0.0

    # Jours d'absence (statut 'absent')
    absent_days = attendances.filter(status='absent').count()
    daily_rate = base_salary / 22 if base_salary else 0   # 22 jours ouvrés moyens
    deductions = absent_days * daily_rate

    # Primes (fixes, pour simplifier)
    bonus = 0.0

    # Heures normales mensuelles (35h/semaine -> 151.67h)
    standard_hours = 151.67
    ratio = min(worked_hours / standard_hours, 1.0) if standard_hours > 0 else 1.0
    net_salary = base_salary * ratio + bonus - deductions
    net_salary = round(net_salary, 2)

    return {
        'base_salary': base_salary,
        'worked_hours': round(worked_hours, 2),
        'bonus': bonus,
        'deductions': round(deductions, 2),
        'net_salary': net_salary,
    }

class PaySlipListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PaySlip.objects.all()

        emp_id = request.query_params.get('employee_id')
        if emp_id:
            qs = qs.filter(employee_id=emp_id)
        elif request.user.role == 'employee':
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
                qs = qs.filter(employee_id=str(emp.pk))
            except:
                return Response({'total': 0, 'records': []})

        month = request.query_params.get('month')
        if month:
            qs = qs.filter(month=int(month))
        year = request.query_params.get('year')
        if year:
            qs = qs.filter(year=int(year))

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        total = qs.count()
        page = int(request.query_params.get('page', 1))
        limit = min(100, int(request.query_params.get('limit', 20)))
        records = list(qs.skip((page-1)*limit).limit(limit))

        return Response({
            'total': total,
            'page': page,
            'records': PaySlipSerializer(records, many=True).data
        })

    def post(self, request):
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=403)

        serializer = GeneratePaySlipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        try:
            emp = Employee.objects.get(pk=ObjectId(data['employee_id']))
        except:
            return Response({'detail': 'Employé introuvable.'}, status=404)

        payroll = calculate_payroll(data['employee_id'], data['month'], data['year'])

        payslip = PaySlip(
            employee_id=data['employee_id'],
            employee_name=emp.full_name,
            month=data['month'],
            year=data['year'],
            base_salary=payroll['base_salary'],
            bonus=payroll['bonus'],
            deductions=payroll['deductions'],
            net_salary=payroll['net_salary'],
            worked_hours=payroll['worked_hours'],
            status='draft'
        )
        payslip.save()
        return Response(PaySlipSerializer(payslip).data, status=201)

class PaySlipDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return PaySlip.objects.get(pk=ObjectId(pk))
        except:
            return None

    def get(self, request, pk):
        payslip = self.get_object(pk)
        if not payslip:
            return Response({'detail': 'Bulletin introuvable.'}, status=404)
        if request.user.role == 'employee':
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
                if payslip.employee_id != str(emp.pk):
                    return Response({'detail': 'Accès refusé.'}, status=403)
            except:
                return Response({'detail': 'Accès refusé.'}, status=403)
        return Response(PaySlipSerializer(payslip).data)

    def patch(self, request, pk):
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=403)

        payslip = self.get_object(pk)
        if not payslip:
            return Response({'detail': 'Bulletin introuvable.'}, status=404)

        action = request.data.get('action')
        if action == 'validate':
            payslip.status = 'validated'
            payslip.validated_by = str(request.user.pk)
            payslip.validated_at = datetime.utcnow()
        elif action == 'pay':
            if payslip.status != 'validated':
                return Response({'detail': 'Le bulletin doit être validé avant paiement.'}, status=400)
            payslip.status = 'paid'
        else:
            return Response({'detail': 'Action non reconnue. Utilisez "validate" ou "pay".'}, status=400)

        payslip.save()
        return Response(PaySlipSerializer(payslip).data)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Réservé aux administrateurs.'}, status=403)
        payslip = self.get_object(pk)
        if not payslip:
            return Response({'detail': 'Bulletin introuvable.'}, status=404)
        payslip.delete()
        return Response({'detail': 'Bulletin supprimé.'})