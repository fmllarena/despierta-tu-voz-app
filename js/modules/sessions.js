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
                        <span class="quota-value">${remaining} min</span>
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
            // Caso PRO o FREE
            if (ELEMENTS.sessionQuotaInfo) {
                ELEMENTS.sessionQuotaInfo.innerHTML = `
                    <div class="quota-badge">
                        <span class="quota-label">Tu plan actual no incluye sesiones 1/1 individuales.</span>
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
        console.log(`📅 [SESIONES] Reservando tipo: ${tipo}`);
        const url = window.SESIONES.links[tipo];

        if (!url || url === "#") {
            console.error("❌ Error: URL de sesión no definida para", tipo);
            alert("El enlace para esta sesión aún no está configurado.");
            return;
        }

        const calLink = url.replace("https://cal.com/", "");
        const selectionUI = document.getElementById('sesionSelection');
        const calContainer = document.getElementById('cal-embed-container');

        // 1. Asegurar visibilidad del modal y ocultar selección
        if (ELEMENTS && ELEMENTS.sesionModal) {
            ELEMENTS.sesionModal.style.display = 'block';
        }

        if (selectionUI) selectionUI.style.display = 'none';

        // 2. Preparar el contenedor
        if (calContainer) {
            console.log("📍 Preparando contenedor #cal-embed-container (Inyección Directa)");
            // Limpieza absoluta
            while (calContainer.firstChild) {
                calContainer.removeChild(calContainer.firstChild);
            }

            calContainer.style.display = 'block';
            calContainer.style.visibility = 'visible';
            calContainer.style.opacity = '1';
            calContainer.style.minHeight = '650px';
            calContainer.style.background = '#fff';

            // BANNER DE SEGURIDAD (Siempre visible)
            const safetyBanner = document.createElement('div');
            safetyBanner.style.padding = '12px';
            safetyBanner.style.background = '#f8fafc';
            safetyBanner.style.borderBottom = '1px solid #e2e8f0';
            safetyBanner.style.textAlign = 'center';
            safetyBanner.style.fontSize = '0.9em';
            safetyBanner.style.color = '#475569';
            safetyBanner.innerHTML = `<span>¿Problemas con el calendario? </span><a href="${url}" target="_blank" style="color: #3182ce; font-weight: bold; text-decoration: underline;">Haz click aquí para abrir en ventana nueva</a>`;
            calContainer.appendChild(safetyBanner);

            // Contenedor para el Iframe
            const iframeTarget = document.createElement('div');
            iframeTarget.id = 'cal-iframe-target';
            iframeTarget.style.width = '100%';
            iframeTarget.style.height = '600px';
            iframeTarget.style.overflow = 'hidden';
            calContainer.appendChild(iframeTarget);

            // Loader inicial
            iframeTarget.innerHTML = `
                <div style="padding: 60px; text-align: center;" id="cal-custom-loader">
                    <div class="loader-spin" style="margin: 0 auto 15px;"></div>
                    <p>Cargando calendario del Mentor...</p>
                </div>
            `;
        } else {
            console.error("❌ No se encontró el contenedor #cal-embed-container");
            window.open(url, '_blank');
            return;
        }

        // 3. Inicializar Cal.com (Estrategia Híbrida con Namespace y Defensa)
        const finalUrl = `${url}?embed=true&name=${encodeURIComponent(profile?.nombre || "")}&email=${encodeURIComponent(profile?.email || "")}`;
        const namespace = "30min";

        if (window.Cal) {
            console.log(`🚀 Intentando SDK (NS: ${namespace}) para sesión: ${tipo}`);

            // Función defensiva para configurar e inyectar
            const tryInjectWithSDK = (attempts = 0) => {
                if (attempts > 30) { // Máximo 3 segundos de espera (100ms * 30)
                    console.warn("🚨 Tiempo de espera del SDK agotado. Forzando Iframe...");
                    const target = document.getElementById('cal-iframe-target');
                    if (target) target.innerHTML = `<iframe src="${finalUrl}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>`;
                    return;
                }

                try {
                    // Si el objeto ns o el namespace no existen aún en este ciclo
                    if (!window.Cal.ns || !window.Cal.ns[namespace]) {
                        if (attempts === 0) window.Cal("init", namespace, { origin: "https://app.cal.com" });
                        setTimeout(() => tryInjectWithSDK(attempts + 1), 100);
                        return;
                    }

                    // Si llegamos aquí, window.Cal.ns[namespace] existe
                    const api = window.Cal.ns[namespace];

                    api("ui", {
                        styles: { branding: { brandColor: "#3a506b" } },
                        hideEventTypeDetails: false,
                        layout: "month_view"
                    });

                    api("inline", {
                        elementOrSelector: "#cal-iframe-target",
                        calLink: calLink,
                        config: {
                            name: profile?.nombre || "",
                            email: profile?.email || "",
                            theme: "light",
                            layout: "month_view"
                        }
                    });

                    // Si hay éxito, ocultamos el loader tras un momento
                    setTimeout(() => {
                        const loader = document.getElementById('cal-custom-loader');
                        if (loader) loader.style.display = 'none';
                    }, 2000);

                } catch (err) {
                    console.error("⚠️ Error crítico en SDK, forzando Iframe:", err);
                    const target = document.getElementById('cal-iframe-target');
                    if (target) target.innerHTML = `<iframe src="${finalUrl}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>`;
                }
            };

            // Iniciar ciclo de inyección
            tryInjectWithSDK();

        } else {
            // Sin SDK, inyección directa inmediata
            const target = document.getElementById('cal-iframe-target');
            if (target) target.innerHTML = `<iframe src="${finalUrl}" style="width:100%; height:100%; border:none;"></iframe>`;
        }
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
