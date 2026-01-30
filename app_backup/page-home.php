<?php
/* Template Name: Home Page */
get_header(); ?>

<section class="hero">
    <div class="hero-decor">
        <div class="voice-wave-container">
            <svg class="voice-wave-svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
                <path fill="none" stroke="white" stroke-width="1.5"
                    d="M0,50 Q10,50 20,50 T40,50 T60,50 T80,50 T100,50 T120,50 T140,50 T160,50 T180,50 T200,50 T220,50 T240,50 T260,50 T280,50 T300,50 T320,50 T340,50 T360,50 T380,50 T400,50 T420,50 T440,50 T460,50 T480,50 T500,50 T520,50 T540,50 T560,50 T580,50 T600,50 T620,50 T640,50 T660,20 T680,80 T700,10 T720,90 T740,10 T760,80 T780,20 T800,50 T820,50 T840,50 T860,50 T880,50 T900,50 T920,50 T940,50 T960,50 T980,50 T1000,50 T1020,50 T1040,50 T1060,50 T1080,50 T1100,50 T1120,50 T1140,50 T1160,50 T1180,50 T1200,50 T1220,50 T1240,50 T1260,50 T1280,50 T1300,50 T1320,50 T1340,50 T1360,50 T1380,50 T1400,50 T1420,50 T1440,50"
                    opacity="0.6" />
            </svg>
        </div>
    </div>

    <div class="hero-content reveal">
        <h1>Tu voz es el espejo de tu alma.<br>Libérala hoy mismo.</h1>
        <p>Descubre el acompañamiento holístico que integra técnica vocal, conciencia emocional y acompañamiento
            continuo con IA 24/7.</p>
        <div class="hero-btns">
            <a href="https://app.despiertatuvoz.com" class="btn-primary">Empieza tu viaje gratis</a>
            <a href="<?php echo esc_url(home_url('/alternativa')); ?>" class="btn-secondary">Saber más sobre
                mentoría</a>
        </div>
    </div>
</section>

<section class="nudo-section reveal">
    <h2>El proceso de transformar tus bloqueos, miedos y herencias en una expresión libre y genuina.</h2>
    <div class="nudo-checklist">
        <div class="nudo-item">
            <span class="checkpoint">✓</span>
            <p>Tu historia personal tratando de ser escuchada es la clave de tu voz.</p>
        </div>
        <div class="nudo-item">
            <span class="checkpoint">✓</span>
            <p>Desarrollo personal y coaching potenciados con una IA con memoria emocional.</p>
        </div>
        <div class="nudo-item">
            <span class="checkpoint">✓</span>
            <p>Transformamos cada bloqueo en el instrumento más potente: tu propia verdad.</p>
        </div>
    </div>
</section>

<section class="services reveal">
    <h2>Tres formas de Despertar tu Voz</h2>
    <div class="grid-container">
        <div class="base-card">
            <div class="card-icon">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/icon-app-v2.png" alt="Icono La App">
            </div>
            <h3>La App (El Viaje Diario)</h3>
            <p>Acompañamiento 24/7 con tu mentor IA, ejercicios personalizados y bitácora de progreso constante.</p>
        </div>
        <div class="base-card">
            <div class="card-icon">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/icon-grupo-v2.png"
                    alt="Icono Mentoría Grupal">
            </div>
            <h3>Mentoría Grupal</h3>
            <div class="badge-upcoming">PRÓXIMAMENTE</div>
            <p>Círculos de voz y apoyo mutuo para crecer junto a otros buscadores en este camino.</p>
        </div>
        <div class="base-card">
            <div class="card-icon">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/icon-premium-v2.png"
                    alt="Icono Mentoría Premium">
            </div>
            <h3>Mentoría Premium 1/1</h3>
            <p>Sesiones individuales directas para un trabajo profundo, íntimo y personalizado.</p>
        </div>
    </div>
</section>

<section class="recorrido reveal">
    <div class="recorrido-container">
        <h2>¿De qué consta el "Recorrido de transformación"?</h2>
        <p class="recorrido-intro">Cuando te adentras en nuestro método, recorres 5 etapas que te llevarán paso a
            paso
            desde el reconocimiento de tu herencia vocal hasta la alquimia final de tu propia voz.</p>
        <div class="recorrido-steps">
            <div class="step-card">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h3>Raíces</h3>
                    <p>¿De quién es la voz que heredas?</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">2</div>
                <div class="step-number-line"></div>
                <div class="step-content">
                    <h3>Roles</h3>
                    <p>¿Hay un personaje que interpretas para gustar a los demás?</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">3</div>
                <div class="step-number-line"></div>
                <div class="step-content">
                    <h3>Cartas</h3>
                    <p>Soltar lo que ya no te pertenece.</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">4</div>
                <div class="step-number-line"></div>
                <div class="step-content">
                    <h3>Patrones</h3>
                    <p>Identificar la sombra para dejarla cantar.</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">5</div>
                <div class="step-number-line"></div>
                <div class="step-content">
                    <h3>Propósito</h3>
                    <p>Cantar desde Tu Altar, tu misión de vida.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="footer-cta reveal">
    <h2>¿Listo para liberar tu verdadera voz?</h2>
    <a href="https://app.despiertatuvoz.com" class="btn-lg">EMPEZAR MI TRANSFORMACIÓN ✨</a>
    <div class="social-links">
        <a href="#">📸</a>
        <a href="#"></a>
        <a href="#">🔗</a>
    </div>
</section>

<?php get_footer(); ?>