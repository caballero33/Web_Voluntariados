Actualmente la estructura se maneja de la siguiente manera:
```
Diagrama.md                         <- Aquí está usted

README.md                           <- Información general

Voluntariados/                      <- Carpeta raíz del proyecto
 │
 ├── manage.py                      <- Script principal de gestión del proyecto
 │
 ├─── voluntariados/                <- Carpeta del proyecto Django 
 │    ├── __init__.py
 │    ├── asgi.py
 │    ├── settings.py               <- Configuraciones del proyecto
 │    ├── urls.py                   <- Rutas principales
 │    └── wsgi.py
 │
 ├─── home/                         <- Página principal y otras vinculadas
 │    ├── __init__.py
 │    ├── admin.py
 │    ├── apps.py
 │    ├── migrations/
 │    │   └── __init__.py
 │    ├── models.py
 │    ├── tests.py
 │    ├── views.py
 │    ├── urls.py                   <- Rutas de la app
 │    ├── templates/                <- Plantillas HTML
 │    │    ├── base.html            <- Plantilla general
 |    |    ├── home.html            <- Página principal
 |    |    ├── reglamento.html      <- Reglamento
 |    |    └── voluntariados.html   <- Página con todos los voluntariados
 │    └── static/                   <- Archivos estáticos (css, js, imágenes)
 │         ├── css/                 <- Carpeta con el archivo css
 |         └── js/                  <- Carpeta con el archivo js
 |
 └── db.sqlite3
```