from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("reglamento/", views.reglamento, name="reglamento"),
    path("errores/", views.errores, name="errores"),
]