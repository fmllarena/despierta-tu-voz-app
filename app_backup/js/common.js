// Common animations for Despierta tu Voz landing pages
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Special behavior for hero
                if (entry.target.classList.contains('hero')) {
                    const wave = document.querySelector('.voice-wave-svg');
                    if (wave) {
                        wave.style.animation = 'none';
                        wave.offsetHeight; // trigger reflow
                        wave.style.animation = null;
                    }
                }
            }
        });
    }, observerOptions);

    // Mobile Menu Toggle - Refined
    const menuToggle = document.querySelector('.menu-toggle');
    const mainHeader = document.querySelector('header');

    if (menuToggle && mainHeader) {
        menuToggle.addEventListener('click', function (e) {
            e.preventDefault();
            mainHeader.classList.toggle('menu-active');

            const isOpen = mainHeader.classList.contains('menu-active');
            document.body.style.overflow = isOpen ? 'hidden' : '';

            console.log('Menu status:', isOpen ? 'Open' : 'Closed');
        });

        // Close menu when clicking a link
        const menuLinks = mainHeader.querySelectorAll('nav a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainHeader.classList.remove('menu-active');
                document.body.style.overflow = '';
            });
        });
    }

    document.querySelectorAll('.reveal, .hero').forEach(el => observer.observe(el));
});
