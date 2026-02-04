/**
 * Despierta tu Voz - Common JS
 * Manejo de animaciones y funcionalidades básicas
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Animaciones de Reveal al hacer scroll
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Una vez visible, dejamos de observar este elemento
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15, // Se activa cuando el 15% del elemento es visible
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 2. Smooth Scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                // Cerrar menú móvil si está abierto
                const nav = document.querySelector('nav');
                const toggle = document.querySelector('.menu-toggle');
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    toggle.classList.remove('active');
                }

                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3. Menú Móvil Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // 4. Navbar Sticky Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
    });
});
