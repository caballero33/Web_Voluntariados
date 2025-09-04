from django.shortcuts import render

def home(request):
    return render(request, 'home.html')

def reglamento(request):
    return render(request, 'reglamento.html')

def voluntariados(request):
    return render(request, 'voluntariados.html')