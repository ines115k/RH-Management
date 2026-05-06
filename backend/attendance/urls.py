from django.urls import path
from .views import (
    CheckInView, CheckOutView, 
    TodayAttendanceView, AttendanceHistoryView
)

urlpatterns = [
    path('check-in/', CheckInView.as_view(), name='attendance-checkin'),
    path('check-out/', CheckOutView.as_view(), name='attendance-checkout'),
    path('today/', TodayAttendanceView.as_view(), name='attendance-today'),
    path('history/', AttendanceHistoryView.as_view(), name='attendance-history'),
]