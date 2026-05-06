from rest_framework import serializers
from .models import JobOffer, Application

class JobOfferSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    department = serializers.CharField()
    location = serializers.CharField()
    description = serializers.CharField()
    requirements = serializers.CharField()
    contract_type = serializers.ChoiceField(choices=('cdi','cdd','stage','freelance'))
    published_date = serializers.DateTimeField(read_only=True)
    closing_date = serializers.DateTimeField(allow_null=True)
    status = serializers.ChoiceField(choices=('draft','published','closed'))
    created_by = serializers.CharField(read_only=True)

class JobOfferCreateSerializer(serializers.Serializer):
    title = serializers.CharField()
    department = serializers.CharField()
    description = serializers.CharField()
    requirements = serializers.CharField()
    contract_type = serializers.ChoiceField(choices=('cdi','cdd','stage','freelance'))
    location = serializers.CharField(required=False, allow_blank=True)
    closing_date = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=('draft','published','closed'), default='draft')

class ApplicationSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    job_offer_id = serializers.CharField()
    employee_id = serializers.CharField()
    job_title = serializers.SerializerMethodField()
    employee_name = serializers.CharField(read_only=True)
    applied_date = serializers.DateTimeField(read_only=True)
    cover_letter = serializers.CharField(allow_blank=True)
    cv_url = serializers.CharField(read_only=True)
    status = serializers.ChoiceField(choices=('pending','reviewed','accepted','rejected'))
    reviewed_by = serializers.CharField(read_only=True)
    reviewed_at = serializers.DateTimeField(read_only=True)
    feedback = serializers.CharField(read_only=True)

    def get_job_title(self, obj):
        try:
            return JobOffer.objects.get(pk=obj.job_offer_id).title
        except:
            return ''

class ApplicationUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=('reviewed','accepted','rejected'))
    feedback = serializers.CharField(required=False, allow_blank=True)