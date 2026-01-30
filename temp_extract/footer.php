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
        <p>&copy; <?php echo date('Y'); ?> Despierta tu Voz. Todos los derechos reservados. | <a
                href="<?php echo esc_url(home_url('/politica-privacidad')); ?>"
                style="color: inherit; text-decoration: underline;">Política de Privacidad</a></p>
        <p class="footer-tagline">El viaje hacia tu propia voz comienza en el silencio del alma.</p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>

</html>