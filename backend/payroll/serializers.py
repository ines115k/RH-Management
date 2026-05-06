from rest_framework import serializers
from .models import PaySlip

class PaySlipSerializer(serializers.Serializer):
    id            = serializers.CharField(read_only=True)
    employee_id   = serializers.CharField()
    employee_name = serializers.CharField(read_only=True)
    month         = serializers.IntegerField()
    year          = serializers.IntegerField()
    base_salary   = serializers.FloatField()
    bonus         = serializers.FloatField()
    deductions    = serializers.FloatField()
    net_salary    = serializers.FloatField(read_only=True)
    worked_hours  = serializers.FloatField(read_only=True)
    status        = serializers.ChoiceField(choices=('draft', 'validated', 'paid'))
    pdf_url       = serializers.CharField(read_only=True)
    generated_at  = serializers.DateTimeField(read_only=True)
    validated_by  = serializers.CharField(read_only=True)
    validated_at  = serializers.DateTimeField(read_only=True)

class GeneratePaySlipSerializer(serializers.Serializer):
    employee_id = serializers.CharField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    year  = serializers.IntegerField()

    def validate(self, data):
        from .models import PaySlip
        if PaySlip.objects(employee_id=data['employee_id'],
                           month=data['month'], year=data['year']).first():
            raise serializers.ValidationError("Un bulletin existe déjà pour cette période.")
        return data