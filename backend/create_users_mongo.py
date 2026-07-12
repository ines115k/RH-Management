from mongoengine import connect
import bcrypt

# Connexion à MongoDB
connect('hrm_db', host='mongodb', port=27017)
print("✅ Connecté à MongoDB")

# Définir la collection User
from mongoengine import Document, StringField

class User(Document):
    email = StringField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(default='employee')
    is_active = StringField(default='true')
    
    meta = {'collection': 'users'}

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
