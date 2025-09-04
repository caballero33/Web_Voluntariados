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
    
    // Funcionalidad de filtros de voluntariados
    const filtros = document.querySelectorAll('#filtros-voluntariados li');
    if (filtros.length > 0) {
        const voluntariados = document.querySelectorAll('#contenedor-voluntariados .column');
        
        filtros.forEach(filtro => {
            filtro.addEventListener('click', () => {
                // Actualizar clase activa en los filtros
                filtros.forEach(f => f.classList.remove('is-active'));
                filtro.classList.add('is-active');
                
                const categoria = filtro.getAttribute('data-categoria');
                
                // Filtrar voluntariados
                voluntariados.forEach(voluntariado => {
                    if (categoria === 'todos') {
                        voluntariado.style.display = 'block';
                    } else {
                        const categoriasVoluntariado = voluntariado.getAttribute('data-categorias').split(' ');
                        if (categoriasVoluntariado.includes(categoria)) {
                            voluntariado.style.display = 'block';
                        } else {
                            voluntariado.style.display = 'none';
                        }
                    }
                    
                    // Animación de aparición
                    voluntariado.style.opacity = '0';
                    setTimeout(() => {
                        voluntariado.style.opacity = '1';
                    }, 100);
                });
            });
        });
    };

    // Funcionalidad del acordeón con animación
    const acordeones = document.querySelectorAll('.accordion');
    acordeones.forEach(acordeon => {
        const header = acordeon.querySelector('.accordion-header');
        const content = acordeon.querySelector('.accordion-content');
        const icon = header.querySelector('.icon i');
        content.style.transition = 'max-height 0.3s ease, opacity 0.3s';
        content.style.overflow = 'hidden';
        content.style.maxHeight = '0';
        content.style.opacity = '0';
        header.addEventListener('click', () => {
            if (content.classList.contains('is-open')) {
                content.classList.remove('is-open');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
                content.style.maxHeight = '0';
                content.style.opacity = '0';
            } else {
                content.classList.add('is-open');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
            }
        });
    });
});
