import mongoengine as me
from datetime import datetime

class JobOffer(me.Document):
    title = me.StringField(required=True)
    department = me.StringField(required=True)
    contract_type = me.StringField(choices=('cdi', 'cdd', 'stage', 'freelance'), required=True)
    location = me.StringField(default='')
    description = me.StringField(required=True)
    requirements = me.StringField(required=True)
    published_date = me.DateTimeField(default=datetime.utcnow)
    closing_date = me.DateTimeField(null=True)
    status = me.StringField(choices=('draft', 'published', 'closed'), default='draft')
    created_by = me.StringField()

    meta = {'collection': 'job_offers', 'indexes': ['title', 'status', 'department'], 'ordering': ['-published_date']}
    @property
    def id(self): return str(self.pk)

class Application(me.Document):
    job_offer_id = me.StringField(required=True)
    employee_id = me.StringField(required=True)
    employee_name = me.StringField()
    applied_date = me.DateTimeField(default=datetime.utcnow)
    cover_letter = me.StringField(default='')
    cv_url = me.StringField(default='')
    status = me.StringField(choices=('pending', 'reviewed', 'accepted', 'rejected'), default='pending')
    reviewed_by = me.StringField(default='')
    reviewed_at = me.DateTimeField(null=True)
    feedback = me.StringField(default='')

    meta = {'collection': 'applications', 'indexes': [('job_offer_id', 'employee_id'), 'status'], 'ordering': ['-applied_date']}
    @property
    def id(self): return str(self.pk)