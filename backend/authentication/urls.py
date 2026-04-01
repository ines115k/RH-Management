from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView,
    ProfileView, ChangePasswordView,
    TokenRefreshView, UserListView, UserDetailView
)

urlpatterns = [
    path('register/',        RegisterView.as_view(),       name='auth-register'),
    path('login/',           LoginView.as_view(),          name='auth-login'),
    path('logout/',          LogoutView.as_view(),         name='auth-logout'),
    path('profile/',         ProfileView.as_view(),        name='auth-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('token/refresh/',   TokenRefreshView.as_view(),   name='auth-token-refresh'),
    path('users/',           UserListView.as_view(),       name='auth-users'),
    path('users/<str:pk>/',  UserDetailView.as_view(),     name='auth-user-detail'),
]