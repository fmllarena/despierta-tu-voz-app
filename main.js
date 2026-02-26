// --- MANEJO DE ERRORES GLOBAL ---
window.onerror = function (msg, url, lineNo, columnNo, error) {
    alert("Error de JS: " + msg + "\nLínea: " + lineNo + "\nArchivo: " + url);
    return false;
};


// Variables globales movidas a config.js


// --- FILTRO DE PRUDENCIA: Sesiones y Tiempo ---
if (!sessionStorage.getItem('dtv_session_start')) {
    sessionStorage.setItem('dtv_session_start', Date.now());
}

// Contar sesiones totales (persistente)
let dtvSessions = parseInt(localStorage.getItem('dtv_total_sessions') || '0');
if (!sessionStorage.getItem('dtv_session_counted')) {
    dtvSessions++;
    localStorage.setItem('dtv_total_sessions', dtvSessions);
    sessionStorage.setItem('dtv_session_counted', 'true');
}

function canAIRecommend() {
    const sessionStart = parseInt(sessionStorage.getItem('dtv_session_start'));
    const minutesElapsed = (Date.now() - sessionStart) / 60000;
    const totalSessions = parseInt(localStorage.getItem('dtv_total_sessions') || '1');

    // Filtro: > 30 minutos O > 3 sesiones
    return minutesElapsed >= 30 || totalSessions >= 3;
}

// Cargar biblioteca de artículos
// blogLibrary movido a config.js

async function loadBlogLibrary() {
    try {
        // Silenciamos el error CORS manejándolo internamente sin warnings
        const response = await fetch('https://despiertatuvoz.com/wp-content/themes/dtv-theme/biblioteca-blog.json', { mode: 'no-cors' });
        // Con 'no-cors' no podemos leer el body, pero evitamos el error fatal en consola
        // Si necesitamos los datos, el servidor debe permitir CORS.
        if (response.ok) {
            blogLibrary = await response.json();
            console.log("📚 Biblioteca de blog cargada.");
        }
    } catch (e) {
        // Silencio absoluto para no ensuciar consola
    }
}
loadBlogLibrary();

// Detectar contexto de origen desde el blog (URL params)
const urlParams = new URLSearchParams(window.location.search);
const fromPost = urlParams.get('from_post');
const fromCat = urlParams.get('cat');

if (fromPost) {
    sessionStorage.setItem('dtv_origin_post', decodeURIComponent(fromPost));
}
if (fromCat) {
    sessionStorage.setItem('dtv_origin_cat', decodeURIComponent(fromCat));
}

// Detectar promo o campaña de Brevo para guardar en sesión
let urlPromo = urlParams.get('promo');
const urlSource = urlParams.get('utm_source');
if (!urlPromo && urlSource === 'brevo') {
    urlPromo = 'PROMO1MES';
}
if (urlPromo) {
    sessionStorage.setItem('dtv_promo_code', urlPromo);
}

// Detectar parámetro upgrade (desde email de fin de trial)
const urlUpgrade = urlParams.get('upgrade');
if (urlUpgrade) {
    sessionStorage.setItem('dtv_auto_upgrade', urlUpgrade); // 'pro' o 'premium'
}

// Detectar éxito de reserva Cal.com (redirección)
if (urlParams.get('booking') === 'success') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (window.SESIONES?.finalizarReservaExitosa) {
                window.SESIONES.finalizarReservaExitosa();
            }
        }, 2000);
    });
}

// Objeto ELEMENTS movido a elements.js


// --- UTILIDAD DE ALERTA PERSONALIZADA ---
window.alertCustom = function (mensaje) {
    if (!ELEMENTS.customAlert || !ELEMENTS.alertMessage) {
        console.warn("CustomAlert no encontrado, usando alert nativo.");
        alert(mensaje);
        return;
    }
    ELEMENTS.alertMessage.innerText = mensaje;
    ELEMENTS.customAlert.style.display = 'flex';
};

// Cerrar alerta con el botón
ELEMENTS.alertConfirmBtn?.addEventListener('click', () => {
    ELEMENTS.customAlert.style.display = 'none';
});
// Cerrar alerta al hacer clic fuera
window.addEventListener('click', e => {
    if (e.target === ELEMENTS.customAlert) ELEMENTS.customAlert.style.display = 'none';
});

// --- SOPORTE HÍBRIDO ---
// Movido a js/modules/support.js

async function llamarGemini(message, history, intent, extraData = {}, onChunk = null) {
    try {
        const stream = !!onChunk;
        const body = { message, history, intent, stream, ...extraData };

        // Soporte para archivos Multi-modal
        if (extraData.fileData) {
            body.fileData = extraData.fileData;
        }

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (stream) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.error) throw new Error(data.error);
                            if (data.text) {
                                fullText += data.text;
                                if (onChunk) onChunk(data.text, fullText);
                            }
                        } catch (e) {
                            if (e.message.includes("Error técnico")) throw e;
                        }
                    }
                }
            }
            return fullText;
        } else {
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data.text;
        }
    } catch (e) {
        console.error("Error en llamarGemini:", e);
        throw e;
    }
}

async function inicializarSupabase() {
    if (supabaseClient) return; // Evitar múltiples instancias
    console.log("🔍 Iniciando inicialización de supabaseClient...");
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`El servidor respondió con error ${response.status} al pedir la configuración.`);
        }

        const config = await response.json();
        if (!config.url || !config.key) {
            throw new Error("Configuración incompleta: SUPABASE_URL o SUPABASE_ANON_KEY no están definidas en Vercel.");
        }

        if (window.supabase) {
            supabaseClient = window.supabase.createClient(config.url, config.key);
            console.log("✅ Supabase inicializado correctamente.");
            setupAuthListener();
        } else {
            throw new Error("La librería global de Supabase no está cargada en el navegador.");
        }
    } catch (e) {
        console.error("❌ Error inicializando Supabase:", e);
        window.supabaseInitError = e.message;
    }
}

