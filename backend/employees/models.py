import mongoengine as me
from datetime import datetime


class PositionHistory(me.EmbeddedDocument):
    """Historique des postes occupés (document embarqué)."""
    title      = me.StringField(required=True)
    department = me.StringField(required=True)
    start_date = me.DateTimeField(required=True)
    end_date   = me.DateTimeField(null=True)
    note       = me.StringField(default='')


class Employee(me.Document):
    """
    Fiche complète d'un employé.
    Le champ user_id pointe vers l'ObjectId du document User
    dans la collection 'users'.
    """
    GENDER_CHOICES   = ('male', 'female', 'other')
    STATUS_CHOICES   = ('active', 'inactive', 'on_leave', 'terminated')
    CONTRACT_CHOICES = ('cdi', 'cdd', 'stage', 'freelance')

    # ── Lien avec le compte utilisateur ──────────────────────────────────────
    user_id = me.StringField(default='')  # str(ObjectId) de la collection users

    # ── Informations personnelles ─────────────────────────────────────────────
    first_name = me.StringField(required=True, max_length=100)
    last_name  = me.StringField(required=True, max_length=100)
    email      = me.EmailField(required=True, unique=True)
    phone      = me.StringField(max_length=20, default='')
    gender     = me.StringField(choices=GENDER_CHOICES, default='male')
    birth_date = me.DateTimeField(null=True)
    address    = me.StringField(default='')
    photo_url  = me.StringField(default='')  # chemin relatif ex: /media/employees/EMP-0001.jpg

    # ── Informations professionnelles ─────────────────────────────────────────
    employee_id   = me.StringField(unique=True)   # ex: EMP-0042
    department    = me.StringField(required=True)
    position      = me.StringField(required=True)
    hire_date     = me.DateTimeField(required=True)
    contract_type = me.StringField(choices=CONTRACT_CHOICES, default='cdi')
    status        = me.StringField(choices=STATUS_CHOICES, default='active')

    # ── Paie ──────────────────────────────────────────────────────────────────
    base_salary  = me.FloatField(default=0.0)
    bank_account = me.StringField(default='')

    # ── Urgence ───────────────────────────────────────────────────────────────
    emergency_contact_name  = me.StringField(default='')
    emergency_contact_phone = me.StringField(default='')

    # ── Historique des postes (liste de documents embarqués) ──────────────────
    position_history = me.EmbeddedDocumentListField(PositionHistory, default=list)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'employees',
        'indexes': [
            'email',
            'employee_id',
            'department',
            'status',
            'user_id',
        ],
        'ordering': ['last_name', 'first_name'],
    }

    # ── Propriétés calculées ──────────────────────────────────────────────────
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def id(self):
        return str(self.pk)

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.employee_id}] {self.full_name} — {self.position}"