<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="<?php echo get_template_directory_uri(); ?>/assets/favicon.ico">

    <!-- SEO Dinámico -->
    <?php
    $seo_description = "Acompañamiento holístico para liberar tu voz. Técnica vocal, conciencia emocional y mentoría con IA 24/7.";
    if (is_page_template('page-contacto.php') || is_page('hablemos')) {
        $seo_description = "¿Quieres saber más sobre la App o las Mentorías? Hablemos de tu voz.";
    } elseif (is_page_template('page-somos.php')) {
        $seo_description = "Conoce a Fernando Martínez Llarena y la visión detrás de Despierta tu Voz.";
    }
    $page_title = wp_title('|', false, 'right');
    if (empty($page_title))
        $page_title = get_bloginfo('name');
    ?>
    <meta name="description" content="<?php echo esc_attr($seo_description); ?>">

    <!-- Open Graph (Social Media) -->
    <meta property="og:title" content="<?php echo esc_attr($page_title); ?>">
    <meta property="og:description" content="<?php echo esc_attr($seo_description); ?>">
    <meta property="og:image" content="<?php echo get_template_directory_uri(); ?>/assets/hero-v2.png">
    <meta property="og:type" content="website">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo esc_attr($page_title); ?>">
    <meta name="twitter:description" content="<?php echo esc_attr($seo_description); ?>">
    <meta name="twitter:image" content="<?php echo get_template_directory_uri(); ?>/assets/hero-v2.png">

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
            <ul>
                <li><a href="<?php echo esc_url(home_url('/#soluciones')); ?>">Método</a></li>
                <li><a href="<?php echo esc_url(home_url('/tecnologia')); ?>">Tecnología</a></li>
                <li><a href="<?php echo esc_url(home_url('/#fundador')); ?>">Mentor</a></li>
                <li><a href="<?php echo esc_url(home_url('/#proceso')); ?>">Recorrido</a></li>
                <li><a href="<?php echo esc_url(home_url('/somos')); ?>">Somos</a></li>
                <li><a href="<?php echo esc_url(home_url('/blog')); ?>">Blog</a></li>
                <li><a href="<?php echo esc_url(home_url('/hablemos')); ?>">Contacto</a></li>
            </ul>
        </nav>
    </header>