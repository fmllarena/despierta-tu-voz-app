<footer>
    <div class="footer-content">
        <nav class="footer-nav">
            <ul>
                <li><a href="<?php echo esc_url(home_url('/#soluciones')); ?>">Método</a></li>
                <li><a href="<?php echo esc_url(home_url('/tecnologia')); ?>">Tecnología</a></li>
                <li><a href="<?php echo esc_url(home_url('/#fundador')); ?>">Mentor</a></li>
                <li><a href="<?php echo esc_url(home_url('/#proceso')); ?>">Recorrido</a></li>
                <li><a href="<?php echo esc_url(home_url('/somos')); ?>">Somos</a></li>
                <li><a href="<?php echo esc_url(home_url('/hablemos')); ?>">Contacto</a></li>
            </ul>
        </nav>
        <p>&copy; <?php echo date('Y'); ?> Despierta tu Voz. Todos los derechos reservados. |
            <a href="<?php echo esc_url(home_url('/politica-de-cookies')); ?>"
                style="color: inherit; text-decoration: underline;">Cookies</a> |
            <a href="<?php echo esc_url(home_url('/politica-privacidad')); ?>"
                style="color: inherit; text-decoration: underline;">Privacidad</a> |
            <a href="<?php echo esc_url(home_url('/terminos-y-condiciones')); ?>"
                style="color: inherit; text-decoration: underline;">Términos</a> |
            <a href="<?php echo esc_url(home_url('/eliminacion-de-datos')); ?>"
                style="color: inherit; text-decoration: underline;">Eliminación de Datos</a>
        </p>
        <p class="footer-tagline">El viaje hacia tu propia voz comienza en el silencio del alma.</p>
        <div class="footer-disclaimer"
            style="font-size: 0.75rem; opacity: 0.6; max-width: 900px; margin: 25px auto 0; line-height: 1.4; text-align: center;">
            <strong>Aviso Legal y de Salud:</strong> Despierta tu Voz es una plataforma de entrenamiento vocal holístico
            y bienestar emocional. El Mentor IA provee acompañamiento basado en inteligencia artificial y no sustituye
            el diagnóstico o consejo de un médico, foniatra, logopeda o profesional de la salud mental. Si experimentas
            dolor vocal persistente o atraviesas una crisis de salud mental, busca atención profesional cualificada.
        </div>
    </div>
</footer>

<!-- Schema Markup (SEO) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Despierta tu Voz",
  "image": "<?php echo get_template_directory_uri(); ?>/assets/hero-v2.png",
  "description": "Acompañamiento holístico para liberar tu voz con técnica vocal e IA.",
  "url": "<?php echo esc_url(home_url('/')); ?>",
  "founder": {
    "@type": "Person",
    "name": "Fernando Martínez Llarena"
  },
  "serviceType": ["Mentoría Vocal", "Biodecodificación Vocal", "IA Mentor Vocal"]
}
</script>

<?php wp_footer(); ?>
</body>

</html>