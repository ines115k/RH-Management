import mongoengine as me
from datetime import datetime


class Attendance(me.Document):
    """
    Enregistrement de présence journalier.
    Un document par employé par jour.
    """
    STATUS_CHOICES = ('present', 'absent', 'late', 'half_day', 'holiday')

    employee_id   = me.StringField(required=True)   # str(ObjectId) Employee
    employee_name = me.StringField(default='')       # dénormalisé pour les rapports
    date          = me.DateField(required=True)      # date du jour (sans heure)
    check_in      = me.DateTimeField(null=True)      # heure d'arrivée
    check_out     = me.DateTimeField(null=True)      # heure de départ
    duration      = me.FloatField(default=0.0)       # heures travaillées (calculé)
    status        = me.StringField(choices=STATUS_CHOICES, default='absent')
    note          = me.StringField(default='')
    created_by    = me.StringField(default='')       # str(ObjectId) User

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'attendance',
        'indexes': [
            'employee_id',
            'date',
            ('employee_id', 'date'),   # index composé — un seul pointage par jour
        ],
        'ordering': ['-date'],
    }

    @property
    def id(self):
        return str(self.pk)

    def compute_duration(self):
        """Calcule la durée en heures entre check_in et check_out."""
        if self.check_in and self.check_out:
            delta = self.check_out - self.check_in
            self.duration = round(delta.total_seconds() / 3600, 2)
        return self.duration

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        if self.check_in and self.check_out:
            self.compute_duration()
            # Statut automatique selon la durée
            if self.duration >= 7:
                self.status = 'present'
            elif self.duration >= 3.5:
                self.status = 'half_day'
            else:
                self.status = 'late'
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee_name} — {self.date} [{self.status}]"


class LeaveRequest(me.Document):
    """
    Demande de congé soumise par un employé.
    Validée ou rejetée par un admin/manager.
    """
    TYPE_CHOICES   = ('annual', 'sick', 'exceptional', 'unpaid', 'maternity', 'other')
    STATUS_CHOICES = ('pending', 'approved', 'rejected', 'cancelled')

    employee_id   = me.StringField(required=True)
    employee_name = me.StringField(default='')
    leave_type    = me.StringField(choices=TYPE_CHOICES, required=True)
    start_date    = me.DateField(required=True)
    end_date      = me.DateField(required=True)
    days_count    = me.IntField(default=1)          # calculé automatiquement
    reason        = me.StringField(default='')
    status        = me.StringField(choices=STATUS_CHOICES, default='pending')
    approved_by   = me.StringField(default='')      # str(ObjectId) User
    approved_at   = me.DateTimeField(null=True)
    rejection_reason = me.StringField(default='')

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'leave_requests',
        'indexes': [
            'employee_id',
            'status',
            'start_date',
            ('employee_id', 'status'),
        ],
        'ordering': ['-created_at'],
    }

    @property
    def id(self):
        return str(self.pk)

    def compute_days(self):
        """Calcule le nombre de jours ouvrables entre start et end."""
        if self.start_date and self.end_date:
            delta = (self.end_date - self.start_date).days + 1
            self.days_count = max(1, delta)
        return self.days_count

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        self.compute_days()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee_name} — {self.leave_type} ({self.start_date} → {self.end_date}) [{self.status}]"