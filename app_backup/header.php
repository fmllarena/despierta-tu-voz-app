<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php if (is_page_template('page-contacto.php')): ?>
        <meta name="description"
            content="¿Quieres saber más sobre la App o las Mentorías? Hablemos de tu voz. Estamos aquí para acompañarte en tu viaje de transformación vocal y emocional.">
    <?php endif; ?>
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>

    <header>
        <div class="logo">
            <a href="<?php echo esc_url(home_url('/')); ?>" class="logo-link">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/logo-appDTV2.png"
                    alt="Logotipo Despierta tu Voz">
                <span>Despierta tu Voz</span>
            </a>
        </div>
        <div class="header-actions">
            <a href="https://app.despiertatuvoz.com" class="btn-auth">
                <span class="btn-text-desktop">ENTRAR A LA APP</span>
                <span class="btn-text-mobile">APP</span>
            </a>
            <button class="menu-toggle" aria-label="Abrir menú">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
        <nav>
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'container' => false,
                'fallback_cb' => 'wp_page_menu',
                'items_wrap' => '<ul>%3$s</ul>'
            ));
            ?>
        </nav>
    </header>