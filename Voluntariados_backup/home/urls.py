from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("reglamento/", views.reglamento, name="reglamento"),
    path("errores/", views.errores, name="errores"),
    path("unirse/", views.unirse, name="unirse"),
    path("eventos/", views.eventos, name="eventos"),
]