function setupAuthListener() {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("🔐 Evento Auth:", event, "Session:", session?.user?.email);
        const user = session?.user;

        if (event === 'PASSWORD_RECOVERY') {
            isRecoveringPassword = true;
            if (ELEMENTS.authOverlay) ELEMENTS.authOverlay.style.display = 'flex';
            if (ELEMENTS.resetPasswordContainer) ELEMENTS.resetPasswordContainer.style.display = 'block';
            if (ELEMENTS.authError) ELEMENTS.authError.innerText = "Modo recuperación: Introduce tu nueva contraseña.";
            // Ocultar campos normales de auth para que no confundan
            if (ELEMENTS.loginFields) ELEMENTS.loginFields.style.display = 'none';
        }

        // Solo actuar si el usuario realmente ha cambiado para evitar borrados accidentales
        const currentUserProfileId = userProfile ? (userProfile.user_id || userProfile.id) : null;
        const newUserIsDifferent = user && (!userProfile || user.id !== currentUserProfileId);

        if (event === 'SIGNED_OUT') {
            console.log("🚪 Usuario cerró sesión.");
            userProfile = null;
            window.userProfile = null;
            isRecoveringPassword = false;
            updateUI(null);
        } else if (user && newUserIsDifferent) {
            // Solo cargamos perfil si es un usuario nuevo o diferente del actual
            console.log("✅ Nuevo usuario detectado o sesión iniciada, cargando perfil...");
            updateUI(user);
            cargarPerfil(user);
        } else if (event === 'SIGNED_IN' && user && !userProfile) {
            // Caso de login explícito cuando no había perfil cargado
            console.log("✅ SIGNED_IN detectado, procediendo con carga inicial...");
            updateUI(user);
            cargarPerfil(user);
        } else if (user) {
            // Si el usuario ya estaba cargado y es el mismo, solo nos aseguramos de que la UI sea correcta 
            // pero SIN borrar el chat (no llamamos a cargarPerfil ni saludarUsuario)
            updateUI(user);
        }
    });
}

async function cargarPerfil(user) {
    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const perfil = await response.json();

        if (perfil.error) {
            console.error("⚠️ Error cargando/creando perfil:", perfil.error);
            return;
        }

        userProfile = perfil;
        window.userProfile = perfil; // Exportar para otros módulos (Mi Viaje)
        // Asegurar que accepted_terms esté presente en el objeto local
        userProfile.accepted_terms = !!perfil.accepted_terms;

        // Actualizar cuota de sesiones si el módulo está listo
        if (window.SESIONES?.actualizarInfoCuota) {
            window.SESIONES.actualizarInfoCuota();
        }

        // --- OPTIMIZACIÓN: Calentamiento de API (Warmup) ---
        // Enviamos una señal silenciosa para que Vercel prepare la conexión
        llamarGemini("", [], "warmup", { userId: user.id }).catch(() => { });

        // Actualizar UI con el tier correcto del perfil
        updateUI(user);

        // Al cargar el perfil, recuperamos el historial para el contexto de la IA
        await cargarHistorialDesdeDB(user.id);

        // --- REPARACIÓN AUTOMÁTICA ---
        // Si el perfil está vacío pero tenemos mensajes cargados, disparamos el resumen 
        // proactivamente para "reparar" la cuenta sin esperar a un nuevo mensaje.
        if (chatHistory.length > 0 && (!perfil.ultimo_resumen || !perfil.creencias)) {
            MODULOS.generarYGuardarResumen();
        }

        // Saludar siempre al iniciar sesión para empezar con un chat limpio y el mensaje de bienvenida
        saludarUsuario(user, perfil);

        // --- VERIFICACIÓN DE EMAIL ---
        // Mostrar banner si es usuario FREE no verificado
        if (window.EMAIL_VERIFICATION) {
            window.EMAIL_VERIFICATION.show(perfil);
        }

        // --- TOUR DE BIENVENIDA ---
        // Solo lanzar para usuarios nuevos (sin historial de resumen previo)
        if (!perfil.ultimo_resumen) {
            localStorage.removeItem('dtv_tour_seen');
            // Pequeño delay para asegurar que el DOM y estilos estén listos
            setTimeout(() => {
                if (window.TOUR && typeof window.TOUR.start === 'function') {
                    window.TOUR.start();
                } else {
                    console.warn("⚠️ TOUR no inicializado o módulo no cargado.");
                }
            }, 1500);
        } else {
            // Usuario existente: marcar tour como visto para que nunca se dispare
            localStorage.setItem('dtv_tour_seen', 'true');
        }

        // --- COMPROBACIÓN DE PAGOS ---
        if (window.PAYMENTS) {
            window.PAYMENTS.checkStatus();
        }
    } catch (e) {
        console.error("Error crítico en cargarPerfil:", e);
    }
}

async function cargarHistorialDesdeDB(userId) {
    try {
        const { data: mensajes, error } = await supabaseClient
            .from('mensajes')
            .select('*')
            .eq('alumno', userId)
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) {
            console.error("Error Supabase (select):", error);
            return;
        }

        if (!mensajes || mensajes.length === 0) {
            console.log("No hay mensajes previos en 'mensajes'.");
            return;
        }

        if (ELEMENTS && ELEMENTS.chatBox) {
            ELEMENTS.chatBox.innerHTML = "";
        }
        chatHistory = [];

        // Invertimos el array para que queden en orden cronológico (el más antiguo primero)
        mensajes.reverse().forEach(msg => {
            const role = msg.emisor === 'ia' ? 'model' : 'user';
            chatHistory.push({ role: role, parts: [{ text: msg.texto }] });
        });

        // Historial recuperado para contexto de IA
    } catch (e) {
        console.error("Error crítico recuperando historial:", e);
    }
}

function updateUI(user) {
    if (!ELEMENTS) {
        console.warn("⚠️ updateUI llamada antes de cargar ELEMENTS");
        return;
    }
    const isVisible = user ? 'block' : 'none';
    const isFlex = user ? 'flex' : 'none';

    if (ELEMENTS.authOverlay) ELEMENTS.authOverlay.style.display = (user && !isRecoveringPassword) ? 'none' : 'flex';
    if (ELEMENTS.headerButtons) ELEMENTS.headerButtons.style.display = isFlex;
    if (ELEMENTS.mainHelpBtn) ELEMENTS.mainHelpBtn.style.display = isFlex;

    if (ELEMENTS && ELEMENTS.navButtons) {
        Object.values(ELEMENTS.navButtons).forEach(btn => {
            if (btn) btn.style.display = isVisible;
        });
    }

    if (user) {
        if (!isRecoveringPassword) {
            ELEMENTS.authOverlay.style.display = 'none';
        }

        // El perfil puede tardar un poco en cargar, usamos el tier del perfil si existe
        const tier = (userProfile?.subscription_tier || 'free').toLowerCase().trim();
        if (tier === 'premium' || tier === 'transforma') {
            if (ELEMENTS.upgradeBtn) ELEMENTS.upgradeBtn.style.display = 'none';
            if (ELEMENTS.sesionBtn) ELEMENTS.sesionBtn.style.display = 'flex'; // Usar flex si es icon-nav-btn
        } else if (tier === 'pro' || tier === 'profundiza' || tier === 'miembro promo inicial') {
            if (ELEMENTS.upgradeBtn) {
                ELEMENTS.upgradeBtn.title = "Mejorar a Transforma";
                ELEMENTS.upgradeBtn.style.display = 'flex';
            }
            if (ELEMENTS.sesionBtn) ELEMENTS.sesionBtn.style.display = 'flex';
        } else {
            if (ELEMENTS.upgradeBtn) {
                ELEMENTS.upgradeBtn.title = "Mejorar Plan";
                ELEMENTS.upgradeBtn.style.display = 'flex';
            }
            if (ELEMENTS.sesionBtn) ELEMENTS.sesionBtn.style.display = 'none';
        }
        if (ELEMENTS.ajustesBtn) ELEMENTS.ajustesBtn.style.display = 'block';
        if (ELEMENTS.supportBubble) ELEMENTS.supportBubble.style.display = 'flex';
    } else {
        ELEMENTS.authOverlay.style.display = 'flex';
        ELEMENTS.upgradeBtn.style.display = 'none';
        ELEMENTS.sesionBtn.style.display = 'none';
        if (ELEMENTS.ajustesBtn) ELEMENTS.ajustesBtn.style.display = 'none';
        if (ELEMENTS.supportBubble) ELEMENTS.supportBubble.style.display = 'none';
    }

    if (!user) {
        ELEMENTS.chatBox.innerHTML = "";
        appendMessage(MENSAJE_BIENVENIDA, 'ia');
    }
}

