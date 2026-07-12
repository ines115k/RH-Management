from mongoengine import connect
from authentication.models import User
import bcrypt

# ===== Connexion à MongoDB (EXACTEMENT comme le test) =====
connect('hrm_db', host='mongodb', port=27017)
print("✅ Connecté à MongoDB")

# ===== Création des utilisateurs =====
print("📝 Création des utilisateurs...")

try:
    # Créer un superadmin
    admin = User(
        email='admin@test.com',
        password=bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        role='admin'
    )
    admin.save()
    print("✅ Superadmin créé : admin@test.com / admin123")
except Exception as e:
    print(f"❌ Erreur admin: {e}")

try:
    # Créer un employé
    employee = User(
        email='employee1@test.com',
        password=bcrypt.hashpw('test123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        role='employee'
    )
    employee.save()
    print("✅ Employé créé : employee1@test.com / test123")
except Exception as e:
    print(f"❌ Erreur employee: {e}")

print("\n📋 Utilisateurs créés :")
for user in User.objects.all():
    print(f"  - {user.email} ({user.role})")
