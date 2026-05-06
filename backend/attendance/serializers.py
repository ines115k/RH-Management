from rest_framework import serializers
from .models import Attendance, LeaveRequest


# ── Attendance ────────────────────────────────────────────────────────────────
class AttendanceSerializer(serializers.Serializer):
    id            = serializers.CharField(read_only=True)
    employee_id   = serializers.CharField()
    employee_name = serializers.CharField(read_only=True)
    date          = serializers.DateField()
    check_in      = serializers.DateTimeField(allow_null=True, required=False)
    check_out     = serializers.DateTimeField(allow_null=True, required=False)
    duration      = serializers.FloatField(read_only=True)
    status        = serializers.ChoiceField(
        choices=('present', 'absent', 'late', 'half_day', 'holiday')
    )
    note       = serializers.CharField(default='', allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)


class CheckInSerializer(serializers.Serializer):
    """Pointage d'arrivée."""
    employee_id = serializers.CharField()
    note        = serializers.CharField(default='', allow_blank=True, required=False)

    def validate_employee_id(self, value):
        from employees.models import Employee
        try:
            from bson import ObjectId
            Employee.objects.get(pk=ObjectId(value))
        except Exception:
            raise serializers.ValidationError("Employé introuvable.")
        return value


class CheckOutSerializer(serializers.Serializer):
    """Pointage de départ."""
    note = serializers.CharField(default='', allow_blank=True, required=False)


# ── Leave Request ─────────────────────────────────────────────────────────────
class LeaveRequestSerializer(serializers.Serializer):
    id            = serializers.CharField(read_only=True)
    employee_id   = serializers.CharField()
    employee_name = serializers.CharField(read_only=True)
    leave_type    = serializers.ChoiceField(
        choices=('annual', 'sick', 'exceptional', 'unpaid', 'maternity', 'other')
    )
    start_date       = serializers.DateField()
    end_date         = serializers.DateField()
    days_count       = serializers.IntegerField(read_only=True)
    reason           = serializers.CharField(default='', allow_blank=True)
    status           = serializers.ChoiceField(
        choices=('pending', 'approved', 'rejected', 'cancelled'),
        read_only=True
    )
    approved_by      = serializers.CharField(read_only=True)
    approved_at      = serializers.DateTimeField(read_only=True, allow_null=True)
    rejection_reason = serializers.CharField(read_only=True)
    created_at       = serializers.DateTimeField(read_only=True)

    def validate(self, data):
        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError(
                "La date de fin doit être après la date de début."
            )
        return data


class LeaveCreateSerializer(serializers.Serializer):
    """Création d'une demande de congé par un employé."""
    leave_type = serializers.ChoiceField(
        choices=('annual', 'sick', 'exceptional', 'unpaid', 'maternity', 'other')
    )
    start_date = serializers.DateField()
    end_date   = serializers.DateField()
    reason     = serializers.CharField(default='', allow_blank=True, required=False)

    def validate(self, data):
        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError(
                "La date de fin doit être après la date de début."
            )
        return data


class LeaveDecisionSerializer(serializers.Serializer):
    """Validation ou rejet d'une demande par admin/manager."""
    decision         = serializers.ChoiceField(choices=('approved', 'rejected'))
    rejection_reason = serializers.CharField(
        default='', allow_blank=True, required=False
    )

    def validate(self, data):
        if data['decision'] == 'rejected' and not data.get('rejection_reason'):
            raise serializers.ValidationError(
                "Un motif de rejet est obligatoire."
            )
        return data