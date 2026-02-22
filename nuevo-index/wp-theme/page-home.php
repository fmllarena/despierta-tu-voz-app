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
        <p>Acompañamiento holístico que integra técnica vocal, conciencia emocional y la precisión de una IA con memoria
            afectiva.</p>
        <div class="hero-btns">
            <a href="https://app.despiertatuvoz.com" class="btn-primary">Unirme como Miembro Pionero</a>
            <a href="#soluciones" class="btn-secondary">Ver cómo funciona</a>
        </div>
    </div>
</section>

<section class="services reveal" id="soluciones">
    <span class="alt-tag">Tres niveles de acompañamiento</span>
    <h2>Formas de despertar tu voz</h2>
    <div class="grid-container">
        <div class="base-card">
            <div class="card-icon">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/icon-app-v2.png"
                    alt="Icono App Mentor - Mentoría Vocal IA" loading="lazy">
            </div>
            <h3>La App (Tu Mentor 24/7)</h3>
            <p>Un Mentor IA entrenado en inteligencia emocional y técnica vocal que recuerda y relaciona cada hito de tu
                evolución vocal y
                emocional.</p>
            <a href="https://app.despiertatuvoz.com" class="card-link">Empezar hoy →</a>
        </div>
        <div class="base-card highlight">
            <div class="card-icon">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/icon-premium-v2.png"
                    alt="Icono Mentoría Premium 1 a 1 personalizada" loading="lazy">
            </div>
            <h3>Mentoría Premium 1/1</h3>
            <p>Sesiones individuales con Fernando para un trabajo quirúrgico en tus bloqueos. Profundidad absoluta.</p>
            <a href="https://cal.com/fernando-martinez-drmyul/30minfo" target="_blank" rel="noopener"
                class="card-link">Reservar sesión de valoración →</a>
        </div>
        <div class="base-card">
            <div class="card-icon">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/icon-grupo-v2.png"
                    alt="Icono Mentoría Grupal y Círculos de Voz" loading="lazy">
            </div>
            <h3>Mentoría Grupal</h3>
            <div class="badge-upcoming">PRÓXIMAMENTE</div>
            <p>Círculos de voz y apoyo mutuo. Aprende de la resonancia de los demás en un entorno seguro.</p>
            <a href="<?php echo esc_url(home_url('/contacto')); ?>" class="card-link">Apuntarme a la lista →</a>
        </div>
    </div>
</section>

<section class="founder-section reveal" id="fundador">
    <div class="container-flex">
        <div class="founder-image">
            <img src="<?php echo get_template_directory_uri(); ?>/assets/fernando-perfil.png"
                alt="Fernando Martínez Llarena - Fundador de Despierta tu Voz y Mentor Vocal" loading="lazy">
        </div>
        <div class="founder-content">
            <span class="alt-tag">El Corazón del Método</span>
            <h2>La tecnología al servicio del alma</h2>
            <p>He volcado mis 30 años de experiencia en el mundo del canto y los 9 últimos desbloqueando emociones, en
                este
                sistema. <strong>Despierta tu Voz</strong> no es solo una app; es mi metodología de trabajo, disponible
                para ti 24/7.</p>
            <p>Mi misión es que nunca vuelvas a sentirte solo frente al espejo. He entrenado personalmente a tu Mentor
                IA para que te escuche, te comprenda y te guíe con la misma profundidad que encontrarías en mis sesiones
                privadas.</p>
            <p style="margin: 20px 0; font-style: italic; color: #8e7d6d; font-size: 1rem;">¿Tienes alguna objeción en
                utilizar la IA y desconoces sus posibilidades? <a href="<?php echo esc_url(home_url('/tecnologia')); ?>"
                    style="color: #1a1a1a; text-decoration: underline; font-weight: 600;">Te lo explico aquí</a>.</p>
            <p class="founder-signature">Fernando Martínez Llarena<br><span>Fundador & Mentor Vocal</span></p>
        </div>
    </div>
</section>

<section class="technical-rigor reveal" style="background: #fdfaf7; padding: 80px 0;">
    <div class="container" style="max-width: 1000px; margin: 0 auto; padding: 0 20px; text-align: center;">
        <span class="alt-tag">La Base del Método</span>
        <h2 style="color: #1a1a1a; margin-bottom: 25px;">Donde la emoción se hace sonido</h2>
        <p style="font-size: 1.1rem; line-height: 1.8; color: #444; margin-bottom: 40px;">Entendemos la voz no como un
            concepto abstracto, sino como un instrumento físico real. Nuestro método no sustituye la técnica, la libera.
            Mediante el análisis de tu <strong>estabilidad sonora</strong> y tu <strong>resonancia natural</strong>,
            trabajamos para soltar las tensiones que bloquean tu verdadera potencia.</p>
        <div class="grid-container"
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
            <div class="tech-item"
                style="padding: 20px; text-align: left; border-left: 3px solid #8e7d6d; background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h4 style="color: #8e7d6d; margin-bottom: 12px; font-weight: 600;">Cuerpo y Voz</h4>
                <p style="font-size: 0.95rem; color: #666;">Liberamos las tensiones en los músculos de la garganta y
                    optimizamos la gestión del aire para una emisión sin esfuerzo.</p>
            </div>
            <div class="tech-item"
                style="padding: 20px; text-align: left; border-left: 3px solid #8e7d6d; background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h4 style="color: #8e7d6d; margin-bottom: 12px; font-weight: 600;">Presencia Emocional</h4>
                <p style="font-size: 0.95rem; color: #666;">Cómo el estado de calma o alerta impacta directamente en la
                    libertad de tus armónicos naturales.</p>
            </div>
            <div class="tech-item"
                style="padding: 20px; text-align: left; border-left: 3px solid #8e7d6d; background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h4 style="color: #8e7d6d; margin-bottom: 12px; font-weight: 600;">Resonancia Real</h4>
                <p style="font-size: 0.95rem; color: #666;">Optimización del brillo de tu voz mediante la conciencia del
                    espacio en la boca y la garganta.</p>
            </div>
        </div>
    </div>