function revisarRedireccion() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'required' && ELEMENTS.authOverlay) {
        ELEMENTS.authOverlay.style.display = 'flex';
    }
}

window.addEventListener('load', () => {
    inicializarSupabase();
    revisarRedireccion();

    // Botón de Ajustes — listener directo usando window.AJUSTES (módulo cargado antes que este script)
    ELEMENTS.ajustesBtn?.addEventListener('click', () => {
        if (window.AJUSTES) {
            window.AJUSTES.abrirModal();
        }
    });
});

async function saludarUsuario(user, perfil) {
    if (!ELEMENTS.chatBox) return;

    ELEMENTS.chatBox.innerHTML = "";

    // Si es la primera vez (no hay resumen previo), mostrar mensaje FIJO de bienvenida
    // Esto evita problemas con variables de nombre en el primer contacto
    if (!perfil || !perfil.ultimo_resumen) {
        appendMessage(MENSAJE_BIENVENIDA, 'ia', 'msg-bienvenida');
    } else {
        const nombre = perfil?.nombre || (user.email || "viajero/a").split('@')[0];
        const nombreCap = nombre.charAt(0).toUpperCase() + nombre.slice(1);
        appendMessage(`¡Hola, <strong>${nombreCap}</strong>! Qué alegría encontrarte de nuevo. ¿Cómo te sientes hoy?`, 'ia');
    }
}

// El objeto authActions se ha movido a js/services/auth-service.js
// para centralizar la lógica de autenticación (Email + Social)


document.getElementById('signUpBtn')?.addEventListener('click', authActions.signUp);
document.getElementById('loginBtn')?.addEventListener('click', authActions.login);
ELEMENTS.forgotPasswordLink?.addEventListener('click', (e) => {
    e.preventDefault();
    authActions.resetPassword();
});
ELEMENTS.updatePasswordBtn?.addEventListener('click', authActions.updatePassword);

// Event Toggle Password Visibility
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-target');
        const input = document.getElementById(inputId);
        const svg = btn.querySelector('svg');

        if (input.type === 'password') {
            input.type = 'text';
            // Cambiar icono a ojo tachado
            svg.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        } else {
            input.type = 'password';
            // Cambiar icono a ojo abierto
            svg.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        }
    });
});

// --- LÓGICA DE MEJORAR PLAN (UPGRADE) ---
ELEMENTS.upgradeBtn?.addEventListener('click', () => {
    if (ELEMENTS.upgradeModal) ELEMENTS.upgradeModal.style.display = 'flex';
});

ELEMENTS.closeUpgrade?.addEventListener('click', () => {
    if (ELEMENTS.upgradeModal) ELEMENTS.upgradeModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === ELEMENTS.upgradeModal) {
        ELEMENTS.upgradeModal.style.display = 'none';
    }
});

document.querySelectorAll('#authEmail, #authPassword').forEach(el => {
    el?.addEventListener('keydown', e => e.key === 'Enter' && authActions.login());
});

// --- LÓGICA DE CONTEXTO DEL ALUMNO (SUPABASE) ---

// La obtención de contexto ahora se realiza de forma segura en el servidor (api/chat.js)


async function sendMessage() {
    const text = ELEMENTS.chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    await guardarMensajeDB(text, 'user'); // Asegurar el guardado antes de continuar

    // Obtener datos de archivo si existen
    const fileData = window.FILES ? await window.FILES.getFileData() : null;
    if (fileData) {
        window.FILES.clearFile(); // Limpiar UI tras recoger los datos
    }

    ELEMENTS.chatInput.value = '';
    ELEMENTS.chatInput.style.height = 'auto'; // Reset height after sending
    ELEMENTS.chatInput.disabled = true;
    ELEMENTS.sendBtn.disabled = true;

    // --- ESTADO PENSANDO ---
    const thinkingId = 'msg-thinking-' + Date.now();
    let thinkingMsg = "Procesando respuesta...";
    if (fileData) {
        if (fileData.mimeType && fileData.mimeType.startsWith('audio')) {
            thinkingMsg = "Analizando audio y preparando respuesta...";
        } else {
            thinkingMsg = "Analizando archivo y preparando respuesta...";
        }
    }
    appendMessage(thinkingMsg, 'ia thinking', thinkingId);

    try {
        ['msg-botiquin', 'msg-bienvenida'].forEach(id => document.getElementById(id)?.remove());

        const { data: { user } } = await supabaseClient.auth.getUser();
        const extraData = {
            userId: user?.id,
            originPost: sessionStorage.getItem('dtv_origin_post'),
            originCat: sessionStorage.getItem('dtv_origin_cat'),
            canRecommend: canAIRecommend(),
            blogLibrary: blogLibrary,
            fileData: fileData // <--- CRITICAL FIX: Include the file data
        };

        // Contenedor para la respuesta progresiva
        const responseId = 'ia-response-' + Date.now();
        let responseText = "";

        await llamarGemini(text, chatHistory, "mentor_chat", extraData, (chunk, fullText) => {
            if (responseText === "") {
                document.getElementById(thinkingId)?.remove();
                appendMessage("", 'ia', responseId);
            }

            responseText = fullText;
            // Ahora el ID está en el contenedor, así que buscamos el div.message dentro
            const container = document.getElementById(responseId);
            const resEl = container?.querySelector('.message.ia');
            if (resEl) {
                let cleanDisplay = responseText.replace(/\[\s*SESION\\?_?FINAL\s*\]/gi, "").trim();

                if (window.marked) {
                    cleanDisplay = window.marked.parse(cleanDisplay + " ▮");
                }

                // Parsear tags de pronunciación (SOBRE EL HTML GENERADO POR MARKED)
                if (window.PRONUNCIATION) {
                    cleanDisplay = window.PRONUNCIATION.parseTags(cleanDisplay);
                }

                resEl.innerHTML = cleanDisplay;
            }
        });

        // Primero actualizamos el contenido final sin el cursor y SIN el tag técnico
        const finalContainer = document.getElementById(responseId);
        const finalEl = finalContainer?.querySelector('.message.ia');

        const cleanFinalText = responseText.replace(/\[\s*SESION\\?_?FINAL\s*\]/gi, "").trim();
        if (finalEl) {
            let parsedText = cleanFinalText;
            if (window.marked) {
                parsedText = window.marked.parse(parsedText);
            }
            if (window.PRONUNCIATION) {
                parsedText = window.PRONUNCIATION.parseTags(parsedText);
            }
            finalEl.innerHTML = parsedText;
        }

        sessionStorage.removeItem('dtv_origin_post');
        sessionStorage.removeItem('dtv_origin_cat');

        if (responseText && responseText.trim() !== "") {
            await guardarMensajeDB(responseText, 'ia');
            chatHistory.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: responseText }] });

            if (chatHistory.length % 4 === 0 && chatHistory.length >= 4) {
                MODULOS.generarCronicaSesion();
            }
            if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
        }

        // --- INSERTAR BOTONES SI ES DESPEDIDA (Detectando el Tag Técnico con regex flexible) ---
        const sessionFinalRegex = /\[\s*SESION\\?_?FINAL\s*\]/i;
        if (responseText && sessionFinalRegex.test(responseText)) {
            console.log("✅ [Protocolo Cierre] Tag [SESION_FINAL] detectado (vía regex). Disparando botones.");
            if (finalEl) crearBotonesAccionFinal(finalEl);
        }
    } catch (e) {
        document.getElementById(thinkingId)?.remove();
        console.error("Error en sendMessage:", e);
        appendMessage("Vaya, parece que hoy tengo un nudo en la garganta. ¿Podrías intentar decírmelo de nuevo?", 'ia');
    } finally {
        ELEMENTS.chatInput.disabled = false;
        ELEMENTS.sendBtn.disabled = false;
    }
}

