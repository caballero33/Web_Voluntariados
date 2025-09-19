from django.shortcuts import redirect
from django.urls import reverse
from django.http import JsonResponse
from .models import UserStatus

class FirebaseAuthMiddleware:
    """
    Middleware para manejar la autenticación de Firebase y verificar estados de usuario
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Rutas que requieren autenticación
        protected_paths = [
            '/auth/dashboard/',
            '/auth/admin-panel/',
            '/voluntariados/',
            # Agregar más rutas protegidas aquí
        ]
        
        # Rutas que requieren estado activo
        active_user_paths = [
            '/voluntariados/',
            '/auth/join-voluntariado/',
            '/auth/volunteer-details/',
        ]
        
        # Si la ruta está protegida, verificar autenticación
        if any(request.path.startswith(path) for path in protected_paths):
            # En una implementación real, aquí verificarías el token de Firebase
            # Por ahora, solo redirigimos si no hay sesión Django (opcional)
            if not request.user.is_authenticated and not request.path.startswith('/auth/login'):
                # Para API calls, retornar JSON
                if request.path.startswith('/api/'):
                    return JsonResponse({'error': 'Authentication required'}, status=401)
                # Para páginas web, redirigir al login
                return redirect(reverse('auth:login'))
        
        # Verificar si la ruta requiere usuario activo
        if any(request.path.startswith(path) for path in active_user_paths):
            # Aquí deberías verificar el estado del usuario desde Firebase
            # Por ahora, solo verificamos si hay un header personalizado
            user_uid = request.META.get('HTTP_X_FIREBASE_UID')
            if user_uid:
                try:
                    user_status = UserStatus.objects.get(firebase_uid=user_uid)
                    if not user_status.can_access_voluntariados():
                        # Usuario inactivo, redirigir a página de estado
                        return redirect(reverse('auth:inactive_user'))
                except UserStatus.DoesNotExist:
                    # Usuario no registrado en el sistema
                    pass

        response = self.get_response(request)
        return response
