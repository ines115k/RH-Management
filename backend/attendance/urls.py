from django.urls import path
from .views import (
    CheckInView, CheckOutView,
    AttendanceListView, AttendanceTodayView,
    MyAttendanceTodayView, AttendanceStatsView,
    LeaveRequestListView, LeaveRequestDetailView,
    LeaveDecisionView, LeaveSummaryView,
)

urlpatterns = [
    # ── Pointage ───────────────────────────────────────────────────────────────
    path('checkin/',                        CheckInView.as_view(),          name='checkin'),
    path('checkout/<str:employee_id>/',     CheckOutView.as_view(),         name='checkout'),
    path('',                                AttendanceListView.as_view(),   name='attendance-list'),
    path('today/',                          AttendanceTodayView.as_view(),  name='attendance-today'),
    path('my-today/',                       MyAttendanceTodayView.as_view(),name='my-today'),
    path('stats/',                          AttendanceStatsView.as_view(),  name='attendance-stats'),

    # ── Congés ─────────────────────────────────────────────────────────────────
    path('leaves/',                         LeaveRequestListView.as_view(), name='leave-list'),
    path('leaves/summary/',                 LeaveSummaryView.as_view(),     name='leave-summary'),
    path('leaves/<str:pk>/',                LeaveRequestDetailView.as_view(),name='leave-detail'),
    path('leaves/<str:pk>/decision/',       LeaveDecisionView.as_view(),    name='leave-decision'),
]