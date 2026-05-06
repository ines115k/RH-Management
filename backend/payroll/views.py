import calendar
from datetime import datetime, date
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import PaySlip
from .serializers import PaySlipSerializer, GeneratePaySlipSerializer, ValidatePaySlipSerializer
from employees.models import Employee
from attendance.models import Attendance
from authentication.backends import MongoJWTAuthentication


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
            # Utiliser worked_hours si disponible, sinon calculer
            if hasattr(att, 'worked_hours') and att.worked_hours:
                worked_hours += att.worked_hours
            elif att.check_in and att.check_out:
                delta = att.check_out - att.check_in
                worked_hours += delta.total_seconds() / 3600

    # Jours d'absence (statut 'absent')
    absent_days = attendances.filter(status='absent').count()
    daily_rate = base_salary / 22 if base_salary else 0  # 22 jours ouvrés moyens
    deductions = absent_days * daily_rate

    # Primes (5% du salaire de base)
    bonus = base_salary * 0.05

    # Heures normales mensuelles (35h/semaine -> 151.67h)
    standard_hours = 151.67
    ratio = min(worked_hours / standard_hours, 1.0) if standard_hours > 0 else 1.0
    net_salary = base_salary * ratio + bonus - deductions
    net_salary = round(net_salary, 2)

    # Total des déductions
    total_deductions = deductions + (base_salary * 0.20)  # +20% de charges

    return {
        'base_salary': base_salary,
        'worked_hours': round(worked_hours, 2),
        'bonus': round(bonus, 2),
        'deductions': round(total_deductions, 2),
        'net_salary': net_salary,
        'absent_days': absent_days,
    }


class PaySlipListView(APIView):
    """Liste des fiches de paie (avec filtres)"""
    authentication_classes = [MongoJWTAuthentication]
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
        """Générer une fiche de paie (admin/manager seulement)"""
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GeneratePaySlipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            emp = Employee.objects.get(pk=ObjectId(data['employee_id']))
        except:
            return Response({'detail': 'Employé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Vérifier si une fiche existe déjà
        existing = PaySlip.objects(
            employee_id=data['employee_id'],
            month=data['month'],
            year=data['year']
        ).first()
        if existing:
            return Response(
                {'detail': 'Fiche de paie déjà générée pour cette période'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
        return Response(PaySlipSerializer(payslip).data, status=status.HTTP_201_CREATED)


class PaySlipDetailView(APIView):
    """Détail, validation et suppression d'une fiche de paie"""
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return PaySlip.objects.get(pk=ObjectId(pk))
        except:
            return None

    def get(self, request, pk):
        payslip = self.get_object(pk)
        if not payslip:
            return Response({'detail': 'Bulletin introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier les droits d'accès
        if request.user.role == 'employee':
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
                if payslip.employee_id != str(emp.pk):
                    return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
            except:
                return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        
        return Response(PaySlipSerializer(payslip).data)

    def patch(self, request, pk):
        """Valider ou payer une fiche de paie"""
        if request.user.role not in ('admin', 'manager'):
            return Response({'detail': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

        payslip = self.get_object(pk)
        if not payslip:
            return Response({'detail': 'Bulletin introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action == 'validate':
            payslip.status = 'validated'
            payslip.validated_by = str(request.user.pk)
            payslip.validated_at = datetime.utcnow()
        elif action == 'pay':
            if payslip.status != 'validated':
                return Response(
                    {'detail': 'Le bulletin doit être validé avant paiement.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payslip.status = 'paid'
        else:
            return Response(
                {'detail': 'Action non reconnue. Utilisez "validate" ou "pay".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payslip.save()
        return Response(PaySlipSerializer(payslip).data)

    def delete(self, request, pk):
        """Supprimer une fiche de paie (admin seulement)"""
        if request.user.role != 'admin':
            return Response(
                {'detail': 'Réservé aux administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payslip = self.get_object(pk)
        if not payslip:
            return Response({'detail': 'Bulletin introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        
        payslip.delete()
        return Response({'detail': 'Bulletin supprimé.'})