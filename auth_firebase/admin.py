from django.contrib import admin
from .models import UserStatus

@admin.register(UserStatus)
class UserStatusAdmin(admin.ModelAdmin):
    list_display = ['email', 'nombre', 'apellido', 'estado', 'rol', 'fecha_registro']
    list_filter = ['estado', 'rol', 'fecha_registro']
    search_fields = ['email', 'nombre', 'apellido', 'firebase_uid']
    readonly_fields = ['firebase_uid', 'fecha_registro', 'fecha_ultima_actividad']
    list_editable = ['estado', 'rol']
    ordering = ['-fecha_registro']
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('firebase_uid', 'email', 'nombre', 'apellido')
        }),
        ('Estado y Rol', {
            'fields': ('estado', 'rol')
        }),
        ('Fechas', {
            'fields': ('fecha_registro', 'fecha_ultima_actividad'),
            'classes': ('collapse',)
        }),
        ('Voluntariados', {
            'fields': ('voluntariados',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_users', 'deactivate_users', 'make_admin', 'remove_admin']
    
    def activate_users(self, request, queryset):
        """Acción para activar usuarios seleccionados"""
        updated = queryset.update(estado='activo')
        self.message_user(request, f'{updated} usuarios activados exitosamente.')
    activate_users.short_description = "Activar usuarios seleccionados"
    
    def deactivate_users(self, request, queryset):
        """Acción para desactivar usuarios seleccionados"""
        updated = queryset.update(estado='inactivo')
        self.message_user(request, f'{updated} usuarios desactivados exitosamente.')
    deactivate_users.short_description = "Desactivar usuarios seleccionados"
    
    def make_admin(self, request, queryset):
        """Acción para hacer administradores a usuarios seleccionados"""
        updated = queryset.update(rol='admin', estado='activo')
        self.message_user(request, f'{updated} usuarios promovidos a administradores.')
    make_admin.short_description = "Promover a administradores"
    
    def remove_admin(self, request, queryset):
        """Acción para quitar privilegios de administrador"""
        updated = queryset.update(rol='usuario')
        self.message_user(request, f'{updated} usuarios ya no son administradores.')
    remove_admin.short_description = "Quitar privilegios de administrador"
