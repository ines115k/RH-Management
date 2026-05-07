from pathlib import Path
from datetime import timedelta
from decouple import config
import mongoengine

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='change-me-in-production')
DEBUG      = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['*']

# ── Apps ──────────────────────────────────────────────────────────────────────
# django.contrib.auth est requis par rest_framework_simplejwt au démarrage.
# On le garde dans INSTALLED_APPS mais on désactive ses migrations (voir plus bas)
# et on n'utilise JAMAIS son User — on utilise authentication.models.User (MongoEngine).
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'authentication',
    'employees',
    'attendance',
    'payroll',
    'recruitment',
    'leave_management',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hrm_backend.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
    ]},
}]

WSGI_APPLICATION = 'hrm_backend.wsgi.application'

# ── MongoDB via MongoEngine ───────────────────────────────────────────────────
MONGO_DB_NAME = config('MONGO_DB_NAME', default='hrm_db')
MONGO_HOST    = config('MONGO_HOST',    default='localhost')
MONGO_PORT    = config('MONGO_PORT',    default=27017, cast=int)
MONGO_USER    = config('MONGO_USER',    default='')
MONGO_PASS    = config('MONGO_PASS',    default='')

if MONGO_USER and MONGO_PASS:
    mongoengine.connect(
        db=MONGO_DB_NAME,
        host=MONGO_HOST,
        port=MONGO_PORT,
        username=MONGO_USER,
        password=MONGO_PASS,
        authentication_source='admin',
    )
else:
    mongoengine.connect(
        db=MONGO_DB_NAME,
        host=MONGO_HOST,
        port=MONGO_PORT,
    )

# Backend dummy — zéro SQL, uniquement MongoDB
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.dummy',
    }
}

# ── Désactiver toutes les migrations Django ───────────────────────────────────
# Le backend dummy interdit toute opération SQL.
# On désactive les migrations de django.contrib.auth et contenttypes
# pour qu'elles ne tentent pas de créer des tables SQL.
MIGRATION_MODULES = {
    'auth':          'hrm_backend.disable_migrations',
    'contenttypes':  'hrm_backend.disable_migrations',
}

# ── DRF ───────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'authentication.backends.MongoJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# ── SimpleJWT ─────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  False,
    'ALGORITHM':              'HS256',
    'SIGNING_KEY':            SECRET_KEY,
    'AUTH_HEADER_TYPES':      ('Bearer',),
    'USER_ID_FIELD':          'id',
    'USER_ID_CLAIM':          'user_id',
    'AUTH_TOKEN_CLASSES':     ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM':       'token_type',
    'JTI_CLAIM':              'jti',
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ── i18n ─────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE     = 'Africa/Tunis'
USE_I18N      = True
USE_TZ        = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'