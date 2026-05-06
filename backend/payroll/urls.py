from django.urls import path
from .views import PaySlipListView, PaySlipDetailView

urlpatterns = [
    path('', PaySlipListView.as_view(), name='payslip-list'),
    path('<str:pk>/', PaySlipDetailView.as_view(), name='payslip-detail'),
]