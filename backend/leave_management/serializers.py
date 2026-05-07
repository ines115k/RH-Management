from rest_framework import serializers
from .models import LeaveRequest


class LeaveRequestSerializer(serializers.Serializer):
    id               = serializers.CharField(read_only=True)
    employee_id      = serializers.CharField()
    employee_name    = serializers.CharField(read_only=True)
    leave_type       = serializers.ChoiceField(choices=LeaveRequest.TYPE_CHOICES)
    # ← Ajoutez format et allow_null pour robustesse
    start_date       = serializers.DateField(format='%Y-%m-%d', allow_null=True)
    end_date         = serializers.DateField(format='%Y-%m-%d', allow_null=True)
    days_count       = serializers.IntegerField(read_only=True)
    reason           = serializers.CharField(default='', allow_blank=True)
    status           = serializers.ChoiceField(
        choices=LeaveRequest.STATUS_CHOICES, read_only=True
    )
    approved_by      = serializers.CharField(read_only=True)
    approved_at      = serializers.DateTimeField(read_only=True, allow_null=True)
    rejection_reason = serializers.CharField(read_only=True)
    created_at       = serializers.DateTimeField(read_only=True)
    updated_at       = serializers.DateTimeField(read_only=True)


class LeaveCreateSerializer(serializers.Serializer):
    """Création d'une demande par un employé."""
    leave_type = serializers.ChoiceField(choices=LeaveRequest.TYPE_CHOICES)
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
    """Approbation ou rejet par admin/manager."""
    decision         = serializers.ChoiceField(choices=('approved', 'rejected'))
    rejection_reason = serializers.CharField(
        default='', allow_blank=True, required=False
    )

    def validate(self, data):
        if data['decision'] == 'rejected' and not data.get('rejection_reason', '').strip():
            raise serializers.ValidationError(
                "Un motif de rejet est obligatoire."
            )
        return data