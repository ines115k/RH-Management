from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path('api/auth/', include('authentication.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/attendance/', include('attendance.urls')),  # ← AJOUTER
    path('api/leave/', include('leave_management.urls')),  # ← AJOUTER
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

