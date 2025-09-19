from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods
import json
from .models import UserStatus

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

def inactive_user_view(request):
    """Vista para usuarios inactivos"""
    return render(request, 'auth/inactive-user.html')

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

@csrf_exempt
def register_user(request):
    """Endpoint para registrar un nuevo usuario en el sistema"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            firebase_uid = data.get('uid')
            email = data.get('email')
            nombre = data.get('nombre', '')
            apellido = data.get('apellido', '')
            
            if not firebase_uid or not email:
                return JsonResponse({'success': False, 'message': 'UID y email son requeridos'})
            
            # Verificar si el usuario ya existe
            if UserStatus.objects.filter(firebase_uid=firebase_uid).exists():
                return JsonResponse({'success': False, 'message': 'Usuario ya registrado'})
            
            # Crear nuevo usuario con estado inactivo por defecto
            user_status = UserStatus.objects.create(
                firebase_uid=firebase_uid,
                email=email,
                nombre=nombre,
                apellido=apellido,
                estado='inactivo',  # Estado inicial inactivo
                rol='usuario'       # Rol por defecto
            )
            
            return JsonResponse({
                'success': True, 
                'message': 'Usuario registrado exitosamente',
                'user_id': user_status.id,
                'estado': user_status.estado
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})

@csrf_exempt
def get_user_status(request):
    """Endpoint para obtener el estado de un usuario"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            firebase_uid = data.get('uid')
            
            if not firebase_uid:
                return JsonResponse({'success': False, 'message': 'UID requerido'})
            
            try:
                user_status = UserStatus.objects.get(firebase_uid=firebase_uid)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user_status.id,
                        'email': user_status.email,
                        'nombre': user_status.nombre,
                        'apellido': user_status.apellido,
                        'estado': user_status.estado,
                        'rol': user_status.rol,
                        'fecha_registro': user_status.fecha_registro.isoformat(),
                        'can_access': user_status.can_access_voluntariados()
                    }
                })
            except UserStatus.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Usuario no encontrado'})
                
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})

@csrf_exempt
def update_user_status(request):
    """Endpoint para actualizar el estado de un usuario (solo administradores)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            admin_uid = data.get('admin_uid')
            target_uid = data.get('target_uid')
            new_status = data.get('estado')
            new_role = data.get('rol')
            
            if not admin_uid or not target_uid:
                return JsonResponse({'success': False, 'message': 'UIDs requeridos'})
            
            # Verificar que el administrador existe y es admin
            try:
                admin_user = UserStatus.objects.get(firebase_uid=admin_uid)
                if not admin_user.is_admin:
                    return JsonResponse({'success': False, 'message': 'No tienes permisos de administrador'})
            except UserStatus.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Administrador no encontrado'})
            
            # Actualizar el usuario objetivo
            try:
                target_user = UserStatus.objects.get(firebase_uid=target_uid)
                if new_status:
                    target_user.estado = new_status
                if new_role:
                    target_user.rol = new_role
                target_user.save()
                
                return JsonResponse({
                    'success': True,
                    'message': 'Estado actualizado exitosamente',
                    'new_status': target_user.estado,
                    'new_role': target_user.rol
                })
            except UserStatus.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Usuario objetivo no encontrado'})
                
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})

@csrf_exempt
def get_all_users(request):
    """Endpoint para obtener todos los usuarios (solo administradores)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            admin_uid = data.get('admin_uid')
            
            if not admin_uid:
                return JsonResponse({'success': False, 'message': 'UID de administrador requerido'})
            
            # Verificar que el usuario es administrador
            try:
                admin_user = UserStatus.objects.get(firebase_uid=admin_uid)
                if not admin_user.is_admin:
                    return JsonResponse({'success': False, 'message': 'No tienes permisos de administrador'})
            except UserStatus.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Administrador no encontrado'})
            
            # Obtener todos los usuarios
            users = UserStatus.objects.all()
            users_data = []
            for user in users:
                users_data.append({
                    'id': user.id,
                    'firebase_uid': user.firebase_uid,
                    'email': user.email,
                    'nombre': user.nombre,
                    'apellido': user.apellido,
                    'estado': user.estado,
                    'rol': user.rol,
                    'fecha_registro': user.fecha_registro.isoformat(),
                    'fecha_ultima_actividad': user.fecha_ultima_actividad.isoformat(),
                    'voluntariados': user.voluntariados
                })
            
            return JsonResponse({
                'success': True,
                'users': users_data
            })
                
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})