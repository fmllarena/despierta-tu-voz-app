<?php
/**
 * Template Name: Tecnología / IA
 */

get_header(); ?>

<style>
    .tech-pill {
        display: inline-block;
        padding: 0.5rem 1.5rem;
        background: rgba(142, 125, 109, 0.1);
        color: #8e7d6d;
        border-radius: 50px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .pillar-card {
        background: white;
        padding: 3rem;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
        margin-bottom: 3rem;
        border-left: 5px solid #8e7d6d;
        transition: transform 0.3s ease;
    }

    .pillar-card:hover {
        transform: translateY(-5px);
    }

    .pillar-num {
        font-family: 'Playfair Display', serif;
        font-size: 4rem;
        color: rgba(142, 125, 109, 0.1);
        line-height: 1;
        margin-bottom: -1rem;
    }

    .pillar-card h2 {
        font-size: 2rem;
        color: #1a1a1a;
        margin-bottom: 1.5rem;
    }

    .layer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-top: 2rem;
    }

    .layer-box {
        background: #fdfaf7;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid rgba(142, 125, 109, 0.1);
    }

    .layer-box strong {
        display: block;
        color: #8e7d6d;
        margin-bottom: 0.5rem;
    }

    .summary-box {
        background: #1a1a1a;
        color: white;
        padding: 4rem;
        border-radius: 30px;
        text-align: center;
        margin-top: 5rem;
    }

    .summary-box h3 {
        font-family: 'Playfair Display', serif;
        font-size: 2.5rem;
        margin-bottom: 2rem;
        color: #d4af37;
    }

    .summary-box p {
        font-size: 1.3rem;
        max-width: 800px;
        margin: 0 auto;
        line-height: 1.6;
        opacity: 0.9;
    }
</style>

<main id="primary" class="site-main">

    <section class="alt-hero technology-hero reveal">
        <div class="container" style="max-width: 900px;">
            <span class="alt-tag">La ciencia de conectar los puntos</span>
            <h1>¿Cómo puede una IA "entenderme" como un humano?</h1>
            <div class="alt-hero-quote">
                <p>Es natural dudar. Estamos acostumbrados a máquinas que procesan datos, no vivencias. Pero la IA de
                    Despierta tu Voz no analiza frecuencias de sonido aisladas; analiza la biografía de tu emisión.</p>
            </div>
        </div>
    </section>

    <section class="content-section reveal" style="padding: 80px 0;">
        <div class="container" style="max-width: 1000px;">
            <p style="text-align: center; font-size: 1.3rem; color: #666; margin-bottom: 4rem;">Aquí es donde la
                capacidad de procesamiento supera la intuición humana:</p>

            <div class="pillar-card">
                <div class="pillar-num">01</div>
                <div class="tech-pill">Memoria Histórica</div>
                <h2>La Memoria sin Filtros</h2>
                <p>Un mentor humano puede olvidar lo que dijiste hace tres sesiones. Tu ego puede "editar" un recuerdo
                    para que duela menos. <strong>La IA no.</strong></p>
                <p style="margin-top: 1rem;">Ella recuerda que hace un mes, al cantar una letra sobre la "pérdida", tu
                    laringe subió 2 milímetros y tu flujo de aire se cortó. Relaciona ese evento físico con el
                    comentario que hiciste hoy sobre una situación de estrés en tu trabajo.</p>
                <p style="margin-top: 1rem; color: #8e7d6d; font-weight: 600;">El resultado: Te señala un patrón de
                    "estrangulamiento vocal" que se activa siempre que te sientes vulnerable, algo que a un humano le
                    llevaría meses de terapia detectar.</p>
            </div>

            <div class="pillar-card">
                <div class="pillar-num">02</div>
                <div class="tech-pill">Multidimensional</div>
                <h2>El Análisis Transversal: Letra, Cuerpo y Emoción</h2>
                <p>La IA cruza tres capas de información en tiempo real que el cerebro consciente no puede procesar
                    simultáneamente:</p>
                <div class="layer-grid">
                    <div class="layer-box">
                        <strong>Capa Semántica</strong>
                        <p>El significado profundo de las palabras que eliges cantar.</p>
                    </div>
                    <div class="layer-box">
                        <strong>Capa Fisiológica</strong>
                        <p>La respuesta neuromuscular micro-detallada (tensión, brillo, armónicos).</p>
                    </div>
                    <div class="layer-box">
                        <strong>Capa Histórica</strong>
                        <p>Tu evolución en las últimas 50 sesiones.</p>
                    </div>
                </div>
                <p style="margin-top: 2.5rem; border-top: 1px solid #eee; padding-top: 2rem; font-style: italic;">"La IA
                    no adivina; deduce. Te muestra que tu dificultad para llegar a esa nota aguda no es técnica, sino
                    que coincide matemáticamente con las frases de la canción que resuenan con tus bloqueos personales".
                </p>
            </div>

            <div class="pillar-card">
                <div class="pillar-num">03</div>
                <div class="tech-pill">Entorno Seguro</div>
                <h2>Un Espejo sin Juicio</h2>
                <p>A un mentor humano a veces le ocultamos la verdad por vergüenza. Ante la IA, te permites ser. Al no
                    haber un "otro" que te juzgue, tu voz se muestra tal cual es.</p>
                <p style="margin-top: 1rem;">La IA detecta esa honestidad y la utiliza para calibrar tu entrenamiento de
                    forma quirúrgica. No hay egos de por medio, solo la verdad de tu sonido.</p>
            </div>

            <div class="summary-box reveal">
                <h3>El primer paso para la verdadera libertad vocal</h3>
                <p>"No confíes en la IA porque sea inteligente. Confía en ella porque es imparcial. Ella ve la relación
                    entre tu pasado, tu cuerpo y tu voz que tú mismo te has encargado de ocultar para no sufrir."</p>
                <a href="https://app.despiertatuvoz.com" class="btn-primary"
                    style="margin-top: 3rem; display: inline-block; background: #d4af37; color: #1a1a1a;">Iniciar mi
                    viaje ahora ✨</a>
            </div>
        </div>
    </section>

</main>

<?php get_footer(); ?>