from rest_framework import serializers
from .models import JobOffer, JobApplication


class JobOfferSerializer(serializers.Serializer):
    """Sérializer pour les offres d'emploi"""
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    department = serializers.CharField()
    contract_type = serializers.CharField()
    location = serializers.CharField()
    description = serializers.CharField()
    requirements = serializers.CharField()
    experience = serializers.CharField()
    education = serializers.CharField()
    is_active = serializers.BooleanField()
    posted_date = serializers.DateTimeField(read_only=True)
    deadline = serializers.DateTimeField()
    created_by = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)


class JobOfferCreateSerializer(serializers.Serializer):
    """Création d'une offre"""
    title = serializers.CharField()
    department = serializers.CharField()
    contract_type = serializers.CharField()
    location = serializers.CharField()
    description = serializers.CharField()
    requirements = serializers.CharField()
    experience = serializers.CharField(default='', allow_blank=True)
    education = serializers.CharField(default='', allow_blank=True)
    deadline = serializers.DateTimeField()
    is_active = serializers.BooleanField(default=True)


class JobApplicationSerializer(serializers.Serializer):
    """Sérializer pour les candidatures"""
    id = serializers.CharField(read_only=True)
    offer = serializers.CharField()
    offer_title = serializers.CharField(read_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(default='', allow_blank=True)
    current_position = serializers.CharField(default='', allow_blank=True)
    experience_years = serializers.IntegerField(default=0)
    cover_letter = serializers.CharField()
    cv_url = serializers.CharField(read_only=True)
    portfolio_url = serializers.CharField(default='', allow_blank=True)
    linkedin_url = serializers.CharField(default='', allow_blank=True)
    status = serializers.CharField(read_only=True)
    comments = serializers.CharField(read_only=True)
    applied_date = serializers.DateTimeField(read_only=True)


class JobApplicationCreateSerializer(serializers.Serializer):
    """Soumission d'une candidature"""
    offer_id = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(default='', allow_blank=True)
    current_position = serializers.CharField(default='', allow_blank=True)
    experience_years = serializers.IntegerField(default=0)
    cover_letter = serializers.CharField()
    portfolio_url = serializers.CharField(default='', allow_blank=True)
    linkedin_url = serializers.CharField(default='', allow_blank=True)
    
    def validate_offer_id(self, value):
        try:
            from .models import JobOffer
            offer = JobOffer.objects.get(pk=value)
            if not offer.is_active:
                raise serializers.ValidationError("Cette offre n'est plus active")
            return value
        except:
            raise serializers.ValidationError("Offre non trouvée")


class JobApplicationReviewSerializer(serializers.Serializer):
    """Validation d'une candidature (RH)"""
    status = serializers.ChoiceField(choices=['reviewed', 'interview', 'accepted', 'rejected'])
    comments = serializers.CharField(default='', allow_blank=True)