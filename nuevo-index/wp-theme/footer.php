<footer>
    <div class="footer-content">
        <nav class="footer-nav">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'footer',
                'container' => false,
                'fallback_cb' => false,
                'items_wrap' => '<ul>%3$s</ul>'
            ));
            ?>
        </nav>
        <p>&copy; <?php echo date('Y'); ?> Despierta tu Voz. Todos los derechos reservados. |
            <a href="<?php echo esc_url(home_url('/politica-privacidad')); ?>"
                style="color: inherit; text-decoration: underline;">Privacidad</a> |
            <a href="<?php echo esc_url(home_url('/terminos-y-condiciones')); ?>"
                style="color: inherit; text-decoration: underline;">Términos</a> |
            <a href="<?php echo esc_url(home_url('/eliminacion-de-datos')); ?>"
                style="color: inherit; text-decoration: underline;">Eliminación de Datos</a>
        </p>
        <p class="footer-tagline">El viaje hacia tu propia voz comienza en el silencio del alma.</p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>

</html>