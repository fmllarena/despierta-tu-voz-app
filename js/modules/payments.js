import { ELEMENTS } from './elements.js';
import { SESIONES } from './sessions.js';
import { userProfile, supabaseClient } from './config.js';

export const PAYMENTS = window.PAYMENTS = {
    async checkStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            const sessionId = urlParams.get('session_id');
            const planType = urlParams.get('plan');

            // Limpiamos la URL sin recargar para una experiencia más limpia
            window.history.replaceState({}, document.title, window.location.pathname);

            // Detectar si es una sesión extra
            const isExtraSession = planType && planType.startsWith('extra_');

            if (sessionId && !isExtraSession) {
                // Caso Actualización de Plan (Suscripción)
                alert("¡Tu plan se ha actualizado con éxito! Bienvenido a tu nuevo nivel de transformación.");

                // Recargamos el perfil para aplicar cambios de UI (tier)
                // Nota: cargarPerfil está en main.js (global)
                if (window.cargarPerfil) {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user) await window.cargarPerfil(user);
                }
            } else if (isExtraSession) {
                // Caso Sesión Extra (Pago único) - Abrir Cal.com automáticamente
                const duracion = planType.includes('30') ? '30' : '60';

                // Determinar el enlace correcto de Cal.com
                let calLink = '';
                if (duracion === '30') {
                    calLink = SESIONES.links.normal30;
                } else {
                    calLink = SESIONES.links.normal60;
                }

                // Construir URL con datos del usuario
                const profile = window.userProfile || userProfile;
                if (!profile?.email) {
                    console.warn("⚠️ [Payments] Éxito detectado pero no hay email en el perfil. Esperando login...");
                    alert("⚠️ Pago detectado. Por favor, asegúrate de estar logueado para reservar.");
                    return;
                }

                const finalUrl = `${calLink}?email=${encodeURIComponent(profile.email)}&name=${encodeURIComponent(profile.nombre || "")}`;

                // Abrir Cal.com en nueva pestaña
                window.open(finalUrl, '_blank');

                // Mostrar mensaje de confirmación
                alert(`✅ ¡Pago confirmado! Se ha abierto el calendario para que reserves tu sesión de ${duracion} minutos.\n\nSi no se abrió automáticamente, haz clic en "Reservar" en el modal de Sesiones 1/1.`);

                // Abrir el modal de sesiones para que vea su cuota actualizada
                SESIONES.abrirModal();
            }
        } else if (urlParams.get('payment') === 'cancel') {
            window.history.replaceState({}, document.title, window.location.pathname);
            alert("El proceso de pago fue cancelado.");
        }

        // Detectar si viene desde email de fin de trial (upgrade=pro)
        const autoUpgrade = sessionStorage.getItem('dtv_auto_upgrade');
        if (autoUpgrade) {
            sessionStorage.removeItem('dtv_auto_upgrade'); // Limpiar para que no se repita
            setTimeout(() => {
                if (ELEMENTS.upgradeModal) {
                    ELEMENTS.upgradeModal.style.display = 'flex';
                    console.log(`🔔 Abriendo modal de upgrade automáticamente (plan: ${autoUpgrade})`);
                }
            }, 1000);
        }
    }
};

// Auto-inicialización si el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PAYMENTS.checkStatus());
} else {
    PAYMENTS.checkStatus();
}
