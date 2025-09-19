// static/js/main.js

// Toggle menu for mobile
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu
  document.querySelectorAll('.navbar-burger').forEach(el => {
    el.onclick = () => {
      const target = document.getElementById(el.dataset.target);
      el.classList.toggle('is-active');
      target.classList.toggle('is-active');
    };
  });

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  themeToggle.onclick = () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggle.innerHTML = `<i class="fas fa-${isLight ? 'sun' : 'moon'}"></i>`;
  };

  // Volunteer filters
  const filtros = document.querySelectorAll('#filtros-voluntariados li');
  const voluntariados = document.querySelectorAll('#contenedor-voluntariados .column');
  filtros.forEach(filtro => {
    filtro.onclick = () => {
      filtros.forEach(f => f.classList.remove('is-active'));
      filtro.classList.add('is-active');
      const categoria = filtro.dataset.categoria;
      voluntariados.forEach(v => {
        v.style.display = (categoria === 'todos' || v.dataset.categorias.includes(categoria)) ? 'block' : 'none';
        v.style.opacity = '0';
        setTimeout(() => v.style.opacity = '1', 100);
      });
    };
  });

  // Accordion
  document.querySelectorAll('.accordion').forEach(acc => {
    const header = acc.querySelector('.accordion-header');
    const content = acc.querySelector('.accordion-content');
    const icon = header.querySelector('.icon i');
    header.onclick = () => {
      const open = content.classList.toggle('is-open');
      icon.classList.toggle('fa-chevron-up', open);
      icon.classList.toggle('fa-chevron-down', !open);
    };
  });
});
