<?php
/* Template Name: Eliminación de Datos */
get_header(); ?>

<section class="alt-hero legal-hero reveal">
    <div class="container">
        <span class="alt-tag">Control y Privacidad</span>
        <h1>Eliminación de Datos</h1>
        <div class="alt-hero-quote">
            <p>Tienes el control total sobre tu información. Aquí te explicamos cómo solicitar el borrado permanente de
                tu cuenta.</p>
        </div>
    </div>
</section>

<section class="legal-content-section reveal">
    <div class="container">
        <div class="legal-text-wrapper">
            <h2>¿Qué datos eliminamos?</h2>
            <p>Al solicitar la eliminación total de tu cuenta, borraremos de forma permanente:</p>
            <ul>
                <li>Tu perfil de usuario (nombre y correo electrónico).</li>
                <li>Tu historial completo de conversaciones con el Mentor IA.</li>
                <li>Tu progreso en los Módulos de Sanación Vocal y "Mi Viaje".</li>
                <li>Cualquier preferencia personalizada almacenada en nuestra base de datos.</li>
            </ul>

            <h2 class="mt-40">Opciones para solicitar la eliminación</h2>

            <div class="instruction-box">
                <h3>1. A través de la Aplicación (Recomendado)</h3>
                <p>La forma más rápida y directa es hacerlo tú mismo desde la aplicación:</p>
                <ol>
                    <li>Entra en <strong>Ajustes</strong> (icono de engranaje).</li>
                    <li>Selecciona <strong>"Gestionar preferencias de email y cuenta"</strong>.</li>
                    <li>Pulsa el botón <strong>"Eliminar mi cuenta y mis datos"</strong> al final de la página.</li>
                </ol>
                <p>Esta acción eliminará instantáneamente tu perfil, historial y progreso.</p>
            </div>

            <div class="instruction-box mt-40">
                <h3>2. Solicitud por Correo Electrónico</h3>
                <p>Si prefieres que lo hagamos nosotros, envía un correo a:</p>
                <p style="text-align: center; font-weight: bold; font-size: 1.25rem;">app-mentor@despiertatuvoz.com</p>
                <p>Procesaremos tu solicitud en un plazo máximo de 72 horas hábiles.</p>
            </div>

            <div class="instruction-box mt-40">
                <h3>3. A través de Meta (Facebook/Instagram)</h3>
                <p>Si has vinculado tu cuenta a través de Facebook o Instagram, puedes revocar el acceso desde tu
                    configuración de Meta en: <strong>Configuración y privacidad > Aplicaciones y sitios web</strong>.
                    Busca "Despierta tu Voz" y selecciona "Eliminar".</p>
            </div>
        </div>
    </div>
</section>

<style>
    .legal-text-wrapper {
        max-width: 800px;
        margin: 0 auto;
        padding: 60px 20px;
        line-height: 1.8;
        color: var(--text-dark);
    }

    .legal-text-wrapper h2 {
        font-size: 1.5rem;
        color: var(--accent);
        margin-bottom: 15px;
    }

    .legal-text-wrapper p {
        margin-bottom: 20px;
        font-size: 1.05rem;
    }

    .instruction-box {
        padding: 30px;
        background: rgba(var(--accent-rgb), 0.05);
        border-radius: 12px;
        border-left: 4px solid var(--accent);
    }

    .instruction-box h3 {
        margin-top: 0;
        color: var(--accent);
    }

    .mt-40 {
        margin-top: 40px;
    }
</style>

<?php get_footer(); ?>