async function guardarMensajeDB(texto, emisor, customDate = null) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        console.log(`Intentando guardar mensaje de ${emisor}...`);
        const payload = {
            texto: texto,
            emisor: emisor,
            alumno: user.id
        };

        if (customDate) payload.created_at = customDate;

        const { error } = await supabaseClient.from('mensajes').insert(payload);

        if (error) {
            console.error("Error Supabase (insert):", error);
        } else {
            console.log("Mensaje guardado correctamente.");
            // --- ACTUALIZAR ACTIVIDAD PARA EMAIL DE INACTIVIDAD ---
            await supabaseClient
                .from('user_profiles')
                .update({
                    last_active_at: new Date().toISOString(),
                    email_inactividad_10_enviado: false // Resetear flag si vuelve a estar activo
                })
                .eq('user_id', user.id);

            // Generar resumen proactivo si es mensaje de la IA
            if (emisor === 'ia') {
                MODULOS.generarYGuardarResumen();
            }
        }
    } catch (e) {
        console.error("Error crítico guardando mensaje:", e);
    }
}

async function exportarChatDoc() {
    try {
        if (!supabaseClient || !userProfile) {
            alertCustom("Inicia sesión para descargar tu conversación.");
            return;
        }

        console.log("📥 Generando documento de la sesión actual...");

        // 1. Buscamos el último resumen_diario o crónica para saber dónde empieza "hoy"
        const { data: ultimoResumen } = await supabaseClient
            .from('mensajes')
            .select('created_at')
            .eq('alumno', userProfile.user_id)
            .eq('emisor', 'resumen_diario')
            .order('created_at', { ascending: false })
            .limit(1);

        let fechaInicioBusqueda = "2024-01-01T00:00:00Z";
        if (ultimoResumen && ultimoResumen.length > 0) {
            fechaInicioBusqueda = ultimoResumen[0].created_at;
        }

        // 2. Obtener los mensajes posteriores a esa última crónica
        const { data: mensajes, error } = await supabaseClient
            .from('mensajes')
            .select('created_at, texto, emisor')
            .eq('alumno', userProfile.user_id)
            .gt('created_at', fechaInicioBusqueda)
            .order('created_at', { ascending: true });

        if (error) throw error;

        let mensajesFinales = mensajes;
        if (!mensajesFinales || mensajesFinales.length === 0) {
            const { data: backupMsgs } = await supabaseClient
                .from('mensajes')
                .select('created_at, texto, emisor')
                .eq('alumno', userProfile.user_id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (backupMsgs && backupMsgs.length > 0) {
                mensajesFinales = backupMsgs.reverse();
            } else {
                alertCustom("No he encontrado mensajes nuevos en esta sesión.");
                return;
            }
        }

        // 3. Crear el contenido en HTML para el .doc

        // Convertimos el logo a Base64 para que el documento sea autónomo y no pida "actualizar enlaces"
        let base64Logo = "";
        try {
            const resp = await fetch(window.location.origin + "/assets/logo-appDTV2.png");
            if (resp.ok) {
                const blob = await resp.blob();
                base64Logo = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }
        } catch (e) {
            console.error("Error convirtiendo logo a base64:", e);
        }

        const logoUrl = base64Logo || "";
        let htmlBody = `
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.5; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #8e7d6d; padding-bottom: 15px; }
                    .logo { height: 80px; margin-bottom: 10px; }
                    .title { color: #8e7d6d; font-size: 24pt; margin: 0; font-weight: normal; }
                    .subtitle { color: #666; font-size: 11pt; font-style: italic; }
                    .metadata { margin-bottom: 30px; font-size: 10pt; color: #888; text-align: right; }
                    .message-box { margin-bottom: 25px; padding: 15px; border-radius: 10px; }
                    .label { font-weight: bold; text-transform: uppercase; font-size: 9pt; letter-spacing: 1px; margin-bottom: 5px; display: block; }
                    .usuario-label { color: #2c3e50; }
                    .mentor-label { color: #8e7d6d; }
                    .time { font-weight: normal; font-size: 8pt; color: #aaa; margin-left: 10px; }
                    .content { font-size: 11pt; white-space: pre-wrap; }
                    .footer { margin-top: 50px; text-align: center; font-size: 9pt; color: #8e7d6d; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logoUrl ? `<img src="${logoUrl}" width="150" style="margin-bottom:10px;">` : ""}
                    <h1 style="color:#8e7d6d; font-size:20pt; margin:0;">Bitácora de Alquimia Vocal</h1>
                    <p style="color:#666; font-style:italic;">El viaje hacia tu propia voz</p>
                </div>

                <div class='metadata'>
                    Alumno: ${userProfile.nombre || userProfile.email}<br>
                    Fecha de la sesión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>

                <div class='messages'>
        `;

        mensajesFinales.forEach(msg => {
            if (msg.emisor === 'resumen_diario' || msg.emisor === 'sistema') return;

            const time = new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const isMentor = msg.emisor === 'ia';
            const labelClass = isMentor ? 'mentor-label' : 'usuario-label';
            const labelText = isMentor ? 'MENTOR VOCAL' : (userProfile.nombre?.toUpperCase() || 'ALUMNO');

            // Limpiar Markdown básico para el Word
            const cleanText = msg.texto.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

            htmlBody += `
                <div class='message-box'>
                    <span class='label ${labelClass}'>${labelText} <span class='time'>${time}</span></span>
                    <div class='content'>${cleanText}</div>
                </div>
            `;
        });

        htmlBody += `
                </div>
                <div class='footer'>
                    © 2026 Despierta tu Voz. Todos los derechos reservados.<br>
                    <i>"Tu voz es el espejo de tu alma."</i>
                </div>
            </body>
            </html>
        `;

        // 4. Crear el Blob y descargar (Agregamos BOM para que Word reconozca UTF-8 en Windows)
        const blob = new Blob(['\ufeff', htmlBody], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sesion_DTV_${userProfile.nombre || 'Alquimia'}_${new Date().toISOString().split('T')[0]}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("✅ Documento de sesión generado con éxito.");
    } catch (e) {
        console.error("Error al exportar DOC:", e);
        alertCustom("Hubo un error al preparar tu documento.");
    }
}

function crearBotonesAccionFinal(parentDiv) {
    console.log("🔘 [Botones] Intentando crear botones...");
    console.log("🔘 [Botones] parentDiv:", parentDiv);

    if (!parentDiv) {
        console.warn("🔘 [Botones] parentDiv es null, abortando");
        return;
    }

    // Evitar duplicados si ya existen
    if (parentDiv.querySelector('.chat-action-container')) {
        console.log("🔘 [Botones] Ya existen botones, abortando");
        return;
    }

    console.log("🔘 [Botones] Creando contenedor de botones...");
    const actionContainer = document.createElement('div');
    actionContainer.className = 'chat-action-container';
    actionContainer.style.marginTop = '15px';
    actionContainer.style.display = 'flex';
    actionContainer.style.flexDirection = 'column';
    actionContainer.style.gap = '10px';

    // Botón: Descargar Conversación
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'chat-download-btn';
    downloadBtn.innerHTML = '📥 Descargar sesión (.doc)';
    downloadBtn.onclick = (e) => {
        e.stopPropagation();
        exportarChatDoc();
    };
    actionContainer.appendChild(downloadBtn);

    // Botón: Guardar y Cerrar Sesión
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'chat-logout-btn';
    logoutBtn.innerHTML = '✨ Guardar y Cerrar Sesión';
    logoutBtn.onclick = (e) => {
        e.stopPropagation();
        logoutBtn.innerHTML = '⌛ Guardando...';
        logoutBtn.disabled = true;
        ELEMENTS.navButtons.logout.click();
    };
    actionContainer.appendChild(logoutBtn);

    parentDiv.appendChild(actionContainer);
    console.log("✅ [Botones] Botones creados y añadidos correctamente");
    console.log("🔘 [Botones] Contenedor final:", actionContainer);
}

function appendMessage(text, type, id = null) {
    if (!ELEMENTS.chatBox) return;
    const div = document.createElement('div');
    div.className = `message ${type}`;
    // Si no es IA, asignamos el ID directamente al div
    if (!type.startsWith('ia') && id) div.id = id;

    if (type.startsWith('ia')) {
        // Limpiamos siempre el tag técnico para que el usuario nunca lo vea en la interfaz (vía regex flexible)
        let cleanText = text.replace(/\[\s*SESION\\?_?FINAL\s*\]/gi, "").trim();

        if (window.marked) {
            cleanText = window.marked.parse(cleanText);
        }

        // Parsear tags de pronunciación (SOBRE EL HTML GENERADO POR MARKED)
        if (window.PRONUNCIATION) {
            cleanText = window.PRONUNCIATION.parseTags(cleanText);
        }

        div.innerHTML = cleanText;

        if (type !== 'ia-botiquin' && text !== "" && /\[\s*SESION\\?_?FINAL\s*\]/i.test(text)) {
            crearBotonesAccionFinal(div);
        }

        // Si es Botiquín o estado de carga (thinking), no ponemos avatar para limpiar la interfaz
        if (type === 'ia-botiquin' || type.includes('thinking')) {
            if (id) div.id = id;
            ELEMENTS.chatBox.appendChild(div);
            // Pequeño retardo para asegurar el scroll correcto
            setTimeout(() => {
                div.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return;
        }

        // Crear contenedor para Mensaje + Avatar (resto de mensajes IA)
        const container = document.createElement('div');
        container.className = 'ia-container';

        // IMPORTANTE: Para msg-bienvenida, el ID va en el div del mensaje (para que el CSS funcione)
        // Para otros mensajes con streaming, el ID va en el contenedor (para evitar problemas de columnas)
        if (id) {
            if (id === 'msg-bienvenida') {
                div.id = id; // ID en el mensaje para que el CSS #msg-bienvenida funcione
            } else {
                container.id = id; // ID en el contenedor para streaming
            }
        }

        const avatar = document.createElement('div');
        avatar.className = 'ia-avatar';
        avatar.innerHTML = `<img src="assets/foto-avatar.PNG" alt="Mentor">`;

        container.appendChild(avatar);
        container.appendChild(div);

        ELEMENTS.chatBox.appendChild(container);

        // Desplazar el chat
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        div.innerText = text;
        div.style.whiteSpace = "pre-wrap";
        ELEMENTS.chatBox.appendChild(div);
        ELEMENTS.chatBox.scrollTop = ELEMENTS.chatBox.scrollHeight;
    }
}

// Help Tooltip
ELEMENTS.mainHelpBtn?.addEventListener('click', e => {
    e.stopPropagation();
    ELEMENTS.mainHelpTooltip?.classList.toggle('active');
});
document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
    ELEMENTS.mainHelpTooltip?.classList.remove('active');
});
document.addEventListener('click', () => ELEMENTS.mainHelpTooltip?.classList.remove('active'));
ELEMENTS.mainHelpTooltip?.addEventListener('click', e => e.stopPropagation());

if (ELEMENTS.sendBtn) ELEMENTS.sendBtn.addEventListener('click', sendMessage);
if (ELEMENTS.chatInput) {
    ELEMENTS.chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize para el textarea (Estilo Whatsapp)
    ELEMENTS.chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        const newHeight = Math.min(this.scrollHeight, 120); // Máximo 120px (aprox 4-5 lineas)
        this.style.height = newHeight + 'px';

        // Activar scrollbar si supera el max-height
        if (this.scrollHeight > 120) {
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });

    // Ocultar botón de Asistencia cuando el usuario está escribiendo (teclado activo en móvil)
    ELEMENTS.chatInput.addEventListener('focus', () => {
        if (ELEMENTS.supportBubble) {
            ELEMENTS.supportBubble.style.opacity = '0';
            ELEMENTS.supportBubble.style.pointerEvents = 'none';
        }
    });

    // Mostrar botón de Asistencia cuando termina de escribir
    ELEMENTS.chatInput.addEventListener('blur', () => {
        if (ELEMENTS.supportBubble && ELEMENTS.supportBubble.style.display === 'flex') {
            ELEMENTS.supportBubble.style.opacity = '1';
            ELEMENTS.supportBubble.style.pointerEvents = 'auto';
        }
    });
}
if (ELEMENTS.navButtons.logout) {
    ELEMENTS.navButtons.logout.addEventListener('click', async () => {
        ELEMENTS.navButtons.logout.innerText = "Guardando...";

        // Generar crónica de la sesión si hay al menos 2 mensajes (1 intercambio)
        if (chatHistory.length >= 2) {
            console.log("📝 Generando crónica final de la sesión antes de cerrar...");
            await MODULOS.generarCronicaSesion();
        }

        // Generar resumen del perfil
        await MODULOS.generarYGuardarResumen();

        // CIERRE SUAVE: No hacer signOut ni reload
        // El chat permanece visible para consulta
        appendMessage(`✨ Sesión guardada con éxito.\n\nPuedes seguir explorando Mi Viaje, tu Diario de Alquimia, revisar esta conversación o cerrar la app cuando quieras.`, 'ia', 'msg-sesion-guardada');

        // Añadir botón de cierre real al mensaje
        setTimeout(() => {
            const containerGuardada = document.getElementById('msg-sesion-guardada');
            const msgInner = containerGuardada?.querySelector('.message.ia');
            if (msgInner) {
                // Botón: Descargar Conversación (Agregado para corregir la falta en el cierre manual)
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'chat-download-btn';
                downloadBtn.style.marginTop = '15px';
                downloadBtn.style.display = 'block';
                downloadBtn.innerHTML = '📥 Descargar sesión (.doc)';
                downloadBtn.onclick = (e) => {
                    e.stopPropagation();
                    exportarChatDoc();
                };
                msgInner.appendChild(downloadBtn);

                const logoutRealBtn = document.createElement('button');
                logoutRealBtn.className = 'chat-logout-btn';
                logoutRealBtn.style.marginTop = '10px';
                logoutRealBtn.style.display = 'block';
                logoutRealBtn.innerHTML = '🚪 Cerrar sesión y salir';
                logoutRealBtn.onclick = async () => {
                    logoutRealBtn.innerHTML = '⌛ Cerrando...';
                    logoutRealBtn.disabled = true;
                    await supabaseClient.auth.signOut();
                    location.reload();
                };
                msgInner.appendChild(logoutRealBtn);
            }
        }, 100);

        // Resetear botón
        ELEMENTS.navButtons.logout.innerText = "SALIR";
    });
}

// --- MÓDULOS ESPECÍFICOS ---

const MODULOS = {
    async abrirBotiquin() {
        const btn = ELEMENTS.navButtons.botiquin;
        btn.disabled = true;

        // Abrir modal inmediatamente con estado de carga
        ELEMENTS.botiquinModal.style.display = 'flex';
        ELEMENTS.botiquinContent.innerHTML = `
            <div class="botiquin-loading">
                <div class="ia thinking" style="padding: 15px; border-radius: 20px;">Preparando tu botiquín...</div>
            </div>
        `;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const prompt = `[MODO EMERGENCIA] Audición/presentación inminente. Basado en mi perfil, dame: 1. Ejercicio 2min, 2. Consejo técnico, 3. Frase poder. REGLA ESTRICTA: NO incluyas links a YouTube ni menciones a "cerrar sesión" o despedidas finales. Enfócate solo en la ayuda inmediata.`;

            let responseText = "";
            await llamarGemini(prompt, [], "mentor_chat", { userId: user?.id }, (chunk, fullText) => {
                responseText = fullText;
                ELEMENTS.botiquinContent.innerHTML = `
                    <div class="botiquin-response">
                        ${window.marked ? window.marked.parse(responseText + " ▮") : responseText}
                    </div>
                `;
            });

            if (responseText) {
                ELEMENTS.botiquinContent.innerHTML = `<div class="botiquin-response">${window.marked ? window.marked.parse(responseText) : responseText}</div>`;
            }

            // Añadir lista de audios al mensaje del botiquín con menú desplegable
            const audioSection = document.createElement('div');
            audioSection.className = 'botiquin-audios';
            audioSection.innerHTML = `<h4>✨ Recursos de Alquimia Sonora</h4>`;

            const audioItem = document.createElement('div');
            audioItem.className = 'audio-item-stacked';
            audioItem.innerHTML = `
                <div class="audio-info">
                    <strong>Relajación Alquímica</strong>
                    <span>Elige la frecuencia que necesites oír.</span>
                </div>
                <div class="audio-controls-stacked">
                    <select id="freqSelector" class="audio-select" onchange="if(currentAudio) { currentAudio.pause(); currentAudio=null; if(currentAudioBtn) currentAudioBtn.innerHTML='▶'; } MUSICA.actualizarUI();">
                        ${AUDIOS_BOTIQUIN.map(audio => `<option value="${audio.file}" title="${audio.desc}">${audio.title}</option>`).join('')}
                    </select>
                    <div class="audio-actions">
                        <button class="audio-loop-btn active" onclick="toggleLoop(this)" title="Repetir infinitamente">🔄</button>
                        <button class="audio-play-btn" onclick="reproducirAudioBotiquin(document.getElementById('freqSelector').value, this)">▶</button>
                    </div>
                </div>
            `;
            audioSection.appendChild(audioItem);
            ELEMENTS.botiquinContent.appendChild(audioSection);
        } catch (e) {
            console.error(e);
            ELEMENTS.botiquinContent.innerHTML = `<p class="error-msg">Error al preparar el botiquín. Inténtalo de nuevo.</p>`;
        } finally {
            btn.disabled = false;
        }
    },

    async mostrarInspiracion() {
        const btn = ELEMENTS.navButtons.inspiracion;
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        // 1. Abrir el modal inmediatamente con feedback de carga
        if (ELEMENTS.inspiracionModal) ELEMENTS.inspiracionModal.style.display = 'flex';
        if (ELEMENTS.inspiracionFrase) {
            ELEMENTS.inspiracionFrase.textContent = "Consultando a las musas...";
            ELEMENTS.inspiracionFrase.classList.add('pulse-loading');
        }
        if (ELEMENTS.inspiracionAutor) ELEMENTS.inspiracionAutor.textContent = "";

        // Feedback en el botón (opcional, ya que el modal está abierto)
        btn.disabled = true;
        btn.classList.add('loading-btn');
        const img = btn.querySelector('img');
        if (img) img.style.opacity = "0.5";

        // Intentar usar el perfil global primero para mayor velocidad
        let perfil = window.userProfile;
        if (!perfil) {
            const { data } = await supabaseClient.from('user_profiles').select('*').eq('user_id', user.id).single();
            perfil = data;
        }

        let frase, autor;
        const tier = perfil?.subscription_tier || 'free';

        console.log("🎭 [Inspiración] Tier detectado:", tier);
        console.log("🎭 [Inspiración] Perfil completo:", perfil);

        if (tier === 'free') {
            console.log("🎭 [Inspiración] Usando frases fijas para tier FREE");
            const frasesMusicos = [
                { frase: "La música puede cambiar el mundo porque puede cambiar a las personas.", autor: "Bono" },
                { frase: "La música es el lenguaje del espíritu. Abre el secreto de la vida trayendo paz, aboliendo conflictos.", autor: "Kahlil Gibran" },
                { frase: "Sin música, la vida sería un error.", autor: "Friedrich Nietzsche" },
                { frase: "La música es la aritmética de los sonidos, como la óptica es la geometría de la luz.", autor: "Claude Debussy" },
                { frase: "Donde las palabras fallan, la música habla.", autor: "Hans Christian Andersen" },
                { frase: "La música es el arte más directo, entra por el oído y va al corazón.", autor: "Magdalena Martínez" },
                { frase: "La voz humana es el instrumento más bello de todos, pero es el más difícil de tocar.", autor: "Richard Strauss" },
                { frase: "Cantar es como celebrar el oxígeno.", autor: "Björk" },
                { frase: "La música es el corazón de la vida. Por ella habla el amor; sin ella no hay bien posible y con ella todo es hermoso.", autor: "Franz Liszt" },
                { frase: "Tu voz es tu identidad. Cuídala, trabájala, y nunca dejes de creer en su poder.", autor: "Renée Fleming" },
                { frase: "Pienso que una vida dedicada a la música es una vida bellamente empleada.", autor: "Luciano Pavarotti" },
                { frase: "La música es el verdadero lenguaje universal.", autor: "Carl Maria von Weber" },
                { frase: "Cantar es rezar dos veces.", autor: "San Agustín" },
                { frase: "La música es la poesía del aire.", autor: "Jean Paul Richter" },
            ];

            const fraseAleatoria = frasesMusicos[Math.floor(Math.random() * frasesMusicos.length)];
            frase = fraseAleatoria.frase;
            autor = fraseAleatoria.autor;
        } else {
            console.log("🎭 [Inspiración] Generando frase personalizada con IA para tier:", tier);
            try {
                const nombre = perfil?.nombre || "viajero/a";
                const contexto = `
Resumen: ${perfil?.ultimo_resumen || "Iniciando transformación vocal"}
Desafíos: ${perfil?.creencias || "Trabajando en la liberación de la voz"}
Nivel: ${perfil?.nivel_alquimia || 1}/10
Logros: ${perfil?.creencias_transmutadas || "Camino de autodescubrimiento"}
                `.trim();

                const prompt = `Eres el mentor vocal de ${nombre}. Basándote en su perfil:
${contexto}

Genera UNA sola frase inspiradora (máximo 15 palabras) que conecte DIRECTAMENTE con su historia o logros. 
REGLA DE ORO: No seas genérico. Menciona algo que se parezca a lo que ha trabajado.
NO incluyas comillas. Responde solo con la frase.`;

                console.log("🎭 [Inspiración] Llamando a Gemini con prompt:", prompt);
                const respuesta = await llamarGemini(prompt, [], "inspiracion_dia", { userId: user.id });
                console.log("🎭 [Inspiración] Respuesta de Gemini:", respuesta);
                frase = respuesta.trim().replace(/^["']|["']$/g, '');
                autor = `Tu Mentor, para ${nombre}`;
            } catch (e) {
                console.error("❌ [Inspiración] Error generando frase con IA:", e);
                frase = "Tu voz es el eco de tu alma; hoy, permítele resonar con toda su verdad.";
                autor = "Tu Mentor";
            }
        }

        // Actualizar UI del modal con la frase real
        if (ELEMENTS.inspiracionFrase) {
            ELEMENTS.inspiracionFrase.textContent = frase;
            ELEMENTS.inspiracionFrase.classList.remove('pulse-loading');
        }
        if (ELEMENTS.inspiracionAutor) ELEMENTS.inspiracionAutor.textContent = `— ${autor}`;

        // Restaurar estado del botón
        btn.disabled = false;
        btn.classList.remove('loading-btn');
        if (img) img.style.opacity = "1";
    },

    async toggleProgreso() {
        ['msg-botiquin', 'msg-bienvenida'].forEach(id => document.getElementById(id)?.remove());
        const modal = document.getElementById('diarioModal');
        if (modal.style.display === 'flex') modal.style.display = 'none';
        else this.mostrarDiario(modal);
    },
    async mostrarDiario(modal) {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (!user || authError) {
            console.warn("⚠️ Usuario no autenticado al abrir diario");
            const content = document.getElementById('diarioContent');
            if (content) content.innerHTML = "<p>Debes iniciar sesión para ver tu progreso.</p>";
            modal.style.display = 'flex';
            return;
        }
        const { data: perfil } = await supabaseClient.from('user_profiles').select('*').eq('user_id', user.id).single();
        const content = document.getElementById('diarioContent');

        if (!perfil) {
            content.innerHTML = "<p>Sigue charlando conmigo para registrar tu camino.</p>";
        } else {
            const nivel = perfil.nivel_alquimia || 1;
            content.innerHTML = `
                <div class="diario-seccion">
                    <h4>Nivel de Alquimia Vocal: ${nivel}/10</h4>
                    <div class="progress-bar-container"><div class="progress-fill" style="width: ${nivel * 10}%"></div></div>
                </div>
                <div class="diario-seccion"><h4>Última Alquimia</h4><p>${perfil.ultimo_resumen || "..."}</p></div>
                <div class="diario-seccion"><h4>Logros ✨</h4><p>${perfil.creencias_transmutadas || "..."}</p></div>
                <div class="diario-seccion"><h4>Creencias</h4><p>${perfil.creencias || "..."}</p></div>
            `;
        }
        modal.style.display = 'flex';
    },
    async generarYGuardarResumen() {
        if (!supabaseClient || chatHistory.length < 2) return;
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        try {
            console.log("🪄 [Proactivo] Generando resumen de perfil y transmutación...");
            const prompt = `Analiza profundamente nuestra conversación y el progreso del alumno. Genera un JSON con este formato: {"resumen":"resumen técnico de los últimos avances","creencias":"creencias limitantes detectadas o trabajadas hoy","historia_vocal":"actualización de su pasado vocal si ha revelado algo","nivel_alquimia":1-10,"creencias_transmutadas":"logros y transmutaciones conseguidas"}. Responde SOLO el JSON puramente.`;
            const raw = await llamarGemini(prompt, chatHistory, "mentor_chat", { userId: user.id });
            const data = JSON.parse(raw.replace(/```json|```/g, "").trim());

            const { error } = await supabaseClient.from('user_profiles').update({
                ultimo_resumen: data.resumen,
                creencias: data.creencias,
                historia_vocal: data.historia_vocal,
                nivel_alquimia: data.nivel_alquimia || 1,
                creencias_transmutadas: data.creencias_transmutadas || "",
                last_active_at: new Date().toISOString()
            }).eq('user_id', user.id);

            if (error) throw error;
            console.log("✅ Perfil actualizado con éxito.");

            // Actualizar perfil local
            if (userProfile) {
                userProfile.ultimo_resumen = data.resumen;
                userProfile.creencias = data.creencias;
                userProfile.historia_vocal = data.historia_vocal;
                userProfile.nivel_alquimia = data.nivel_alquimia;
                window.userProfile = userProfile;
            }
        } catch (e) {
            console.error("Error resumen proactivo:", e);
        }
    },
    lastCronicaTime: null, // Control para evitar duplicados
    async generarCronicaSesion() {
        if (!supabase || chatHistory.length < 4) return;

        // Evitar generar múltiples crónicas en menos de 1 hora
        const now = Date.now();
        if (this.lastCronicaTime && (now - this.lastCronicaTime) < 3600000) {
            console.log("⏭️ Crónica reciente ya generada, saltando...");
            return;
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        try {
            console.log("📝 [Cronista] Sintetizando sesión para memoria a largo plazo...");
            const responseText = await llamarGemini("Genera la crónica de nuestra sesión de hoy.", chatHistory, "session_chronicle", { userId: user.id });

            if (responseText) {
                await guardarMensajeDB(responseText, 'resumen_diario');
                this.lastCronicaTime = now; // Actualizar timestamp
                console.log("✅ Crónica de Alquimia guardada en el historial.");
            }
        } catch (e) {
            console.error("Error generando crónica:", e);
        }
    },
    async sincronizarHistorialRetroactivo() {
        if (!supabase) return;
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        console.log("🚀 [Sincronizador] Iniciando escaneo de historial completo...");

        try {
            // 1. Obtener todos los mensajes
            const { data: todos, error } = await supabase
                .from('mensajes')
                .select('texto, emisor, created_at')
                .eq('alumno', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (!todos || todos.length === 0) return console.log("No hay mensajes para sincronizar.");

            // 2. Agrupar por fecha (YYYY-MM-DD)
            const grupos = {};
            todos.forEach(m => {
                const fecha = new Date(m.created_at).toISOString().split('T')[0];
                if (!grupos[fecha]) grupos[fecha] = { mensajes: [], tieneCronica: false };
                if (m.emisor === 'resumen_diario') grupos[fecha].tieneCronica = true;
                else grupos[fecha].mensajes.push(m);
            });

            // 3. Generar crónicas para los días que no tienen
            const fechasParaSincronizar = Object.keys(grupos).filter(f => !grupos[f].tieneCronica && grupos[f].mensajes.length > 2);

            console.log(`📅 Encontrados ${fechasParaSincronizar.length} días sin crónica.`);

            for (const fecha of fechasParaSincronizar) {
                console.log(`🖋️ Generando crónica para: ${fecha}...`);
                const hist = grupos[fecha].mensajes.map(m => ({
                    role: m.emisor === 'ia' ? 'model' : 'user',
                    parts: [{ text: m.texto }]
                }));

                const cronica = await llamarGemini(`Resume lo más importante de este día (${fecha}).`, hist, "session_chronicle", { userId: user.id });

                if (cronica) {
                    // Guardar al final del día (23:59)
                    const endOfDay = `${fecha}T23:59:59Z`;
                    await guardarMensajeDB(cronica, 'resumen_diario', endOfDay);
                    console.log(`✅ Crónica guardada para ${fecha}`);
                }
                // Pequeña pausa para no saturar
                await new Promise(r => setTimeout(r, 1000));
            }
            console.log("🏁 Sincronización retroactiva completada.");
        } catch (e) {
            console.error("Error en sincronización:", e);
        }
    }
};

// Exportar funciones críticas al objeto window para acceso desde otros módulos
window.generarYGuardarResumen = MODULOS.generarYGuardarResumen;
window.generarCronicaSesion = MODULOS.generarCronicaSesion;
window.sincronizarHistorialRetroactivo = MODULOS.sincronizarHistorialRetroactivo;

// Ajustes y Preferencias movidos a js/modules/settings.js

// --- VOZ Y VIAJE ---
// Movido a js/modules/voice.js

// b64toBlob movido a js/modules/voice.js o js/modules/utils.js

// Event Listeners
ELEMENTS.navButtons.botiquin?.addEventListener('click', () => MODULOS.abrirBotiquin());
ELEMENTS.closeBotiquin?.addEventListener('click', () => ELEMENTS.botiquinModal.style.display = 'none');
ELEMENTS.navButtons.inspiracion?.addEventListener('click', () => MODULOS.mostrarInspiracion());
ELEMENTS.navButtons.progreso?.addEventListener('click', () => MODULOS.toggleProgreso());
ELEMENTS.navButtons.viaje?.addEventListener('click', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return ELEMENTS.authOverlay.style.display = 'flex';
    document.getElementById('viajeModal').style.display = 'flex';
    try {
        const { initJourney } = await import(`./mi_viaje/main.js?v=${Date.now()}`);
        initJourney(supabaseClient, user);
    } catch (e) { console.error(e); }
});

// SESIONES movido a js/modules/sessions.js

window.addEventListener('click', e => {
    if (e.target === ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
    if (e.target === ELEMENTS.botiquinModal) ELEMENTS.botiquinModal.style.display = 'none';
    if (e.target === ELEMENTS.preferencesModal) ELEMENTS.preferencesModal.style.display = 'none';
    if (e.target.id === 'diarioModal') document.getElementById('diarioModal').style.display = 'none';
});

// Cerrar modales genéricos al pulsar la X
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

// checkPaymentStatus y EMAIL_VERIFICATION movidos a módulos independientes

// TOUR movido a js/modules/tour.js

// EMAIL_VERIFICATION movido a js/modules/email.js

// --- SISTEMA DE REPRODUCCIÓN AUDIO BOTIQUÍN ---
// Movido a js/modules/music.js
// --- INICIALIZACIÓN DE MÓDULOS ---
if (window.FILES) window.FILES.init();
if (window.PRONUNCIATION) window.PRONUNCIATION.init();

// --- ACCIONES RÁPIDAS (FONÉTICA) ---
if (ELEMENTS.phoneticsMenu) {
    ELEMENTS.phoneticsMenu.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            const presetText = `Dime la fonética de esta palabra en ${lang}: (escribe aquí)`;
            ELEMENTS.chatInput.value = presetText;
            ELEMENTS.chatInput.focus();

            // Posicionar cursor después del ":"
            const pos = presetText.indexOf(':') + 2;
            ELEMENTS.chatInput.setSelectionRange(pos, presetText.length);

            // Ocultar menú tras elegir (opcional, el CSS ya lo maneja por hover pero ayuda)
            ELEMENTS.phoneticsMenu.style.display = 'none';
            setTimeout(() => ELEMENTS.phoneticsMenu.style.display = '', 500);
        });
    });
}
