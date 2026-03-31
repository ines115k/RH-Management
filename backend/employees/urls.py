from django.urls import path
from .views import (
    EmployeeListView, EmployeeDetailView,
    EmployeePhotoView, EmployeeStatsView,
    EmployeeHistoryView
)

urlpatterns = [
    path('',               EmployeeListView.as_view(),   name='employee-list'),
    path('stats/',         EmployeeStatsView.as_view(),  name='employee-stats'),
    path('<str:pk>/',      EmployeeDetailView.as_view(), name='employee-detail'),
    path('<str:pk>/photo/',   EmployeePhotoView.as_view(),   name='employee-photo'),
    path('<str:pk>/history/', EmployeeHistoryView.as_view(), name='employee-history'),
]