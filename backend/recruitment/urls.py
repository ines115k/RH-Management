from django.urls import path
from .views import JobOfferListView, JobOfferDetailView, ApplicationListView, ApplicationDetailView, CVUploadView

urlpatterns = [
    path('offers/', JobOfferListView.as_view()),
    path('offers/<str:pk>/', JobOfferDetailView.as_view()),
    path('applications/', ApplicationListView.as_view()),
    path('applications/<str:pk>/', ApplicationDetailView.as_view()),
    path('applications/<str:app_id>/upload-cv/', CVUploadView.as_view()),
]