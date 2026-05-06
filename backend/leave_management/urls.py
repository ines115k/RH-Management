from django.urls import path
from .views import (
    CreateLeaveRequestView, MyLeaveRequestsView,
    AllLeaveRequestsView, ReviewLeaveRequestView, LeaveStatsView
)

urlpatterns = [
    path('create/', CreateLeaveRequestView.as_view(), name='leave-create'),
    path('my-requests/', MyLeaveRequestsView.as_view(), name='leave-my-requests'),
    path('all/', AllLeaveRequestsView.as_view(), name='leave-all'),
    path('stats/', LeaveStatsView.as_view(), name='leave-stats'),
    path('review/<str:pk>/', ReviewLeaveRequestView.as_view(), name='leave-review'),
]