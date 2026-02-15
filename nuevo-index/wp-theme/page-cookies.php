<?php
/**
 * Template Name: Política de Cookies
 */

get_header(); ?>

<main class="legal-page-theme"
    style="padding: 120px 5% 60px; max-width: 900px; margin: 0 auto; min-height: 70vh; font-family: 'Outfit', sans-serif; color: #333;">
    <div style="text-align: center; margin-bottom: 50px;">
        <span
            style="background: #f9f5f0; color: #a65d47; padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid #d4a373;">✨
            Claridad y Transparencia</span>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 3rem; color: #a65d47; margin-top: 20px;">Política
            de Cookies</h1>
        <p style="color: #666; font-style: italic;">Última actualización: 15 de febrero de 2026</p>
    </div>

    <section style="margin-bottom: 40px; line-height: 1.8; font-size: 1.1rem;">
        <p>En <strong>Despierta tu Voz</strong>, tu tranquilidad emocional comienza con la transparencia tecnológica.
            Esta página existe por exigencia legal, pero queremos explicártelo de forma sencilla: <strong>solo usamos
                las cookies estrictamente necesarias para que la App funcione.</strong> Ni te rastreamos, ni te vendemos
            publicidad.</p>
    </section>

    <div class="legal-content" style="line-height: 1.8;">
        <h2
            style="font-family: 'Playfair Display', serif; color: #a65d47; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            1. ¿Qué son las cookies?</h2>
        <p>Imagínalas como pequeñas "notas de voz" que tu navegador guarda para nosotros. Sirven para que no tengas que
            poner tu contraseña cada vez que entras o para que el Mentor IA recuerde en qué punto de tu viaje te
            quedaste.</p>

        <h2
            style="font-family: 'Playfair Display', serif; color: #a65d47; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            2. ¿Qué cookies utilizamos?</h2>
        <p>Solo utilizamos cookies de tipo <strong>técnico</strong>. Son indispensables para que puedas navegar por la
            web y usar sus funciones.</p>

        <div style="overflow-x: auto; margin: 30px 0;">
            <table
                style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                <thead style="background: #f9f5f0;">
                    <tr>
                        <th style="padding: 15px; text-align: left; color: #a65d47;">Finalidad</th>
                        <th style="padding: 15px; text-align: left; color: #a65d47;">Propiedad</th>
                        <th style="padding: 15px; text-align: left; color: #a65d47;">Duración</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px;">Mantener tu sesión abierta</td>
                        <td style="padding: 15px;">Propia (Supabase)</td>
                        <td style="padding: 15px;">Sesión / 30 días</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px;">Seguridad y protección</td>
                        <td style="padding: 15px;">Propia / Vercel</td>
                        <td style="padding: 15px;">Permanente</td>
                    </tr>
                    <tr>
                        <td style="padding: 15px;">Preferencias de trato IA</td>
                        <td style="padding: 15px;">Propia</td>
                        <td style="padding: 15px;">Persistente</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h2
            style="font-family: 'Playfair Display', serif; color: #a65d47; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            3. Titulares y Transferencias</h2>
        <p>Para que el Mentor IA sea capaz de acompañarte, trabajamos con infraestructura de alta seguridad:
        <ul style="margin-top: 10px;">
            <li><strong>Supabase:</strong> Nuestra base de datos segura (donde vive tu perfil).</li>
            <li><strong>Vercel:</strong> El motor donde vive la inteligencia de la App.</li>
            <li><strong>Stripe:</strong> Garantiza que tus pagos sean 100% privados y seguros.</li>
        </ul>
        El uso de estas herramientas implica transferencias técnicas necesarias a servidores seguros que cumplen
        estrictamente con los marcos legales de protección de datos.
        </p>

        <h2
            style="font-family: 'Playfair Display', serif; color: #a65d47; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            4. Cómo gestionar tus cookies</h2>
        <p>Al ser cookies puramente técnicas, la web no funcionaría sin ellas. Sin embargo, siempre tienes el control
            total: puedes borrarlas o bloquearlas desde los ajustes de tu navegador (Chrome, Safari, Firefox, etc.).</p>

        <h2
            style="font-family: 'Playfair Display', serif; color: #a65d47; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            5. Sin perfiles comerciales</h2>
        <p>No utilizamos tus cookies para elaborar perfiles comerciales ni para invadir tu privacidad con publicidad.
            Nuestro único fin es que tu experiencia de despertar vocal sea fluida y personalizada.</p>
    </div>

    <div style="text-align: center; margin-top: 60px;">
        <a href="<?php echo esc_url(home_url('/')); ?>"
            style="color: #a65d47; text-decoration: none; font-weight: 700; border: 2px solid #a65d47; padding: 10px 25px; border-radius: 30px; transition: all 0.3s;">←
            Volver al inicio</a>
    </div>
</main>

<?php get_footer(); ?>