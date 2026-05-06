from rest_framework import serializers
from .models import LeaveRequest

class LeaveRequestSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    employee_id = serializers.CharField()
    type = serializers.ChoiceField(choices=LeaveRequest.LEAVE_TYPES)
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    reason = serializers.CharField(default='', allow_blank=True)
    status = serializers.CharField(read_only=True)
    reviewed_by = serializers.CharField(read_only=True)
    reviewed_at = serializers.DateTimeField(read_only=True)
    days_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    
    def get_days_count(self, obj):
        delta = obj.end_date - obj.start_date
        return delta.days + 1

class CreateLeaveRequestSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=LeaveRequest.LEAVE_TYPES)
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    reason = serializers.CharField(default='', allow_blank=True)
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError(
                "La date de fin doit être après la date de début."
            )
        return data

class ReviewLeaveSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    rejection_reason = serializers.CharField(default='', allow_blank=True)