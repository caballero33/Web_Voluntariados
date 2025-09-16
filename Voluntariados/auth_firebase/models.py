from django.db import models
from django.utils import timezone

class UserStatus(models.Model):
    """
    Modelo para manejar el estado de los usuarios de Firebase
    """
    STATUS_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
    ]
    
    ROLE_CHOICES = [
        ('usuario', 'Usuario'),
        ('admin', 'Administrador'),
    ]
    
    firebase_uid = models.CharField(max_length=128, unique=True, verbose_name="Firebase UID")
    email = models.EmailField(verbose_name="Email")
    nombre = models.CharField(max_length=100, blank=True, verbose_name="Nombre")
    apellido = models.CharField(max_length=100, blank=True, verbose_name="Apellido")
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactivo', verbose_name="Estado")
    rol = models.CharField(max_length=20, choices=ROLE_CHOICES, default='usuario', verbose_name="Rol")
    fecha_registro = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Registro")
    fecha_ultima_actividad = models.DateTimeField(auto_now=True, verbose_name="Última Actividad")
    voluntariados = models.JSONField(default=list, blank=True, verbose_name="Voluntariados")
    
    class Meta:
        verbose_name = "Estado de Usuario"
        verbose_name_plural = "Estados de Usuarios"
        ordering = ['-fecha_registro']
    
    def __str__(self):
        return f"{self.email} - {self.get_estado_display()}"
    
    @property
    def is_active(self):
        """Verifica si el usuario está activo"""
        return self.estado == 'activo'
    
    @property
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.rol == 'admin'
    
    def can_access_voluntariados(self):
        """Verifica si el usuario puede acceder a información de voluntariados"""
        return self.is_active
