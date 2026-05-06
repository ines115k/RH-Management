from rest_framework import serializers
from .models import Attendance

class AttendanceSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    employee_id = serializers.CharField()
    date = serializers.DateTimeField(read_only=True)
    check_in = serializers.DateTimeField(allow_null=True)
    check_out = serializers.DateTimeField(allow_null=True)
    status = serializers.CharField()
    notes = serializers.CharField(default='', allow_blank=True)
    worked_hours = serializers.FloatField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
class CheckInSerializer(serializers.Serializer):
    notes = serializers.CharField(default='', allow_blank=True)
    
class CheckOutSerializer(serializers.Serializer):
    notes = serializers.CharField(default='', allow_blank=True)