from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/auth/',        include('authentication.urls')),
    path('api/employees/',   include('employees.urls')),
    # Modules à venir :
    # path('api/attendance/',  include('attendance.urls')),
    # path('api/payroll/',     include('payroll.urls')),
    # path('api/recruitment/', include('recruitment.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)