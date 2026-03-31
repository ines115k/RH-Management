import mongoengine as me
from datetime import datetime
import bcrypt


class User(me.Document):
    """
    Document MongoDB remplaçant django.contrib.auth.models.User.
    Utilisé par SimpleJWT via le backend personnalisé.
    """
    ROLE_CHOICES = ('admin', 'manager', 'employee')

    email      = me.EmailField(required=True, unique=True)
    password   = me.StringField(required=True)
    first_name = me.StringField(max_length=100, default='')
    last_name  = me.StringField(max_length=100, default='')
    role       = me.StringField(choices=ROLE_CHOICES, default='employee')
    is_active  = me.BooleanField(default=True)
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'users',
        'indexes': ['email'],
        'ordering': ['-created_at'],
    }

    # ── Propriétés requises par DRF ───────────────────────────────────────────
    @property
    def id(self):
        return str(self.pk)

    @property
    def is_authenticated(self):
        return self.is_active

    @property
    def is_anonymous(self):
        return False

    @property
    def pk_str(self):
        return str(self.pk)

    # ── Gestion du mot de passe ───────────────────────────────────────────────
    def set_password(self, raw_password: str):
        """Hache le mot de passe avec bcrypt."""
        salt = bcrypt.gensalt()
        self.password = bcrypt.hashpw(
            raw_password.encode('utf-8'), salt
        ).decode('utf-8')

    def check_password(self, raw_password: str) -> bool:
        """Vérifie le mot de passe en clair contre le hash stocké."""
        try:
            return bcrypt.checkpw(
                raw_password.encode('utf-8'),
                self.password.encode('utf-8')
            )
        except Exception:
            return False

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} [{self.role}]"