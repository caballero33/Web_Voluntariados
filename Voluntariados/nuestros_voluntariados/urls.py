from django.urls import path

from . import views

app_name = "nuestros_voluntariados"  # <-- Add this line

urlpatterns = [
    path("home/", views.home, name="home"),
    path("pumas_verdes/", views.pumas_verdes, name="pumas_verdes"),
    path("patitas_unah/", views.patitas_unah, name="patitas_unah"),
    path("sonriendo_juntos/", views.sonriendo_juntos, name="sonriendo_juntos"),
]