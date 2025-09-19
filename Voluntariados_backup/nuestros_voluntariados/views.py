from django.shortcuts import render
from django.urls import reverse  # Importamos reverse para generar URLs

def home(request):
    tags_pumas_verdes = [ 
        {"class": "is-primary", "text": "Medio Ambiente"},
        {"class": "is-link", "text": "Social"},
    ]
    
    tags_sonriendo_juntos = [ 
        {"class": "is-link", "text": "Social"},
    ]
    
    tags_patitas_unah = [ 
        {"class": "is-link", "text": "Social"},
        {"class": "is-warning", "text": "Animales"},
    ]
    
    tags_pumas_unidos = [ 
        {"class": "is-link", "text": "Social"},
    ]
    
    tags_pumas_en_accion = [ 
        {"class": "is-link", "text": "Social"},
        {"class": "is-danger", "text": "Educacion"},
    ]
    
    tags_vtic = [ 
        {"class": "is-info", "text": "Social"},
        {"class": "is-danger", "text": "Educacion"},
    ]
    
    context = {
        "tags_pumas_verdes": tags_pumas_verdes,
        "url_pumas_verdes": reverse('nuestros_voluntariados:pumas_verdes'),
        "tags_sonriendo_juntos": tags_sonriendo_juntos,
        "url_sonriendo_juntos": reverse('nuestros_voluntariados:sonriendo_juntos'),
        "tags_patitas_unah": tags_patitas_unah,
        "url_patitas_unah": reverse('nuestros_voluntariados:patitas_unah'),
        "tags_pumas_unidos": tags_pumas_unidos,
        "url_pumas_unidos": reverse('nuestros_voluntariados:pumas_unidos'),
        "tags_pumas_en_accion": tags_pumas_en_accion,
        "url_pumas_en_accion": reverse('nuestros_voluntariados:pumas_en_accion'),
        "tags_vtic": tags_vtic,
    }
    
    return render(request, 'voluntariados.html', context)

def pumas_verdes(request):
    return render(request, 'pumas_verdes.html')

def patitas_unah(request):
    return render(request, 'patitas.html')

def sonriendo_juntos(request):
    return render(request, 'sonriendo_juntos.html')

def pumas_en_accion(request):
    return render(request, 'pumas_en_accion.html')

def pumas_unidos(request):
    return render(request, 'pumas_unidos.html')