# Sistema de Voluntariados UNAH

Sistema web para la gestión de voluntariados universitarios.

## Instalación

1. Instalar dependencias:
```bash
pip install -r requirements.txt
```

2. Configurar variables de entorno:
- `FIREBASE_CREDENTIALS_PATH`: Ruta al archivo de credenciales de Firebase
- `SECRET_KEY`: Clave secreta de Django
- `DEBUG`: False para producción

3. Ejecutar migraciones:
```bash
python manage.py migrate
```

4. Crear superusuario:
```bash
python manage.py createsuperuser
```

5. Ejecutar servidor:
```bash
python manage.py runserver
```

## Estructura

- `auth_firebase/`: Autenticación y gestión de usuarios
- `home/`: Página principal
- `nuestros_voluntariados/`: Páginas de voluntariados específicos
- `static/`: Archivos estáticos (CSS, JS)
- `templates/`: Plantillas HTML

## Tecnologías

- Django 5.2.4
- Firebase Authentication
- Firebase Firestore
- Bulma CSS
- JavaScript vanilla
