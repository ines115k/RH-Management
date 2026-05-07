from django.urls import path
from .views import (
    MyLeaveRequestsView,
    CreateLeaveRequestView,
    CancelLeaveRequestView,
    AllLeaveRequestsView,
    LeaveDecisionView,
    LeaveStatsView,
    LeaveSummaryView,
)

urlpatterns = [
    # ── Employé ────────────────────────────────────────────────────────────────
    path('my-requests/',          MyLeaveRequestsView.as_view(),    name='leave-my-requests'),
    path('create/',               CreateLeaveRequestView.as_view(), name='leave-create'),
    path('<str:pk>/cancel/',      CancelLeaveRequestView.as_view(), name='leave-cancel'),

    # ── Admin / Manager ────────────────────────────────────────────────────────
    path('all/',                  AllLeaveRequestsView.as_view(),   name='leave-all'),
    path('<str:pk>/decision/',    LeaveDecisionView.as_view(),      name='leave-decision'),

    # ── Stats ──────────────────────────────────────────────────────────────────
    path('stats/',                LeaveStatsView.as_view(),         name='leave-stats'),
    path('summary/',              LeaveSummaryView.as_view(),       name='leave-summary'),
]