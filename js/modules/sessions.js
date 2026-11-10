/**
 * DTV Sessions Module (Global Version)
 * Maneja la integración con Cal.com y la lógica de reserva de sesiones.
 * Esta versión no usa ES modules para asegurar compatibilidad y carga inmediata.
 */

console.log("🔵 sessions.js: Iniciando carga (Versión Global)...");

window.SESIONES = {
    links: {
        normal30: "https://cal.com/fernando-martinez-drmyul/30min",
        normal60: "https://cal.com/fernando-martinez-drmyul/sesion-de-1-h",
        extra30: "#", // Placeholder (se gestiona tras pago)
        extra60: "#"  // Placeholder (se gestiona tras pago)
    },

    abrirModal: async () => {
        console.log("🎟️ Abriendo Modal de Sesiones (Global)...");
        try {
            // Reset a vista inicial (selección)
            const selectionUI = document.getElementById('sesionSelection');
            const calContainer = document.getElementById('cal-embed-container');
            if (selectionUI) selectionUI.style.display = 'block';
            if (calContainer) calContainer.style.display = 'none';

            if (window.ELEMENTS && window.ELEMENTS.sesionModal) {
                window.ELEMENTS.sesionModal.style.display = 'block';
                window.SESIONES.actualizarInfoCuota();
            } else {
                console.error("❌ No se encontró sesionModal en el DOM");
            }
        } catch (e) {
            console.error("Error abriendo modal sesiones:", e);
        }
    },

    actualizarInfoCuota: () => {
        const profile = window.userProfile;
        const ELEMENTS = window.ELEMENTS;
        if (!profile || !ELEMENTS) return;

        const consumed = profile.sessions_minutes_consumed || 0;
        const tier = profile.subscription_tier || 'free';
        const remaining = tier === 'premium' ? Math.max(0, 60 - consumed) : 0;

        console.log(`📊 Actualizando cuota. Tier: ${tier}, Consumido: ${consumed}, Restante: ${remaining}`);

        if (tier === 'premium' || tier === 'transforma') {
            if (ELEMENTS.sessionQuotaInfo) {
                ELEMENTS.sessionQuotaInfo.innerHTML = `
                    <div class="quota-badge">
                        <span class="quota-label">Tu tiempo incluido restante:</span>
                        <span class="quota-value">${remaining} min / 60 min</span>
                    </div>
                `;
            }
            // Hab/Des botones incluidos
            if (ELEMENTS.book30Btn) ELEMENTS.book30Btn.disabled = remaining < 30;
            if (ELEMENTS.book60Btn) ELEMENTS.book60Btn.disabled = remaining < 60;

            if (remaining < 30) {
                if (ELEMENTS.book30Btn) ELEMENTS.book30Btn.innerText = "Cuota agotada";
                if (ELEMENTS.book60Btn) ELEMENTS.book60Btn.innerText = "Cuota agotada";
            } else if (remaining < 60) {
                if (ELEMENTS.book60Btn) ELEMENTS.book60Btn.innerText = "Tiempo insuficiente";
            } else {
                if (ELEMENTS.book30Btn) ELEMENTS.book30Btn.innerText = "Reservar 30 min";
                if (ELEMENTS.book60Btn) ELEMENTS.book60Btn.innerText = "Reservar 1 hora";
            }
        } else {
            // Caso PRO o FREE: no basta con decir que no está incluido,
            // hay que explicar qué es y ofrecer la salida natural.
            if (ELEMENTS.sessionQuotaInfo) {
                ELEMENTS.sessionQuotaInfo.innerHTML = `
                    <div class="quota-badge quota-vacio">
                        <p class="quota-titulo">Las sesiones 1/1 son parte del plan Transforma</p>
                        <p class="quota-detalle">Una hora al mes con Fernando para trabajar tu voz y tus bloqueos en directo, con seguimiento personalizado.</p>
                        <button type="button" class="save-btn quota-cta-btn" data-abrir-upgrade>
                            Ver el plan Transforma
                        </button>
                    </div>
                `;

                const cta = ELEMENTS.sessionQuotaInfo.querySelector('[data-abrir-upgrade]');
                if (cta) {
                    cta.addEventListener('click', () => {
                        if (ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
                        if (ELEMENTS.upgradeModal) ELEMENTS.upgradeModal.style.display = 'flex';
                    });
                }
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
    },

    comprarExtra: (duracion) => {
        const profile = window.userProfile;
        const tier = profile?.subscription_tier || 'free';
        if (tier === 'free') {
            alert("Las sesiones con el Mentor están reservadas para alumnos de los planes Profundiza (PRO) o Transforma. ¡Mejora tu plan para empezar!");
            if (window.ELEMENTS && window.ELEMENTS.upgradeModal) {
                window.ELEMENTS.upgradeModal.style.display = 'flex';
            }
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
        const ELEMENTS = window.ELEMENTS;
        const profile = window.userProfile;
        console.log(`📅 [SESIONES] Reservando tipo: ${tipo} (v7 Iframe Controlado)`);

        const url = window.SESIONES.links[tipo];
        if (!url || url === "#") {
            console.error("❌ Error: URL de sesión no definida para", tipo);
            alert("El enlace para esta sesión aún no está configurado.");
            return;
        }

        const selectionUI = document.getElementById('sesionSelection');
        const calContainer = document.getElementById('cal-embed-container');
        const iframeTarget = document.getElementById('cal-iframe-target');

        // 1. Mostrar el modal y ocultar selección
        if (ELEMENTS && ELEMENTS.sesionModal) {
            ELEMENTS.sesionModal.style.display = 'block';
        }
        if (selectionUI) selectionUI.style.display = 'none';

        // 2. Construcción de URL con parámetros de incrustación manual para DTV
        // Pre-llenamos datos de usuario directamente en la URL para evitar fricción
        const embedUrl = `${url}?embed=true&theme=dark&name=${encodeURIComponent(profile?.nombre || "")}&email=${encodeURIComponent(profile?.email || "")}`;

        // 3. Inyectamos el iframe con esteroides (estilo DTV)
        if (calContainer && iframeTarget) {
            calContainer.style.display = 'block';
            calContainer.style.height = "650px";

            iframeTarget.innerHTML = `
                <iframe 
                    src="${embedUrl}" 
                    id="cal-iframe-dtv"
                    style="width:100%; height:650px; border:none; border-radius: 8px;" 
                    allowfullScreen 
                    title="Agenda tu sesión con tu Mentor">
                </iframe>
            `;

            const loader = calContainer.querySelector('.loader-premium');
            if (loader) {
                // El loader desaparece tras el tiempo estimado de carga del iframe
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => { loader.style.display = 'none'; }, 200);
                }, 1500);
            }
        }

        console.log("🛠️ Iframe manual inyectado. Configurando observador de eventos...");

        // 4. El truco para "Volver a la App": Escuchar el mensaje de éxito de Cal.com
        const handleCalMessage = (e) => {
            // Cal.com envía este mensaje cuando la reserva se completa
            if (e.origin === "https://cal.com" || e.data?.origin === "Cal") {
                if (e.data?.type === "bookingSuccessful" || e.data?.type === "linkReady") {
                    console.log("✅ Reserva detectada en el Iframe. Preparando cierre...");

                    setTimeout(() => {
                        if (ELEMENTS && ELEMENTS.sesionModal) {
                            ELEMENTS.sesionModal.style.display = 'none';
                        }
                        alert("¡Sesión agendada con éxito! Volviendo a tu panel...");
                        // Actualizamos el perfil para refrescar cuotas si es necesario
                        if (typeof window.SESIONES?.loadProfile === "function") {
                            window.SESIONES.loadProfile();
                        }
                    }, 2500);

                    // Limpiamos el listener para evitar duplicados
                    window.removeEventListener("message", handleCalMessage);
                }
            }
        };

        window.addEventListener("message", handleCalMessage);
    },

    setup() {
        console.log("🛠️ Configurando listeners de SESIONES (Global)...");
        const ELEMENTS = window.ELEMENTS;
        if (!ELEMENTS) {
            console.warn("⚠️ ELEMENTS no disponible en SESIONES.setup(), reintentando...");
            setTimeout(() => window.SESIONES.setup(), 500);
            return;
        }

        if (window.Cal) window.Cal("ui", { theme: "light" });

        if (ELEMENTS.sesionBtn) {
            console.log("✅ [DEBUG] sesionBtn detectado, vinculando click.");
            // Eliminar listeners previos para evitar duplicados
            const oldBtn = ELEMENTS.sesionBtn;
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);

            newBtn.addEventListener('click', (e) => {
                console.log("🔥 [DEBUG] CLICK detectado en Sesiones 1-1");
                window.SESIONES.abrirModal();
            });
        }

        if (ELEMENTS.closeSesion) {
            ELEMENTS.closeSesion.addEventListener('click', () => {
                if (ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
            });
        }

        ELEMENTS.book30Btn?.addEventListener('click', () => window.SESIONES.reservar('normal30'));
        ELEMENTS.book60Btn?.addEventListener('click', () => window.SESIONES.reservar('normal60'));
        ELEMENTS.buyExtra30Btn?.addEventListener('click', () => window.SESIONES.comprarExtra('30'));
        ELEMENTS.buyExtra60Btn?.addEventListener('click', () => window.SESIONES.comprarExtra('60'));

        window.addEventListener('click', e => {
            if (ELEMENTS.sesionModal && e.target === ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
        });

        if (window.Cal) {
            const handleSuccess = (e) => {
                console.log("✅ Reserva exitosa detectada por SDK:", e);
                window.SESIONES.finalizarReservaExitosa();
            };

            // Listener Global
            window.Cal("on", { action: "bookingSuccessful", callback: handleSuccess });

            // Listener específico para el namespace (por seguridad extra)
            const namespace = "30min";
            setTimeout(() => {
                if (window.Cal.ns && window.Cal.ns[namespace]) {
                    window.Cal.ns[namespace]("on", { action: "bookingSuccessful", callback: handleSuccess });
                }
            }, 1000);
        }
    },

    finalizarReservaExitosa: () => {
        console.log("🎊 Procesando fin de reserva exitosa...");

        // 1. Mostrar mensaje de éxito
        const msg = "¡Reserva confirmada! Tu sesión con el Mentor ha sido programada correctamente. En unos segundos verás tu cuota de tiempo actualizada.";
        if (window.alertCustom) {
            window.alertCustom(msg);
        } else {
            alert(msg);
        }

        // 2. Cerrar modal y limpiar vista
        setTimeout(() => {
            if (window.ELEMENTS?.sesionModal) {
                window.ELEMENTS.sesionModal.style.display = 'none';
            }

            // 3. Forzar refresco de perfil para actualizar minutos (si el loader de main.js existe)
            if (window.userProfile && window.cargarPerfil) {
                // Obtenemos el ID del usuario actual
                const userId = window.userProfile.user_id || window.userProfile.id;
                if (userId) {
                    window.cargarPerfil({ id: userId });
                }
            }
        }, 1500);
    }
};

// Inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SESIONES.setup());
} else {
    window.SESIONES.setup();
}
