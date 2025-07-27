// static/js/main.js

// Toggle menu for mobile
document.addEventListener('DOMContentLoaded', () => {
    // Menú móvil
    const navbarBurgers = document.querySelectorAll('.navbar-burger');
    
    if (navbarBurgers.length > 0) {
        navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.target;
                const targetMenu = document.getElementById(target);
                
                el.classList.toggle('is-active');
                targetMenu.classList.toggle('is-active');
            });
        });
    }
    
    // Toggle de tema oscuro/claro
    const themeToggle = document.getElementById('theme-toggle');
    
    // Verificar tema almacenado
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Alternar tema al hacer clic
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
    
    // Opcional: Agregar funcionalidad adicional aquí
    console.log('JavaScript cargado correctamente');
});