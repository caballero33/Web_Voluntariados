from django.shortcuts import redirect
from django.urls import reverse
from django.http import JsonResponse

class FirebaseAuthMiddleware:
    """
    Middleware para manejar la autenticación de Firebase
    (Opcional - principalmente para páginas protegidas)
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Rutas que requieren autenticación
        protected_paths = [
            '/auth/dashboard/',
            # Agregar más rutas protegidas aquí
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

        response = self.get_response(request)
        return response
