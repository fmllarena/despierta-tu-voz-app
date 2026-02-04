<?php
/**
 * Despierta tu Voz Theme Functions
 */

function dtv_theme_assets()
{
    // 1. Google Fonts
    wp_enqueue_style('dtv-fonts', 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:wght@700&display=swap', array(), null);

    // 2. Main CSS
    wp_enqueue_style('dtv-main-style', get_template_directory_uri() . '/css/landing-v2.css', array('dtv-fonts'), '1.3.0');

    // 3. Theme's style.css
    wp_enqueue_style('dtv-theme-overrides', get_stylesheet_uri(), array('dtv-main-style'), '1.3.0');

    // 4. Common JS
    wp_enqueue_script('dtv-common-js', get_template_directory_uri() . '/js/common.js', array(), '1.3.0', true);

    // 5. AI Support JS
    wp_enqueue_script('dtv-ai-support', get_template_directory_uri() . '/js/ai-support.js', array(), '1.2.2', true);
}
add_action('wp_enqueue_scripts', 'dtv_theme_assets');

// Theme Support
function dtv_theme_setup()
{
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
    register_nav_menus(array(
        'primary' => 'Menú Principal',
        'footer' => 'Menú Pie de Página'
    ));
}
add_action('after_setup_theme', 'dtv_theme_setup');
/**
 * Filtro Quirúrgico: Limpiar posts antiguos de Elementor
 * Extrae solo la columna de contenido principal y descose el resto (menús, footers, sidebars).
 */
function dtv_clean_elementor_content($content)
{
    // Solo actuamos en posts individuales de WordPress
    if (!is_single())
        return $content;

    // Si no hay rastro de Elementor, devolvemos el contenido tal cual
    if (strpos($content, 'elementor-element') === false)
        return $content;

    // 1. Usamos DOMDocument para analizar el HTML de forma segura
    $dom = new DOMDocument();
    // Libxml_use_internal_errors evita que salgan warnings por HTML5 no estándar
    libxml_use_internal_errors(true);
    // Cargamos el contenido con soporte para UTF-8
    $dom->loadHTML('<?xml encoding="UTF-8">' . $content);
    $xpath = new DOMXPath($dom);

    // 2. Buscamos la "Columna Derecha" (Contenido Real) identificada en el escaneo
    // El selector detectado fue .elementor-element-74cb8eb1
    $nodes = $xpath->query("//*[contains(@class, 'elementor-element-74cb8eb1')]");

    if ($nodes->length > 0) {
        $clean_html = "";
        foreach ($nodes as $node) {
            // 2b. Limpieza quirúrgica de sub-secciones internas (Related Posts, etc)
            // Buscamos elementos internos que no queremos (ej: data-id="9aeae60")
            $internal_xpath = new DOMXPath($dom);
            $unwanted = $xpath->query(".//*[contains(@data-id, '9aeae60')]", $node);
            foreach ($unwanted as $unwanted_node) {
                $unwanted_node->parentNode->removeChild($unwanted_node);
            }

            $clean_html .= $dom->saveHTML($node);
        }

        // --- LIMPIEZA FINAL DE ESTILOS ---
        // 1. Quitamos clases de columnas fijas (ej: elementor-col-50) para que ocupe el 100%
        $clean_html = preg_replace('/elementor-col-[0-9]{2}/', '', $clean_html);

        // 2. Quitamos estilos en línea de ancho, padding y margin que desvían el texto
        $clean_html = preg_replace('/style="[^"]*(width|padding|margin)[^"]*"/', '', $clean_html);

        // 3. Quitamos el gap por defecto de Elementor si existe
        $clean_html = str_replace('elementor-column-gap-default', '', $clean_html);

        return $clean_html;
    }

    // Si no encontramos esa columna específica, intentamos un plan B:
    // Buscar la sección que suele contener el cuerpo del artículo
    $fallback_nodes = $xpath->query("//*[contains(@class, 'elementor-widget-theme-post-content')]");
    if ($fallback_nodes->length > 0) {
        return $dom->saveHTML($fallback_nodes->item(0));
    }

    return $content;
}
add_filter('the_content', 'dtv_clean_elementor_content', 20);

/**
 * BIBLIOTECA IA: Exportar catálogo de artículos a JSON
 * Esto permite que la App de Alquimia Vocal conozca tus artículos y los recomiende.
 */
function dtv_export_blog_library()
{
    $args = array(
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => -1,
    );
    $query = new WP_Query($args);
    $library = array();

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            // Extraer categorías
            $categories = get_the_category();
            $cat_names = array();
            foreach ($categories as $category) {
                $cat_names[] = $category->name;
            }

            $library[] = array(
                'title' => get_the_title(),
                'url' => get_permalink(),
                'cat' => $cat_names,
                'excerpt' => get_the_excerpt()
            );
        }
        wp_reset_postdata();
    }

    // Guardar el archivo JSON en la carpeta del tema
    $json_data = json_encode($library, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $file_path = get_template_directory() . '/biblioteca-blog.json';

    file_put_contents($file_path, $json_data);
}

// Disparar la exportación al guardar un post
add_action('save_post', 'dtv_export_blog_library');
add_action('publish_post', 'dtv_export_blog_library');

// Comando manual por URL: ?export_library=1 (solo admin)
add_action('init', function () {
    if (isset($_GET['export_library']) && current_user_can('manage_options')) {
        dtv_export_blog_library();
        echo "Biblioteca exportada con éxito en la carpeta del tema.";
        exit;
    }
});

/**
 * CIERRE TOTAL DE COMENTARIOS Y PROTECCIÓN ANTISPAM
 * Desactiva el motor de comentarios de WordPress para evitar spam en posts antiguos.
 */

// 1. Cerrar comentarios en el front-end
add_filter('comments_open', '__return_false', 20, 2);
add_filter('pings_open', '__return_false', 20, 2);

// 2. Ocultar comentarios existentes
add_filter('comments_array', '__return_empty_array', 10, 2);

// 3. Eliminar soporte de comentarios en tipos de post
add_action('admin_init', function () {
    $post_types = get_post_types();
    foreach ($post_types as $post_type) {
        if (post_type_supports($post_type, 'comments')) {
            remove_post_type_support($post_type, 'comments');
            remove_post_type_support($post_type, 'trackbacks');
        }
    }
});

// 4. Bloquear acceso directo a wp-comments-post.php
add_action('init', function () {
    if (strpos($_SERVER['REQUEST_URI'], 'wp-comments-post.php') !== false) {
        wp_die('Los comentarios están desactivados en este sitio.', 'Comentarios Cerrados', array('response' => 403));
    }
});

// 5. Eliminar del menú de administración
add_action('admin_menu', function () {
    remove_menu_page('edit-comments.php');
});

// 6. Eliminar de la barra superior
add_action('wp_before_admin_bar_render', function () {
    global $wp_admin_bar;
    $wp_admin_bar->remove_menu('comments');
});

// 7. Desactivar comentarios en la REST API
add_filter('rest_endpoints', function ($endpoints) {
    if (isset($endpoints['/wp/v2/comments'])) {
        unset($endpoints['/wp/v2/comments']);
    }
    if (isset($endpoints['/wp/v2/comments/(?P<id>[\d]+)'])) {
        unset($endpoints['/wp/v2/comments/(?P<id>[\d]+)']);
    }
    return $endpoints;
});

