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
    path('inactive-user/', views.inactive_user_view, name='inactive_user'),
    path('verify-token/', views.verify_token, name='verify_token'),
    
    # Nuevas rutas para gestión de usuarios
    path('api/register-user/', views.register_user, name='register_user'),
    path('api/get-user-status/', views.get_user_status, name='get_user_status'),
    path('api/update-user-status/', views.update_user_status, name='update_user_status'),
    path('api/get-all-users/', views.get_all_users, name='get_all_users'),
]
