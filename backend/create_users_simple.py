import sys
import os
import django

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrm_backend.settings')
django.setup()

from mongoengine import connect
from decouple import config

# Forcer la connexion à MongoDB avec les paramètres
connect(
    db='hrm_db',
    host='mongodb',
    port=27017
)
print("✅ Connecté à MongoDB")

from authentication.models import User
import bcrypt

# Créer un superadmin
admin = User(
    email='admin@test.com',
    password=bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
    role='admin'
)
admin.save()
print("✅ Superadmin créé : admin@test.com / admin123")

# Créer un employé
employee = User(
    email='employee1@test.com',
    password=bcrypt.hashpw('test123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
    role='employee'
)
employee.save()
print("✅ Employé créé : employee1@test.com / test123")

print("\n📋 Utilisateurs créés :")
for user in User.objects.all():
    print(f"  - {user.email} ({user.role})")
