import mongoengine as me
from datetime import datetime

class Attendance(me.Document):
    """Pointage quotidien des employés"""
    
    employee_id = me.StringField(required=True)
    date = me.DateTimeField(required=True, default=datetime.utcnow)
    check_in = me.DateTimeField()
    check_out = me.DateTimeField(null=True)
    status = me.StringField(choices=('present', 'absent', 'late', 'half_day'), default='present')
    notes = me.StringField(default='')
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)
    
    @property
    def worked_hours(self):
        if self.check_in and self.check_out:
            delta = self.check_out - self.check_in
            return round(delta.total_seconds() / 3600, 2)
        return 0
    
    meta = {
        'collection': 'attendance',
        'indexes': ['employee_id', 'date'],
        'ordering': ['-date']
    }
    
    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee_id} - {self.date.date()} - {self.status}"