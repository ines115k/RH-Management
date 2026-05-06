import mongoengine as me
from datetime import datetime

class LeaveRequest(me.Document):
    LEAVE_TYPES = (
        ('annual', 'Congé annuel'),
        ('sick', 'Congé maladie'),
        ('unpaid', 'Congé sans solde'),
        ('exceptional', 'Congé exceptionnel'),
    )
    
    STATUSES = (
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Refusé'),
    )
    
    employee_id = me.StringField(required=True)
    type = me.StringField(choices=LEAVE_TYPES, required=True)
    start_date = me.DateTimeField(required=True)
    end_date = me.DateTimeField(required=True)
    reason = me.StringField(default='')
    status = me.StringField(default='pending', choices=STATUSES)
    reviewed_by = me.StringField(default='')
    reviewed_at = me.DateTimeField(null=True)
    created_at = me.DateTimeField(default=datetime.utcnow)
    
    meta = {'collection': 'leave_requests'}
