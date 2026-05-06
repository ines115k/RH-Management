import mongoengine as me
from datetime import datetime

class PaySlip(me.Document):
    employee_id   = me.StringField(required=True)  # ObjectId de Employee
    employee_name = me.StringField()               # dénormalisé
    month         = me.IntField(required=True, min_value=1, max_value=12)
    year          = me.IntField(required=True)
    base_salary   = me.FloatField(default=0.0)
    bonus         = me.FloatField(default=0.0)     # primes
    deductions    = me.FloatField(default=0.0)     # déductions
    net_salary    = me.FloatField(default=0.0)
    worked_hours  = me.FloatField(default=0.0)     # heures travaillées dans le mois
    status        = me.StringField(choices=('draft', 'validated', 'paid'), default='draft')
    pdf_url       = me.StringField(default='')
    generated_at  = me.DateTimeField(default=datetime.utcnow)
    validated_by  = me.StringField(default='')     # user id
    validated_at  = me.DateTimeField(null=True)

    meta = {
        'collection': 'pay_slips',
        'indexes': [
            ('employee_id', 'month', 'year'),
            'status',
        ],
        'ordering': ['-year', '-month'],
    }

    @property
    def id(self):
        return str(self.pk)