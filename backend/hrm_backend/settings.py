from pathlib import Path
from datetime import timedelta
from decouple import config
import mongoengine

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='change-me-in-production')
DEBUG      = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['*']

# ── Apps ──────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    # Apps Django obligatoires (simplejwt en a besoin)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    # Apps du projet
    'authentication',
    'employees',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hrm_backend.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

WSGI_APPLICATION = 'hrm_backend.wsgi.application'

# ── SQLite pour Django auth/admin/sessions ────────────────────────────────────
# simplejwt a besoin de django.contrib.auth → besoin d'une vraie DB SQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ── MongoDB pour les données métier (employés, congés...) ────────────────────
mongoengine.connect(
    db=config('MONGO_DB_NAME', default='hrm_db'),
    host=config('MONGO_HOST', default='localhost'),
    port=config('MONGO_PORT', default=27017, cast=int),
)

# ── DRF ──────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'ALGORITHM':              'HS256',
    'SIGNING_KEY':            SECRET_KEY,
    'AUTH_HEADER_TYPES':      ('Bearer',),
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