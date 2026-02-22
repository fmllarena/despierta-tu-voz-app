import { ELEMENTS } from './elements.js';
import { userProfile } from './config.js';

export const SESIONES = window.SESIONES = {
    links: {
        normal30: "https://cal.com/fernando-martinez-drmyul/30min",
        normal60: "https://cal.com/fernando-martinez-drmyul/sesion-de-1-h",
        extra30: "#", // Placeholder (se gestiona tras pago)
        extra60: "#"  // Placeholder (se gestiona tras pago)
    },

    abrirModal: async () => {
        ELEMENTS.sesionModal.style.display = 'block';
        SESIONES.actualizarInfoCuota();

        // Re-fetch del perfil para asegurar datos frescos tras reserva externa
        try {
            const { data, error } = await window.supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('user_id', window.userProfile.user_id)
                .single();

            if (data && !error) {
                window.userProfile = data;
                SESIONES.actualizarInfoCuota();
            }
        } catch (e) {
            console.error("Error refrescando perfil:", e);
        }
    },

    actualizarInfoCuota: () => {
        const profile = window.userProfile;
        const consumed = profile?.sessions_minutes_consumed || 0;
        const tier = (profile?.subscription_tier || 'free').toLowerCase();

        // Transforma = Premium
        const isPremium = tier === 'premium' || tier === 'transforma';
        const isPro = tier === 'pro' || tier === 'profundiza';

        if (isPremium) {
            const total = 60;
            const remaining = Math.max(0, total - consumed);

            ELEMENTS.sessionQuotaInfo.innerHTML = `
                <div class="quota-badge">
                    <span class="quota-label">Tiempo consumido:</span>
                    <span class="quota-value">${consumed} / ${total} min</span>
                </div>
            `;
            // Hab/Des botones incluidos
            ELEMENTS.book30Btn.disabled = remaining < 30;
            ELEMENTS.book60Btn.disabled = remaining < 60;

            if (remaining < 30) {
                ELEMENTS.book30Btn.innerText = "Cuota agotada";
                ELEMENTS.book60Btn.innerText = "Cuota agotada";
            } else if (remaining < 60) {
                ELEMENTS.book60Btn.innerText = "Tiempo insuficiente";
            } else {
                ELEMENTS.book30Btn.innerText = "Reservar 30 min";
                ELEMENTS.book60Btn.innerText = "Reservar 1 hora";
            }
        } else if (isPro) {
            // Caso PRO: No tiene cuota base, pero puede comprar extras
            ELEMENTS.sessionQuotaInfo.innerHTML = `
                <div class="quota-badge">
                    <span class="quota-label">Tu plan Profundiza no incluye sesiones gratuitas.</span>
                </div>
            `;
            ELEMENTS.book30Btn.disabled = true;
            ELEMENTS.book60Btn.disabled = true;
            ELEMENTS.book30Btn.innerText = "No incluido";
            ELEMENTS.book60Btn.innerText = "No incluido";
        } else {
            // Caso FREE
            ELEMENTS.sessionQuotaInfo.innerHTML = `
                <div class="quota-badge">
                    <span class="quota-label">Las sesiones 1/1 requieren el plan Profundiza o Transforma.</span>
                </div>
            `;
            ELEMENTS.book30Btn.disabled = true;
            ELEMENTS.book60Btn.disabled = true;
            ELEMENTS.book30Btn.innerText = "No incluido";
            ELEMENTS.book60Btn.innerText = "No incluido";
        }
    },

    comprarExtra: (duracion) => {
        const profile = window.userProfile;
        const tier = profile?.subscription_tier || 'free';
        // Los usuarios FREE deben primero pasar a PRO/Premium antes de comprar extras
        if (tier === 'free') {
            alert("Las sesiones con el Mentor están reservadas para alumnos de los planes Profundiza (PRO) o Transforma. ¡Mejora tu plan para empezar!");
            ELEMENTS.upgradeModal.style.display = 'flex';
            return;
        }

        const planKey = `extra_${duracion}_${tier}`;
        console.log("Iniciando compra extra a través de Stripe:", planKey);

        if (window.iniciarPago) {
            window.iniciarPago(planKey);
        } else {
            alert("El sistema de pagos no está listo. Por favor, recarga la página.");
        }
    },

    reservar: (tipo) => {
        const profile = window.userProfile;
        const url = SESIONES.links[tipo];
        if (url && url !== "#") {
            // Añadimos el email y el user_id para que el Webhook lo reciba directamente
            const finalUrl = `${url}?email=${encodeURIComponent(profile.email)}&name=${encodeURIComponent(profile.nombre || "")}&userId=${profile.user_id}`;
            window.open(finalUrl, '_blank');
        } else {
            alert("El enlace para esta sesión aún no está configurado.");
        }
    },

    setup() {
        // Event Listeners Sesiones
        ELEMENTS.sesionBtn?.addEventListener('click', () => this.abrirModal());
        ELEMENTS.closeSesion?.addEventListener('click', () => {
            ELEMENTS.sesionModal.style.display = 'none';
        });

        ELEMENTS.book30Btn?.addEventListener('click', () => this.reservar('normal30'));
        ELEMENTS.book60Btn?.addEventListener('click', () => this.reservar('normal60'));
        ELEMENTS.buyExtra30Btn?.addEventListener('click', () => this.comprarExtra('30'));
        ELEMENTS.buyExtra60Btn?.addEventListener('click', () => this.comprarExtra('60'));

        // Cierre al hacer click fuera (modales genéricos)
        window.addEventListener('click', e => {
            if (e.target === ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
        });
    }
};

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SESIONES.setup());
} else {
    SESIONES.setup();
}
