from rest_framework import serializers
from .models import PaySlip


class PaySlipSerializer(serializers.Serializer):
    """Sérializer pour les fiches de paie"""
    id = serializers.CharField(read_only=True)
    employee_id = serializers.CharField(read_only=True)
    employee_name = serializers.CharField()
    month = serializers.IntegerField()
    year = serializers.IntegerField()
    base_salary = serializers.FloatField()
    bonus = serializers.FloatField()
    deductions = serializers.FloatField()
    net_salary = serializers.FloatField()
    worked_hours = serializers.FloatField()
    status = serializers.CharField()
    pdf_url = serializers.CharField()
    generated_at = serializers.DateTimeField(read_only=True)
    validated_by = serializers.CharField()
    validated_at = serializers.DateTimeField(allow_null=True)


class GeneratePaySlipSerializer(serializers.Serializer):
    """Sérializer pour générer une fiche de paie"""
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2030)


class ValidatePaySlipSerializer(serializers.Serializer):
    """Sérializer pour valider une fiche de paie"""
    status = serializers.ChoiceField(choices=['validated', 'paid'])