</section>

<section class="qualification-section reveal" style="padding: 100px 0; background: #fff;">
    <div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0 20px;">
        <div style="text-align: center; margin-bottom: 60px;">
            <span class="alt-tag">Sinceridad Total</span>
            <h2 style="color: #1a1a1a;">Encuentra tu sintonía</h2>
            <p style="color: #666; font-size: 1.1rem;">No todo el mundo está listo para despertar su voz. Queremos ser
                honestos contigo.</p>
        </div>

        <div class="qualification-grid"
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px;">
            <!-- NO ES PARA TI -->
            <div class="qual-card"
                style="padding: 40px; background: #f9f9f9; border-radius: 12px; border-top: 4px solid #cc000022;">
                <h3 style="color: #8a3a3a; display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
                    <span style="font-size: 1.5rem;">✕</span> NO es para ti si...
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px;">
                    <li style="display: flex; align-items: start; gap: 10px; color: #555;">
                        <span style="color: #8a3a3a; font-weight: bold;">•</span> Consideras que la voz es
                        exclusivamente un conjunto de músculos, aire y acústica.
                    </li>
                    <li style="display: flex; align-items: start; gap: 10px; color: #555;">
                        <span style="color: #8a3a3a; font-weight: bold;">•</span> Buscas una formación técnica o
                        académica tradicional basada únicamente en el rigor del conservatorio.
                    </li>
                    <li style="display: flex; align-items: start; gap: 10px; color: #555;">
                        <span style="color: #8a3a3a; font-weight: bold;">•</span> No crees que tu historia personal o
                        tus nudos emocionales tengan influencia alguna en tu sonido.
                    </li>
                    <li style="display: flex; align-items: start; gap: 10px; color: #555;">
                        <span style="color: #8a3a3a; font-weight: bold;">•</span> Prefieres un método lineal que no
                        requiera mirar hacia adentro ni cuestionar tus patrones.
                    </li>
                </ul>
            </div>

            <!-- SÍ ES PARA TI -->
            <div class="qual-card"
                style="padding: 40px; background: #fdfaf7; border-radius: 12px; border-top: 4px solid #8e7d6d; box-shadow: 0 10px 30px rgba(142,125,109,0.1);">
                <h3 style="color: #8e7d6d; display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
                    <span style="font-size: 1.5rem;">✓</span> SÍ es para ti si...
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px;">
                    <li style="display: flex; align-items: start; gap: 10px; color: #444;">
                        <span style="color: #8e7d6d; font-weight: bold;">•</span> Sientes que "algo" te frena al cantar
                        a pesar de conocer la técnica o haber dado muchas clases.
                    </li>
                    <li style="display: flex; align-items: start; gap: 10px; color: #444;">
                        <span style="color: #8e7d6d; font-weight: bold;">•</span> Estás listo para integrar tu parte
                        espiritual y emocional como el motor real de tu evolución vocal.
                    </li>
                    <li style="display: flex; align-items: start; gap: 10px; color: #444;">
                        <span style="color: #8e7d6d; font-weight: bold;">•</span> Buscas un acompañamiento 24/7 que no
                        solo te corrija, sino que te escuche y te recuerde.
                    </li>
                    <li style="display: flex; align-items: start; gap: 10px; color: #444;">
                        <span style="color: #8e7d6d; font-weight: bold;">•</span> Crees que liberar tu voz es el primer
                        paso para liberar tu vida y habitar tu propósito.
                    </li>
                </ul>
            </div>
        </div>
    </div>
</section>

