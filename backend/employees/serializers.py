from rest_framework import serializers
from .models import Employee, PositionHistory


class PositionHistorySerializer(serializers.Serializer):
    title      = serializers.CharField()
    department = serializers.CharField()
    start_date = serializers.DateTimeField()
    end_date   = serializers.DateTimeField(allow_null=True, required=False)
    note       = serializers.CharField(default='', allow_blank=True)


class EmployeeSerializer(serializers.Serializer):
    """Sérialisation complète — utilisé en lecture."""
    id         = serializers.CharField(read_only=True)
    user_id    = serializers.CharField(read_only=True)
    full_name  = serializers.SerializerMethodField()

    first_name = serializers.CharField(max_length=100)
    last_name  = serializers.CharField(max_length=100)
    email      = serializers.EmailField()
    phone      = serializers.CharField(default='', allow_blank=True)
    gender     = serializers.ChoiceField(choices=('male', 'female', 'other'))
    birth_date = serializers.DateTimeField(allow_null=True, required=False)
    address    = serializers.CharField(default='', allow_blank=True)
    photo_url  = serializers.CharField(read_only=True)

    employee_id   = serializers.CharField(read_only=True)
    department    = serializers.CharField()
    position      = serializers.CharField()
    hire_date     = serializers.DateTimeField()
    contract_type = serializers.ChoiceField(choices=('cdi', 'cdd', 'stage', 'freelance'))
    status        = serializers.ChoiceField(
        choices=('active', 'inactive', 'on_leave', 'terminated')
    )
    base_salary  = serializers.FloatField(default=0.0)
    bank_account = serializers.CharField(default='', allow_blank=True)

    emergency_contact_name  = serializers.CharField(default='', allow_blank=True)
    emergency_contact_phone = serializers.CharField(default='', allow_blank=True)

    position_history = PositionHistorySerializer(many=True, read_only=True)
    created_at       = serializers.DateTimeField(read_only=True)
    updated_at       = serializers.DateTimeField(read_only=True)

    def get_full_name(self, obj):
        return obj.full_name


class EmployeeCreateSerializer(serializers.Serializer):
    """Validation à la création d'un employé."""
    first_name = serializers.CharField(max_length=100)
    last_name  = serializers.CharField(max_length=100)
    email      = serializers.EmailField()
    phone      = serializers.CharField(default='', allow_blank=True)
    gender     = serializers.ChoiceField(choices=('male', 'female', 'other'), default='male')
    birth_date = serializers.DateTimeField(allow_null=True, required=False)
    address    = serializers.CharField(default='', allow_blank=True)

    department    = serializers.CharField()
    position      = serializers.CharField()
    hire_date     = serializers.DateTimeField()
    contract_type = serializers.ChoiceField(
        choices=('cdi', 'cdd', 'stage', 'freelance'), default='cdi'
    )
    base_salary  = serializers.FloatField(default=0.0)
    bank_account = serializers.CharField(default='', allow_blank=True)

    emergency_contact_name  = serializers.CharField(default='', allow_blank=True)
    emergency_contact_phone = serializers.CharField(default='', allow_blank=True)

    def validate_email(self, value):
        if Employee.objects(email=value.lower()).first():
            raise serializers.ValidationError(
                "Un employé avec cet email existe déjà."
            )
        return value.lower()

    def create(self, validated_data):
        # Générer un employee_id unique séquentiel
        count = Employee.objects.count()
        validated_data['employee_id'] = f"EMP-{count + 1:04d}"
        emp = Employee(**validated_data)
        emp.save()
        return emp


class EmployeeUpdateSerializer(serializers.Serializer):
    """Validation pour la mise à jour partielle."""
    first_name = serializers.CharField(max_length=100, required=False)
    last_name  = serializers.CharField(max_length=100, required=False)
    phone      = serializers.CharField(required=False, allow_blank=True)
    gender     = serializers.ChoiceField(
        choices=('male', 'female', 'other'), required=False
    )
    birth_date = serializers.DateTimeField(required=False, allow_null=True)
    address    = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False)
    position   = serializers.CharField(required=False)
    contract_type = serializers.ChoiceField(
        choices=('cdi', 'cdd', 'stage', 'freelance'), required=False
    )
    status = serializers.ChoiceField(
        choices=('active', 'inactive', 'on_leave', 'terminated'), required=False
    )
    base_salary  = serializers.FloatField(required=False)
    bank_account = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_name  = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_phone = serializers.CharField(required=False, allow_blank=True)