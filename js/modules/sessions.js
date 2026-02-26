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
        console.log("🎟️ Abriendo Modal de Sesiones...");
        try {
            // Reset a vista inicial (selección)
            const selectionUI = document.getElementById('sesionSelection');
            const calContainer = document.getElementById('cal-embed-container');
            if (selectionUI) selectionUI.style.display = 'block';
            if (calContainer) calContainer.style.display = 'none';

            if (ELEMENTS.sesionModal) {
                ELEMENTS.sesionModal.style.display = 'block';
            } else {
                console.error("❌ No se encontró sesionModal en el DOM");
            }

            SESIONES.actualizarInfoCuota();

            // Re-fetch del perfil para asegurar datos frescos
            if (window.supabaseClient && window.userProfile?.user_id) {
                const { data, error } = await window.supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', window.userProfile.user_id)
                    .single();

                if (data && !error) {
                    window.userProfile = data;
                    SESIONES.actualizarInfoCuota();
                }
            }
        } catch (e) {
            console.error("Error en abrirModal:", e);
        }
    },

    actualizarInfoCuota: () => {
        const profile = window.userProfile;
        const consumed = profile?.sessions_minutes_consumed || 0;
        const tier = (profile?.subscription_tier || 'free').trim().toLowerCase();

        console.log(`📊 Actualizando cuota. Tier: ${tier}, Consumido: ${consumed}`);

        // Transforma = Premium
        const isPremium = tier === 'premium' || tier === 'transforma';
        const isPro = tier === 'pro' || tier === 'profundiza';

        try {
            if (isPremium) {
                const total = 60;
                const remaining = Math.max(0, total - consumed);

                if (ELEMENTS.sessionQuotaInfo) {
                    ELEMENTS.sessionQuotaInfo.innerHTML = `
                        <div class="quota-badge">
                            <span class="quota-label">Tiempo consumido:</span>
                            <span class="quota-value">${consumed} / ${total} min</span>
                        </div>
                    `;
                }

                if (ELEMENTS.book30Btn) {
                    ELEMENTS.book30Btn.disabled = remaining < 30;
                    ELEMENTS.book30Btn.innerText = remaining < 30 ? "Cuota agotada" : "Reservar 30 min";
                }
                if (ELEMENTS.book60Btn) {
                    ELEMENTS.book60Btn.disabled = remaining < 60;
                    ELEMENTS.book60Btn.innerText = remaining < 60 ? (remaining < 30 ? "Cuota agotada" : "Tiempo insuficiente") : "Reservar 1 hora";
                }
            } else if (isPro) {
                if (ELEMENTS.sessionQuotaInfo) {
                    ELEMENTS.sessionQuotaInfo.innerHTML = `
                        <div class="quota-badge">
                            <span class="quota-label">Tu plan Profundiza no incluye sesiones gratuitas.</span>
                        </div>
                    `;
                }
                if (ELEMENTS.book30Btn) {
                    ELEMENTS.book30Btn.disabled = true;
                    ELEMENTS.book30Btn.innerText = "No incluido";
                }
                if (ELEMENTS.book60Btn) {
                    ELEMENTS.book60Btn.disabled = true;
                    ELEMENTS.book60Btn.innerText = "No incluido";
                }
            } else {
                if (ELEMENTS.sessionQuotaInfo) {
                    ELEMENTS.sessionQuotaInfo.innerHTML = `
                        <div class="quota-badge">
                            <span class="quota-label">Las sesiones 1/1 requieren el plan Profundiza o Transforma.</span>
                        </div>
                    `;
                }
                if (ELEMENTS.book30Btn) {
                    ELEMENTS.book30Btn.disabled = true;
                    ELEMENTS.book30Btn.innerText = "No incluido";
                }
                if (ELEMENTS.book60Btn) {
                    ELEMENTS.book60Btn.disabled = true;
                    ELEMENTS.book60Btn.innerText = "No incluido";
                }
            }
        } catch (e) {
            console.error("Error actualizando UI de cuota:", e);
        }
    },

    comprarExtra: (duracion) => {
        const profile = window.userProfile;
        const tier = (profile?.subscription_tier || 'free').trim().toLowerCase();

        if (tier === 'free') {
            alert("Las sesiones con el Mentor están reservadas para alumnos de los planes Profundiza (PRO) o Transforma. ¡Mejora tu plan para empezar!");
            if (ELEMENTS.upgradeModal) ELEMENTS.upgradeModal.style.display = 'flex';
            return;
        }

        const planKey = `extra_${duracion}_${tier}`;
        console.log("💰 Iniciando compra extra:", planKey);

        if (window.PAYMENTS?.iniciarPagoInApp) {
            window.PAYMENTS.iniciarPagoInApp(planKey);
        } else if (window.iniciarPago) {
            window.iniciarPago(planKey);
        } else {
            alert("El sistema de pagos no está listo. Por favor, recarga la página.");
        }
    },

    reservar: (tipo) => {
        console.log(`📅 [SESIONES] Reservando tipo: ${tipo}`);
        const profile = window.userProfile;
        const url = SESIONES.links[tipo];

        if (!url || url === "#") {
            console.error("❌ Error: URL de sesión no definida para", tipo);
            alert("El enlace para esta sesión aún no está configurado.");
            return;
        }

        const calLink = url.replace("https://cal.com/", "");
        const selectionUI = document.getElementById('sesionSelection');
        const calContainer = document.getElementById('cal-embed-container');

        // 1. Asegurar visibilidad del modal y ocultar selección
        if (ELEMENTS.sesionModal) {
            ELEMENTS.sesionModal.style.display = 'block';
        }

        if (selectionUI) selectionUI.style.display = 'none';

        // 2. Preparar el contenedor
        if (calContainer) {
            console.log("📍 Preparando contenedor #cal-embed-container");
            calContainer.innerHTML = `
                <div class="loader-premium">
                    <div class="loader-spin"></div>
                    <p>Conectando con tu Mentor...</p>
                </div>
            `;
            calContainer.style.display = 'block';
            calContainer.style.visibility = 'visible';
            calContainer.style.opacity = '1';
        } else {
            console.error("❌ No se encontró el contenedor #cal-embed-container");
            return;
        }

        // 3. Inicializar Cal.com con un ligero delay para que el DOM se asiente
        if (window.Cal) {
            console.log(`🚀 Inicializando Cal.com inline para: ${calLink}`);
            setTimeout(() => {
                window.Cal("inline", {
                    elementOrSelector: "#cal-embed-container",
                    calLink: calLink,
                    config: {
                        name: profile?.nombre || "",
                        email: profile?.email || "",
                        metadata: { userId: profile?.user_id }
                    }
                });

                window.Cal("ui", {
                    styles: { branding: { brandColor: "#3a506b" } },
                    hideEventTypeDetails: false,
                    layout: "month_view"
                });
            }, 200);
        } else {
            console.error("❌ Cal.com SDK no detectado en el objeto 'window'");
            alert("Error al cargar el calendario. Por favor, recarga la página.");
        }
    },

    setup() {
        console.log("🛠️ Configurando listeners de SESIONES...");

        if (window.Cal) window.Cal("ui", { theme: "light" });

        ELEMENTS.sesionBtn?.addEventListener('click', () => this.abrirModal());
        ELEMENTS.closeSesion?.addEventListener('click', () => {
            if (ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
        });

        ELEMENTS.book30Btn?.addEventListener('click', (e) => {
            console.log("Click en book30Btn");
            this.reservar('normal30');
        });
        ELEMENTS.book60Btn?.addEventListener('click', (e) => {
            console.log("Click en book60Btn");
            this.reservar('normal60');
        });

        ELEMENTS.buyExtra30Btn?.addEventListener('click', () => this.comprarExtra('30'));
        ELEMENTS.buyExtra60Btn?.addEventListener('click', () => this.comprarExtra('60'));

        window.addEventListener('click', e => {
            if (e.target === ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
        });

        if (window.Cal) {
            window.Cal("on", {
                action: "bookingSuccessful",
                callback: (e) => {
                    console.log("✅ Reserva exitosa:", e);
                    setTimeout(() => {
                        if (ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
                    }, 2000);
                }
            });
        }
    }
};

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SESIONES.setup());
} else {
    SESIONES.setup();
}