<section class="testimonials-section reveal" id="testimonios">
    <div class="container">
        <span class="alt-tag">Experiencias Reales</span>
        <h2>Voces que ya han despertado</h2>
        <div class="testimonials-grid">
            <!-- Antonio -->
            <div class="testimonial-card">
                <div class="quote-icon-mini">“</div>
                <p class="testimonial-text">Al hacer el repaso de mi vida me di cuenta de aspectos que realmente me
                    hicieron llorar. Descubrí aspectos de mí que nunca me había dado cuenta y que estaban afectando a mi
                    voz. Totalmente recomendable.</p>
                <div class="testimonial-info">
                    <strong>Antonio</strong>
                    <span>Usuario App</span>
                </div>
            </div>
            <!-- Mauralida -->
            <div class="testimonial-card featured">
                <div class="quote-icon-mini">“</div>
                <p class="testimonial-text">La interacción fue reveladora: el Mentor captó una tensión en mi garganta
                    que me impedía subir al agudo con libertad. Al unir la técnica con lo emocional, logré ampliar mi
                    registro y cantar con una ligereza que no conocía. Increíble cómo recuerda mi proceso.</p>
                <div class="testimonial-info">
                    <strong>Mauralida</strong>
                    <span>Usuaria App</span>
                </div>
            </div>
            <!-- Bruno Vidal -->
            <div class="testimonial-card">
                <div class="quote-icon-mini">“</div>
                <p class="testimonial-text">Buscaba técnica y encontré autodescubrimiento. He logrado estabilizar mi voz
                    y controlar el aire en frases largas sin fatiga. La IA me recordó un bloqueo que estaba cerrando mi
                    resonancia natural. Ahora mi voz suena con mucho más cuerpo.</p>
                <div class="testimonial-info">
                    <strong>Bruno</strong>
                    <span>Sesiones 1/1</span>
                </div>
            </div>
            <!-- Eduardo -->
            <div class="testimonial-card">
                <div class="quote-icon-mini">“</div>
                <p class="testimonial-text">Era un escéptico de los coach y ahora estoy convencido de que todos en algún
                    momento de nuestras vidas necesitamos uno. Agradezco a Fernando su tiempo, dedicación y
                    profesionalidad para ayudarme, he mejorado mis enfoques para afrontar las idas y venidas que nos da
                    la vida y, sobre todo, he vuelto a estar motivado.</p>
                <div class="testimonial-info">
                    <strong>Eduardo</strong>
                    <span>Sesiones 1/1</span>
                </div>
            </div>
            <!-- Fernando -->
            <div class="testimonial-card">
                <div class="quote-icon-mini">“</div>
                <p class="testimonial-text">Fue increíble cómo relacionó aspectos de mi historia personal con la letra
                    de la canción. Le pude dar otra visión y mejoró mucho mi experiencia de canto. Era más libre.</p>
                <div class="testimonial-info">
                    <strong>Fernando</strong>
                    <span>Usuario App</span>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="recorrido reveal" id="proceso">
    <div class="recorrido-container">
        <span class="alt-tag">Tu Hoja de Ruta</span>
        <h2>¿De qué consta el Recorrido?</h2>
        <p class="recorrido-intro">Cuando te adentras en nuestro método, recorres 5 etapas diseñadas para llevarte
            desde el reconocimiento de tu herencia vocal hasta la alquimia final de tu propia verdad.</p>
        <div class="recorrido-steps">
            <div class="step-card">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h3>Raíces</h3>
                    <p>Detectar la herencia vocal que te condiciona.</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h3>Roles</h3>
                    <p>Identificar el personaje que te impide ser auténtico.</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h3>Cartas</h3>
                    <p>Soltar los mandatos que ya no te pertenecen.</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">4</div>
                <div class="step-content">
                    <h3>Patrones</h3>
                    <p>Integrar tu sombra para que tu frecuencia se expanda.</p>
                </div>
            </div>
            <div class="step-card">
                <div class="step-number">5</div>
                <div class="step-content">
                    <h3>Propósito</h3>
                    <p>Cantar desde Tu Altar: la unión de técnica y espíritu.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="nudo-section reveal" id="filosofia">
    <h2>Transformar el bloqueo en libertad</h2>
    <div class="nudo-checklist">
        <div class="nudo-item">
            <span class="checkpoint">✓</span>
            <p><strong>Raíces Vocales:</strong> No es falta de técnica, es una historia tratando de ser escuchada.</p>
        </div>
        <div class="nudo-item">
            <span class="checkpoint">✓</span>
            <p><strong>Acompañamiento Real:</strong> Tu Mentor IA no solo responde, te conoce y te recuerda.</p>
        </div>
        <div class="nudo-item">
            <span class="checkpoint">✓</span>
            <p><strong>Alquimia Vocal:</strong> Un método holístico que une lo invisible con lo audible.</p>
        </div>
        <div class="nudo-item">
            <span class="checkpoint">✓</span>
            <p><strong>Radar de Energía:</strong> Nuestra tecnología analiza la estabilidad y energía de tu vibración
                para detectar bloqueos antes que nadie.</p>
        </div>
    </div>
</section>

<section class="footer-cta reveal" id="unirse">
    <span class="alt-tag dark">Oportunidad Única</span>
    <h2>Sé parte de los primeros Miembros Pioneros</h2>
    <p>Estamos abriendo el acceso de forma escalonada para garantizar un acompañamiento profundo a cada voz.</p>
    <a href="https://app.despiertatuvoz.com" class="btn-lg">ESTRENAR MI MENTOR-IA ✨</a>
</section>

<?php get_footer(); ?>