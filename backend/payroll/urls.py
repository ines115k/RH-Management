from django.urls import path
from .views import PaySlipListView, PaySlipDetailView

urlpatterns = [
    path('', PaySlipListView.as_view(), name='payroll-list'),
    path('<str:pk>/', PaySlipDetailView.as_view(), name='payroll-detail'),
]