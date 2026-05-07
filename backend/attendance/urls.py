from django.urls import path
from .views import (
    CheckInSelfView, CheckInView, CheckOutSelfView, CheckOutView,
    AttendanceListView, AttendanceTodayView,
    MyAttendanceTodayView, AttendanceStatsView,
    LeaveRequestListView, LeaveRequestDetailView,
    LeaveDecisionView, LeaveSummaryView, AttendanceHistoryView,
)

urlpatterns = [
    # ── Pointage ───────────────────────────────────────────────────────────────
    # Chemins spécifiques (sans paramètres) avant les chemins avec paramètres
    path('checkin/self/',                   CheckInSelfView.as_view(),      name='checkin-self'),
    path('checkout/self/', CheckOutSelfView.as_view(), name='checkout-self'),
    path('today/',                          AttendanceTodayView.as_view(),  name='attendance-today'),
    path('my-today/',                       MyAttendanceTodayView.as_view(),name='my-today'),
    path('stats/',                          AttendanceStatsView.as_view(),  name='attendance-stats'),
    path('history/', AttendanceHistoryView.as_view(), name='attendance-history'),
    # Chemins avec paramètres
    path('checkin/',                        CheckInView.as_view(),          name='checkin'),
    path('checkout/<str:employee_id>/',     CheckOutView.as_view(),         name='checkout'),
    path('',                                AttendanceListView.as_view(),   name='attendance-list'),

    # ── Congés ─────────────────────────────────────────────────────────────────
    path('leaves/summary/',                 LeaveSummaryView.as_view(),     name='leave-summary'),
    path('leaves/<str:pk>/decision/',       LeaveDecisionView.as_view(),    name='leave-decision'),
    path('leaves/<str:pk>/',                LeaveRequestDetailView.as_view(),name='leave-detail'),
    path('leaves/',                         LeaveRequestListView.as_view(), name='leave-list'),
    
]