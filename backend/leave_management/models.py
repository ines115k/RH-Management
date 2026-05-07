import mongoengine as me
from datetime import datetime


class LeaveRequest(me.Document):
    """
    Demande de congé soumise par un employé.
    Validée ou rejetée par un admin/manager.
    Modèle identique à attendance.LeaveRequest — source unique de vérité.
    """
    TYPE_CHOICES   = ('annual', 'sick', 'exceptional', 'unpaid', 'maternity', 'other')
    STATUS_CHOICES = ('pending', 'approved', 'rejected', 'cancelled')

    employee_id      = me.StringField(required=True)
    employee_name    = me.StringField(default='')
    leave_type       = me.StringField(choices=TYPE_CHOICES, required=True)
    start_date       = me.DateField(required=True)
    end_date         = me.DateField(required=True)
    days_count       = me.IntField(default=1)
    reason           = me.StringField(default='')
    status           = me.StringField(choices=STATUS_CHOICES, default='pending')
    approved_by      = me.StringField(default='')
    approved_at      = me.DateTimeField(null=True)
    rejection_reason = me.StringField(default='')

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'leave_requests',
        'strict': False,          # ignore les champs inconnus des anciens documents
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
        if self.start_date and self.end_date:
            # Normaliser en date si c'est un datetime
            start = self.start_date.date() if hasattr(self.start_date, 'date') else self.start_date
            end   = self.end_date.date()   if hasattr(self.end_date,   'date') else self.end_date
            delta = (end - start).days + 1
            self.days_count = max(1, delta)
        return self.days_count

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        self.compute_days()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee_name} — {self.leave_type} ({self.start_date} → {self.end_date}) [{self.status}]"