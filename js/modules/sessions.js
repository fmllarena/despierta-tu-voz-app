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
            console.log("📍 Preparando contenedor #cal-embed-container (limpieza total)");
            // Limpieza absoluta para remover cualquier loader previo
            while (calContainer.firstChild) {
                calContainer.removeChild(calContainer.firstChild);
            }

            calContainer.style.display = 'block';
            calContainer.style.visibility = 'visible';
            calContainer.style.opacity = '1';
            calContainer.style.minHeight = '600px';
            calContainer.style.background = '#f9f9f9';
            calContainer.style.border = "1px solid #eee";

            // Añadir un pequeño mensaje de "Cargando..." que se sobreescribirá
            const tempLoader = document.createElement('div');
            tempLoader.id = 'cal-loading-placeholder';
            tempLoader.style.padding = '40px';
            tempLoader.style.textAlign = 'center';
            tempLoader.innerHTML = `<p>Preparando el calendario del Mentor...</p><br><p style="font-size: 0.8em; opacity: 0.6;">Si no aparece en unos segundos, <a href="${url}" target="_blank" style="color: #3a506b; text-decoration: underline;">haz click aquí para abrir en ventana nueva</a>.</p>`;
            calContainer.appendChild(tempLoader);
        } else {
            console.error("❌ No se encontró el contenedor #cal-embed-container");
            const finalUrl = `${url}?email=${encodeURIComponent(profile?.email || "")}&name=${encodeURIComponent(profile?.nombre || "")}`;
            window.open(finalUrl, '_blank');
            return;
        }

        // 3. Inicializar Cal.com
        if (window.Cal) {
            console.log(`🚀 Inicializando Cal.com inline para: ${calLink}`);
            setTimeout(() => {
                try {
                    // El SDK de Cal.com suele inyectar un iframe. 
                    // Si el placeholder sigue ahí después de un tiempo, algo falló.
                    window.Cal("inline", {
                        elementOrSelector: "#cal-embed-container",
                        calLink: calLink,
                        config: {
                            name: profile?.nombre || "",
                            email: profile?.email || "",
                            notes: "Reserva desde la App Despierta Tu Voz",
                            theme: "light",
                            metadata: { userId: profile?.user_id }
                        }
                    });

                    window.Cal("ui", {
                        styles: { branding: { brandColor: "#3a506b" } },
                        hideEventTypeDetails: false,
                        layout: "month_view"
                    });

                    console.log("✅ Cal(\"inline\") invocado. Vigilando inyección...");

                    // Verificación post-inyección: si después de 2s no hay iframe, mostrar botón directo
                    setTimeout(() => {
                        const iframe = calContainer.querySelector('iframe');
                        if (!iframe) {
                            console.warn("⚠️ No se detectó iframe de Cal.com tras 2 segundos.");
                            const placeholder = document.getElementById('cal-loading-placeholder');
                            if (placeholder) {
                                placeholder.innerHTML = `<p>El calendario está tardando más de lo habitual...</p><br><a href="${url}" target="_blank" class="chat-btn" style="display:inline-block; padding: 10px 20px;">Abrir Calendario Directamente</a>`;
                            }
                        } else {
                            // Si hay iframe, quitar el placeholder de carga
                            const placeholder = document.getElementById('cal-loading-placeholder');
                            if (placeholder) placeholder.style.display = 'none';
                        }
                    }, 2000);

                } catch (err) {
                    console.error("❌ Error al invocar Cal(\"inline\"): ", err);
                    calContainer.innerHTML = `<p style="padding: 20px; text-align: center;">Error al cargar el calendario. <br><a href="${url}" target="_blank" class="chat-btn">Abrir en ventana nueva</a></p>`;
                }
            }, 300);
        } else {
            console.error("❌ Cal.com SDK no detectado");
            // Fallback backup
            const finalUrl = `${url}?email=${encodeURIComponent(profile?.email || "")}&name=${encodeURIComponent(profile?.nombre || "")}`;
            window.open(finalUrl, '_blank');
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

// Inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SESIONES.setup());
} else {
    window.SESIONES.setup();
}
