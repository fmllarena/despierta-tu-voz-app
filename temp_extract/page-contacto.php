<?php
/* Template Name: Contacto */
get_header(); ?>

<section class="alt-hero blog-hero contact-hero reveal">
    <div class="container">
        <span class="alt-tag">Contacto</span>
        <h1>Hablemos de tu voz</h1>
        <div class="alt-hero-quote">
            <p>Nuestra voz es el puente entre nuestro mundo interno y externo. Si sientes el llamado a profundizar o
                tienes dudas sobre cómo empezar, escríbenos. Estaremos encantados de escucharte.</p>
        </div>
    </div>
</section>

<section class="contact-section reveal">
    <div class="container">
        <div class="contact-grid">
            <!-- Formulario -->
            <div class="contact-form-container">
                <h2>Enviarnos un mensaje</h2>

                <?php
                /**
                 * CONFIGURACIÓN DEL FORMULARIO
                 * Puedes usar WPForms, Brevo (Sendinblue), Contact Form 7, etc.
                 * Simplemente pega aquí el shortcode que te dé tu plugin.
                 * 
                 * Ejemplo Brevo: '[sibwp_form id="1"]'
                 * Ejemplo WPForms: '[wpforms id="123" title="false"]'
                 */
                $contact_form_shortcode = '[wpforms id="363" title="false"]';

                // Ejecutamos el shortcode si no está vacío y ha sido configurado con un ID real
                if (!empty($contact_form_shortcode) && strpos($contact_form_shortcode, 'YOUR_FORM_ID') === false):
                    echo do_shortcode($contact_form_shortcode);
                else: ?>
                    <!-- Fallback: Formulario estático si no hay plugin activo -->
                    <form action="#" method="POST">
                        <div class="form-group">
                            <label for="name">Nombre completo</label>
                            <input type="text" id="name" name="name" class="form-control" placeholder="Tu nombre..."
                                required>
                        </div>
                        <div class="form-group">
                            <label for="email">Correo electrónico</label>
                            <input type="email" id="email" name="email" class="form-control" placeholder="tu@email.com"
                                required>
                        </div>
                        <div class="form-group">
                            <label for="subject">¿En qué podemos ayudarte?</label>
                            <select id="subject" name="subject" class="form-control" required>
                                <option value="" disabled selected>Selecciona una opción</option>
                                <option value="mentoria">Mentoría Individual / Grupal</option>
                                <option value="app">Soporte o dudas App DTV</option>
                                <option value="talleres">Talleres y formación</option>
                                <option value="otros">Otros asuntos</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="message">Tu mensaje</label>
                            <textarea id="message" name="message" class="form-control"
                                placeholder="Cuéntanos un poco sobre tu relación con tu voz..." required></textarea>
                        </div>
                        <button type="submit" class="btn-primary btn-submit">
                            ENVIAR MENSAJE ✨
                        </button>
                    </form>
                <?php endif; ?>
            </div>

            <!-- Información -->
            <div class="contact-info">
                <div class="info-item">
                    <h3>Correo Directo</h3>
                    <p>Preferimos el contacto humano y directo. Escríbenos a:</p>
                    <p id="email-placeholder"><em>Cargando dirección...</em></p>
                    <script>
                        // Obfuscation to prevent bot harvesting
                        (function () {
                            var user = 'hola';
                            var domain = 'despiertatuvoz.com';
                            var element = document.getElementById('email-placeholder');
                            element.innerHTML = '<strong><a href="mailto:' + user + '@' + domain + '" style="color: inherit; text-decoration: none;">' + user + '@' + domain + '</a></strong>';
                        })();
                    </script>
                </div>

                <div class="info-item">
                    <h3>Nuestra Comunidad</h3>
                    <p>Síguenos para contenido diario sobre biodecodificación vocal y gestión emocional.</p>
                    <div class="social-links">
                        <a href="https://www.instagram.com/derpierta_tu_voz/" class="social-icon" target="_blank"
                            rel="noopener" aria-label="Instagram" title="Instagram">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=794764476" class="social-icon"
                            target="_blank" rel="noopener" aria-label="Facebook" title="Facebook">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                            </svg>
                        </a>
                    </div>
                </div>

                <div class="info-item">
                    <h3>Ubicación</h3>
                    <p>Nuestra base está en Valencia, España, pero acompañamos voces de todo el mundo a través de
                        nuestra plataforma digital.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>