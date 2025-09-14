from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('join-voluntariado/', views.join_voluntariado_view, name='join_voluntariado'),
    path('volunteer-details/', views.volunteer_details_view, name='volunteer_details'),
    path('admin-panel/', views.admin_panel_view, name='admin_panel'),
    path('verify-token/', views.verify_token, name='verify_token'),
]
