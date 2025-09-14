from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

def login_view(request):
    """Vista para mostrar el formulario de inicio de sesión"""
    return render(request, 'auth/login.html')

def register_view(request):
    """Vista para mostrar el formulario de registro"""
    return render(request, 'auth/register.html')

def dashboard_view(request):
    """Vista para el espacio de usuario autenticado"""
    return render(request, 'auth/dashboard.html')

def join_voluntariado_view(request):
    """Vista para unirse a voluntariados usando códigos"""
    return render(request, 'auth/join-voluntariado.html')

def volunteer_details_view(request):
    """Vista para mostrar detalles de un voluntariado específico"""
    return render(request, 'auth/volunteer-details.html')

def admin_panel_view(request):
    """Vista para el panel de administración"""
    return render(request, 'auth/admin-panel.html')

@csrf_exempt
def verify_token(request):
    """Endpoint para verificar tokens de Firebase (opcional para validación del lado del servidor)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            token = data.get('token')
            # Aquí podrías verificar el token con Firebase Admin SDK
            # Por ahora solo retornamos éxito
            return JsonResponse({'valid': True, 'message': 'Token válido'})
        except Exception as e:
            return JsonResponse({'valid': False, 'message': str(e)})
    
    return JsonResponse({'valid': False, 'message': 'Método no permitido'})