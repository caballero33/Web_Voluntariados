# Crear un projecto

Revisar la instalación:
```shell
python -m django --version
```
Crear un projecto:
```shell
mkdir Voluntariados

django-admin startproject mysite Voluntariados
```

Esto crea la estructura base:
```
Voluntariados/
    manage.py
    voluntariados/
        __init__.py
        settings.py
        urls.py
        asgi.py
        wsgi.py
```

Según la documentación:
- `manage.py` comandos para interactuar con el projecto.
- `voluntariados/` paquete para el projecto.
- `voluntariados/__init__.py` le dice a python que ese es un paquete.
- `voluntariados/settings.py` configuración.
- `voluntariados/urls.py` para las rutas de las URLs.
- `voluntariados/asgi.py` y `voluntariados/msgi.py` son para servicios correspondientes.

# El servidor

Para correr el servidor:
```shell
python manage.py runserver
```
Ejecutará el servidor en: http://127.0.0.1:8000/.

Podemos detener el servidor con `Ctrl + C`.

# Apps

Para crear una app:
```shell
python manage.py startapp home
```

Lo que crea un nuevo directorio:
```
home/
    __init__.py
    admin.py
    apps.py
    migrations/
        __init__.py
    models.py
    tests.py
    views.py
```

Este servirá para la aplicación.

# Vistas

Estas son la páginas. Para crear una primero nos vamos a la aplicación, en vistas (`home/views.py`), donde estará el siguiente código:
```python
from django.shortcuts import render

# Create your views here.
```

Que modificaremos así:

```python
from django.shortcuts import render
from django.http import HttpResponse


def index(request):
    return HttpResponse("Inicio")
```

Esta es la página más básica. Para acceder a ella desde el navegador, debemos de mapearla. Para eso, debemos configurar su URL. Esto se hace en `urls.py` de la aplicación.

Crearemos un archivo `home/urls.py`, y colocaremos:
```python
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="home"),
]
```

Luego, configuramos la URL en `voluntariados/urls.py`, la cual encontraremos con:
```python
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
]
```

Y la modificaremos para dejar:
```python
from django.contrib import admin
from django.urls import include, path   # incluimos el include

urlpatterns = [
    path("home/", include("home.urls")),    # damos la dirección a include()
    path("admin/", admin.site.urls),        # path() necesita la ruta y la vista como argumentos
]
```

Ahora, si corremos el servidor y abrimos: http://127.0.0.1:8000/home, veremos la página.

## Rederizar vistas

También, en lugar de escribir el código `html` directamente, podemos renderizar la página. Primero, creamos una carpeta en la aplicación, llamada `home/templates`, en ella podemos poner las páginas.

En `home/templates` creamos `home/templates/home.html` y escribimos la página.

En `home/views.py` cambiamos lo que teníamos y ponemos:
```python
from django.shortcuts import render

def index(request):
    return render(request, 'home.html')
```

Y en `voluntariados/urls.py`:
```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("", include("home.urls")),
    path("admin/", admin.site.urls),
]
```

Y metemos la aplicación en `INSTALLED_APPS` de `voluntarios/settings.py`:
```python
# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'home'
]
```

# Base de datos 

Por defecto, Django utiliza SQLite. Esta configuración está en los ajustes del sitio (`voluntarios/settings.py`). Ahí también está la `TIME_ZONE` que dejaremos en `UTC`.

Ahora, en la parte de `INSTALLED_APPS`, ya vienen incluidas algunas. Todas estas utilizan tablas de bases de datos, por lo que les crearemos sus tablas con:
```shell
python manage.py migrate
```

# Modelos

Básicamente, diseños de bases de datos, con metadatos adicionales.

> luego veremos esto.