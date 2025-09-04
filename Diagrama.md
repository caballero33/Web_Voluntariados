# Estructura Actual del Proyecto Web Voluntariados

Este documento describe la organización de archivos y carpetas del proyecto **Web Voluntariados** según la estructura vigente.

```
Web_Voluntariados/
│
├── Diagrama.md                <- Diagrama y documentación de la estructura (este archivo)
├── README.md                  <- Información general y guía de uso
│
├── Voluntariados/             <- Carpeta raíz del proyecto Django
│   ├── db.sqlite3             <- Base de datos SQLite del proyecto
│   ├── manage.py              <- Script principal para gestionar el proyecto Django
│   │
│   ├── voluntariados/         <- Configuración principal del proyecto Django
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py        <- Configuraciones globales del proyecto
│   │   ├── urls.py            <- Rutas principales del proyecto
│   │   ├── wsgi.py
│   │   └── __pycache__/
│   │
│   ├── home/                  <- Aplicación: página principal y reglamento
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   └── __pycache__/
│   │   ├── templates/
│   │   │   ├── home.html
│   │   │   └── reglamento.html
│   │   └── __pycache__/
│   │
│   ├── nuestros_voluntariados/ <- Aplicación: gestión de voluntariados
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   └── __pycache__/
│   │   ├── templates/
│   │   │   └── voluntariados.html
│   │   └── __pycache__/
│   │
│   ├── static/                 <- Archivos estáticos globales
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       └── main.js
│   │
│   └── templates/              <- Plantillas HTML globales
│       └── base.html
```

## Descripción de Carpetas y Archivos

- **Diagrama.md**: Este archivo. Explica la estructura y propósito de cada carpeta/archivo.
- **README.md**: Información general, instrucciones de instalación y uso.
- **Voluntariados/**: Carpeta raíz del proyecto Django.
  - **db.sqlite3**: Base de datos local.
  - **manage.py**: Utilidad para ejecutar comandos Django.
  - **voluntariados/**: Configuración principal del proyecto.
    - **settings.py**: Configuración de base de datos, apps instaladas, rutas de archivos estáticos, etc.
    - **urls.py**: Rutas principales del proyecto.
  - **home/**: Aplicación para la página principal y reglamento.
    - **models.py**, **views.py**, **urls.py**: Lógica y rutas de la app.
    - **templates/**: Plantillas HTML específicas de la app.
  - **nuestros_voluntariados/**: Aplicación para la gestión de voluntariados.
    - **models.py**, **views.py**, **urls.py**: Lógica y rutas de la app.
    - **templates/**: Plantillas HTML específicas de la app.
  - **static/**: Archivos estáticos globales (CSS, JS).
  - **templates/**: Plantillas HTML globales.

---

**Actualizado:** 04/09/2025  