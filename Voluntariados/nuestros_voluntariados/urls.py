from django.urls import path

from . import views

app_name = "nuestros_voluntariados"  # <-- Add this line

urlpatterns = [
    path("home/", views.index, name="home"),
]