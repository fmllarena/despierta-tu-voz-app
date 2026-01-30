<?php
/**
 * The template for displaying all single posts
 */
get_header(); ?>

<?php while (have_posts()):
    the_post(); ?>

    <article <?php post_class(); ?>>
        <header class="post-header">
            <div class="container">
                <span class="post-meta">
                    <?php the_category(' • '); ?> •
                    <?php echo ceil(str_word_count(get_the_content()) / 200); ?> min lectura
                </span>
                <h1>
                    <?php the_title(); ?>
                </h1>
            </div>
        </header>

        <div class="container">
            <div class="post-content">
                <?php if (has_post_thumbnail()): ?>
                    <div class="featured-image"
                        style="margin-bottom: 40px; border-radius: 15px; overflow: hidden; max-height: 450px; display: flex; justify-content: center; background: #eee;">
                        <?php the_post_thumbnail('large', ['style' => 'width: 100%; height: 100%; object-fit: cover;']); ?>
                    </div>
                <?php endif; ?>

                <?php the_content(); ?>

                <!-- AI MENTOR CTA BLOCK -->
                <?php
                $post_title = get_the_title();
                $categories = get_the_category();
                $first_cat = !empty($categories) ? $categories[0]->name : '';
                $app_url = "https://app.despiertatuvoz.com";
                // Construir link con parámetros para que la App los reciba
                $context_url = add_query_arg([
                    'from_post' => urlencode($post_title),
                    'cat' => urlencode($first_cat)
                ], $app_url);
                ?>
                <div class="ai-cta-block">
                    <h4>¿Te ha resonado este artículo?</h4>
                    <p>Cuéntaselo a tu Mentor en la App. Él conoce este contenido y puede ayudarte a aplicar estos conceptos
                        a tu propia historia hoy mismo.</p>
                    <a href="<?php echo esc_url($context_url); ?>" class="btn-lg">Abrir mi sesión en la App ✨</a>
                </div>

                <div class="back-to-blog">
                    <a href="<?php echo get_post_type_archive_link('post'); ?>">← Volver al Blog</a>
                </div>
            </div>
        </div>
    </article>

    <section class="related-posts" style="padding: 80px 0; background: var(--color-bg-light);">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 50px; color: var(--color-brown);">Más artículos para tu viaje</h2>
            <div class="grid-container"
                style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                <?php
                $current_post_id = get_the_ID();
                $recent_posts = new WP_Query(array(
                    'posts_per_page' => 3,
                    'post__not_in' => array($current_post_id),
                    'post_status' => 'publish'
                ));

                if ($recent_posts->have_posts()):
                    while ($recent_posts->have_posts()):
                        $recent_posts->the_post(); ?>
                        <article class="base-card blog-card">
                            <div class="blog-card-img">
                                <?php if (has_post_thumbnail()): ?>
                                    <?php the_post_thumbnail('medium'); ?>
                                <?php else: ?>
                                    ✨
                                <?php endif; ?>
                            </div>
                            <div class="blog-content-inner">
                                <span class="blog-category">
                                    <?php
                                    $category = get_the_category();
                                    if (!empty($category)) {
                                        echo esc_html($category[0]->name);
                                    }
                                    ?>
                                </span>
                                <h3 style="font-size: 1.2rem; margin: 10px 0;"><?php the_title(); ?></h3>
                                <a href="<?php the_permalink(); ?>" class="read-more">Leer más <span>→</span></a>
                            </div>
                        </article>
                    <?php endwhile;
                    wp_reset_postdata();
                else: ?>
                    <p style="text-align: center;">No hay más artículos todavía.</p>
                <?php endif; ?>
            </div>
        </div>
    </section>

<?php endwhile; ?>

<?php get_footer(); ?>