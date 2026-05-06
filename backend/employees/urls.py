from django.urls import path
from .views import (
    EmployeeListView, 
    EmployeeDetailView, 
    EmployeePhotoView, 
    EmployeeStatsView, 
    EmployeeHistoryView,
    MyEmployeeInfoView  # ← AJOUTER CETTE LIGNE
)

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('stats/', EmployeeStatsView.as_view(), name='employee-stats'),
    path('me/', MyEmployeeInfoView.as_view(), name='my-employee-info'),
    path('<str:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('<str:pk>/photo/', EmployeePhotoView.as_view(), name='employee-photo'),
    path('<str:pk>/history/', EmployeeHistoryView.as_view(), name='employee-history'),
]