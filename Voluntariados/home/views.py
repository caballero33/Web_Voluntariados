from django.shortcuts import render
from django.urls import reverse

def home(request):
    context = {
        "url_pumas_verdes": reverse('nuestros_voluntariados:pumas_verdes'),
        "url_sonriendo_juntos": reverse('nuestros_voluntariados:sonriendo_juntos'),
        "url_patitas_unah": reverse('nuestros_voluntariados:patitas_unah'),
    }

    return render(request, 'home.html', context)

def reglamento(request):
    return render(request, 'reglamento.html')

def voluntariados(request):
    return render(request, 'voluntariados.html')

def errores(request):
    return render(request, 'errores.html')