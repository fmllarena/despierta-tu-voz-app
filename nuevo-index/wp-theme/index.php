<?php
/**
 * The main template file (Blog Wall)
 */
get_header(); ?>

<section class="alt-hero blog-hero reveal">
    <div class="container">
        <span class="alt-tag">Bitácora de la Voz</span>
        <h1>Artículos para profundizar en tu viaje</h1>
        <div class="alt-hero-quote">
            <p>Cada artículo es una semilla para tu próxima conversación con el Mentor IA. Explora la
                biodecodificación vocal, la gestión emocional y el arte de cantar desde el ser.</p>
        </div>
    </div>
</section>

<div class="container">
    <!-- Filtro de Categorías Dinámico -->
    <div class="category-filter reveal">
        <a href="<?php echo get_post_type_archive_link('post'); ?>"
            class="category-tag <?php echo !is_category() ? 'active' : ''; ?>">Todos</a>
        <?php
        $categories = get_categories();
        foreach ($categories as $category) {
            $active_class = (is_category($category->term_id)) ? 'active' : '';
            echo '<a href="' . get_category_link($category->term_id) . '" class="category-tag ' . $active_class . '">' . $category->name . '</a>';
        }
        ?>
    </div>

    <section class="grid-container blog-grid-section">
        <?php if (have_posts()):
            while (have_posts()):
                the_post(); ?>

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
                        <h3><?php the_title(); ?></h3>
                        <p><?php echo wp_trim_words(get_the_excerpt(), 20); ?></p>
                        <a href="<?php the_permalink(); ?>" class="read-more">Leer artículo <span>→</span></a>
                    </div>
                </article>

            <?php endwhile; else: ?>
            <p><?php _e('No hay artículos publicados todavía.', 'dtv-theme'); ?></p>
        <?php endif; ?>
    </section>

    <!-- Paginación -->
    <div class="pagination reveal" style="text-align: center; margin-bottom: 80px;">
        <?php the_posts_pagination(array(
            'mid_size' => 2,
            'prev_text' => '← Anterior',
            'next_text' => 'Siguiente →',
        )); ?>
    </div>
</div>

<?php get_footer(); ?>