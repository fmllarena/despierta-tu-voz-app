import { ELEMENTS } from './elements.js';
import { userProfile } from './config.js';

export const SESIONES = window.SESIONES = {
    links: {
        normal30: "https://cal.com/fernando-martinez-drmyul/30min",
        normal60: "https://cal.com/fernando-martinez-drmyul/sesion-de-1-h",
        extra30: "#", // Placeholder (se gestiona tras pago)
        extra60: "#"  // Placeholder (se gestiona tras pago)
    },

    abrirModal: () => {
        ELEMENTS.sesionModal.style.display = 'block';
        SESIONES.actualizarInfoCuota();
    },

    actualizarInfoCuota: () => {
        const consumed = userProfile?.sessions_minutes_consumed || 0;
        const tier = userProfile?.subscription_tier || 'free';
        const remaining = tier === 'premium' ? Math.max(0, 60 - consumed) : 0;

        if (tier === 'premium') {
            ELEMENTS.sessionQuotaInfo.innerHTML = `
                <div class="quota-badge">
                    <span class="quota-label">Tu tiempo incluido restante:</span>
                    <span class="quota-value">${remaining} min</span>
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
        } else {
            // Caso PRO
            ELEMENTS.sessionQuotaInfo.innerHTML = `
                <div class="quota-badge">
                    <span class="quota-label">Tu plan actual no incluye sesiones 1/1 grupales/individules.</span>
                </div>
            `;
            ELEMENTS.book30Btn.disabled = true;
            ELEMENTS.book60Btn.disabled = true;
            ELEMENTS.book30Btn.innerText = "No incluido";
            ELEMENTS.book60Btn.innerText = "No incluido";
        }
    },

    comprarExtra: (duracion) => {
        const tier = userProfile?.subscription_tier || 'free';
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
        const url = SESIONES.links[tipo];
        if (url && url !== "#") {
            // Añadimos el email del usuario para que Cal.com lo reconozca
            const finalUrl = `${url}?email=${encodeURIComponent(userProfile.email)}&name=${encodeURIComponent(userProfile.nombre || "")}`;
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
