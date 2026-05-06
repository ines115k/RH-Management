from django.urls import path
from .views import (
    JobOfferListView, JobOfferDetailView, JobOfferManageView,
    JobApplicationCreateView, JobApplicationListView, JobApplicationDetailView
)

urlpatterns = [
    # Offres (publiques)
    path('offers/', JobOfferListView.as_view(), name='offers-list'),
    path('offers/<str:pk>/', JobOfferDetailView.as_view(), name='offers-detail'),
    
    # Gestion offres (admin/manager)
    path('manage/offers/', JobOfferManageView.as_view(), name='manage-offers'),
    path('manage/offers/<str:pk>/', JobOfferManageView.as_view(), name='manage-offers-detail'),
    
    # Candidatures
    path('apply/', JobApplicationCreateView.as_view(), name='job-apply'),
    path('applications/', JobApplicationListView.as_view(), name='applications-list'),
    path('applications/<str:pk>/', JobApplicationDetailView.as_view(), name='applications-detail'),
]