import mongoengine as me
from datetime import datetime

class JobOffer(me.Document):
    """Offre d'emploi"""
    
    title = me.StringField(required=True)  # Titre du poste
    department = me.StringField(required=True)  # Département
    contract_type = me.StringField(choices=('CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'), default='CDI')
    location = me.StringField(required=True)  # Lieu
    description = me.StringField(required=True)  # Description du poste
    requirements = me.StringField(required=True)  # Prérequis
    experience = me.StringField(default='')  # Expérience requise
    education = me.StringField(default='')  # Niveau d'étude
    
    is_active = me.BooleanField(default=True)  # Offre active ou non
    posted_date = me.DateTimeField(default=datetime.utcnow)
    deadline = me.DateTimeField()  # Date limite de candidature
    
    created_by = me.StringField()  # ID de l'utilisateur qui a créé l'offre
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'job_offers',
        'indexes': ['title', 'department', 'is_active'],
        'ordering': ['-posted_date']
    }
    
    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.department}"


class JobApplication(me.Document):
    """Candidature"""
    
    STATUSES = (
        ('pending', 'En attente'),
        ('reviewed', 'Examinée'),
        ('interview', 'Entretien'),
        ('accepted', 'Acceptée'),
        ('rejected', 'Refusée'),
    )
    
    offer = me.ReferenceField(JobOffer, required=True)  # Offre concernée
    offer_title = me.StringField()  # Dénormalisé
    
    # Informations candidat
    first_name = me.StringField(required=True)
    last_name = me.StringField(required=True)
    email = me.EmailField(required=True)
    phone = me.StringField()
    current_position = me.StringField()  # Poste actuel
    experience_years = me.IntField(default=0)
    
    # Candidature
    cover_letter = me.StringField(required=True)  # Lettre de motivation
    cv_url = me.StringField()  # Chemin du CV
    portfolio_url = me.StringField()  # Lien portfolio (optionnel)
    linkedin_url = me.StringField()  # Lien LinkedIn
    
    status = me.StringField(choices=STATUSES, default='pending')
    comments = me.StringField(default='')  # Commentaires RH
    reviewed_by = me.StringField()  # ID du recruteur
    reviewed_at = me.DateTimeField(null=True)
    
    applied_date = me.DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'job_applications',
        'indexes': ['offer', 'email', 'status'],
        'ordering': ['-applied_date']
    }
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.offer_title}"