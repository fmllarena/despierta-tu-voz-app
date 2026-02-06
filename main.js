// --- CONFIGURACIÓN Y ESTADO (Versión 5.4 - Fix Alerts) ---
let supabase;
let userProfile = null;
let chatHistory = [];
let isRecoveringPassword = false;

const MENSAJE_BIENVENIDA = `<p>Hola, ¡qué alegría que estés aquí! Soy tu Mentor Vocal.</p><br><p>Mi misión es acompañarte a descubrir todo el potencial de tu voz, desde la técnica hasta lo que sientes al cantar. Para empezar con buen pie... ¿hay algo específico que te haya traído hoy aquí o algún bloqueo que te gustaría trabajar conmigo?</p>`;

const AUDIOS_BOTIQUIN = [
    { id: 'relajacion432', title: 'Relajación 432Hz', file: 'assets/audios/relajacion432.mp3', desc: 'Frecuencia de la naturaleza para calma profunda.' },
    { id: 'relajacion528', title: 'Relajación 528Hz', file: 'assets/audios/relajacion528.mp3', desc: 'Frecuencia de la transformación y reparación (ADN).' },
    { id: 'relajacion-animacion', title: 'Relajarse y animarse', file: 'assets/audios/relajacion-animacion.mp3', desc: 'Equilibrio entre calma y energía.' }
];

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
let blogLibrary = [];
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
const ELEMENTS = {
    chatBox: document.getElementById('chatBox'),
    chatInput: document.getElementById('chatMentoriaInput'),
    sendBtn: document.getElementById('sendBtn'),
    micBtn: document.getElementById('micBtn'),
    authOverlay: document.getElementById('authOverlay'),
    authError: document.getElementById('authError'),
    mainHelpBtn: document.getElementById('mainHelpBtn'),
    mainHelpTooltip: document.getElementById('mainHelpTooltip'),
    headerButtons: document.querySelector('.header-buttons'),
    navButtons: {
        inspiracion: document.getElementById('inspiracionBtn'),
        viaje: document.getElementById('viajeBtn'),
        progreso: document.getElementById('progresoBtn'),
        botiquin: document.getElementById('botiquinBtn'),
        logout: document.getElementById('logoutBtn')
    },
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    resetPasswordContainer: document.getElementById('resetPasswordContainer'),
    updatePasswordBtn: document.getElementById('updatePasswordBtn'),
    upgradeBtn: document.getElementById('upgradeBtn'),
    whatsappReportBtn: document.getElementById('whatsappReportBtn'),
    upgradeModal: document.getElementById('upgradeModal'),
    closeUpgrade: document.querySelector('.close-upgrade'),
    sesionBtn: document.getElementById('sesionBtn'),
    sesionModal: document.getElementById('sesionModal'),
    closeSesion: document.querySelector('.close-sesion'),
    sessionQuotaInfo: document.getElementById('sessionQuotaInfo'),
    book30Btn: document.getElementById('book30Btn'),
    book60Btn: document.getElementById('book60Btn'),
    buyExtra30Btn: document.getElementById('buyExtra30Btn'),
    buyExtra60Btn: document.getElementById('buyExtra60Btn'),
    ajustesBtn: document.getElementById('ajustesBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.querySelector('.close-settings'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    settingsUserName: document.getElementById('settingsUserName'),
    settingsUserTier: document.getElementById('settingsUserTier'),
    focusSlider: document.getElementById('focusSlider'),
    personalitySlider: document.getElementById('personalitySlider'),
    lengthSlider: document.getElementById('lengthSlider'),
    languageSelect: document.getElementById('languageSelect'),
    weeklyGoalInput: document.getElementById('weeklyGoalInput'),
    upgradeSettingsBtn: document.getElementById('upgradeSettingsBtn'),
    // Legal Modal
    legalModal: document.getElementById('legalModal'),
    checkTerms: document.getElementById('checkTerms'),
    checkMedical: document.getElementById('checkMedical'),
    confirmLegalBtn: document.getElementById('confirmLegalBtn'),
    cancelLegalBtn: document.getElementById('cancelLegalBtn'),
    // Soporte Híbrido
    supportBubble: document.getElementById('supportBubble'),
    supportModal: document.getElementById('supportModal'),
    supportChatBox: document.getElementById('supportChatBox'),
    supportInput: document.getElementById('supportInput'),
    sendSupportBtn: document.getElementById('sendSupportBtn'),
    whatsappSupportLink: document.getElementById('whatsappSupportLink'),
    closeSupport: document.querySelector('.close-support'),
    // Modal de Inspiración
    inspiracionModal: document.getElementById('inspiracionModal'),
    inspiracionFrase: document.querySelector('.inspiracion-frase'),
    inspiracionAutor: document.querySelector('.inspiracion-autor'),
    closeInspiracion: document.getElementById('closeInspiracion'),
    // Botiquín Modal
    botiquinModal: document.getElementById('botiquinModal'),
    botiquinContent: document.getElementById('botiquinContent'),
    closeBotiquin: document.querySelector('.close-botiquin'),
    // Preferencias Modal
    openPreferencesBtn: document.getElementById('openPreferencesBtn'),
    preferencesModal: document.getElementById('preferencesModal'),
    closePreferences: document.querySelector('.close-preferences'),
    marketingToggle: document.getElementById('marketingToggle'),
    lifecycleToggle: document.getElementById('lifecycleToggle'),
    savePreferencesBtn: document.getElementById('savePreferencesBtn'),
    prefStatusMessage: document.getElementById('prefStatusMessage'),
    deleteAccountBtn: document.getElementById('deleteAccountBtn'),
    // Alert Custom
    customAlert: document.getElementById('customAlert'),
    alertMessage: document.getElementById('alertMessage'),
    alertConfirmBtn: document.getElementById('alertConfirmBtn'),
    promoTermsBox: document.getElementById('promoTermsBox')
};

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

const SOPORTE = {
    history: [],
    isOpen: false,

    abrir: function () {
        ELEMENTS.supportModal.style.display = 'flex';
        this.isOpen = true;
    },

    cerrar: function () {
        ELEMENTS.supportModal.style.display = 'none';
        this.isOpen = false;
    },

    enviar: async function () {
        const text = ELEMENTS.supportInput.value.trim();
        if (!text) return;

        // Limpiar input
        ELEMENTS.supportInput.value = "";

        // Añadir a UI
        this.appendMessage(text, 'user');

        // Preparar historial para Gemini
        this.history.push({ role: 'user', parts: [{ text: text }] });

        // Crear contenedor de "escribiendo"
        const typingId = 'ia-typing-' + Date.now();
        this.appendMessage("...", 'ia', typingId);

        try {
            const respuesta = await llamarGemini(text, this.history, 'support_chat', {
                userId: userProfile?.user_id
            });

            // Reemplazar "escribiendo" con la respuesta real
            const typingEl = document.getElementById(typingId);
            if (typingEl) {
                typingEl.innerHTML = marked.parse(respuesta);
                typingEl.classList.remove('typing');
            }

            this.history.push({ role: 'model', parts: [{ text: respuesta }] });

            // Mostrar el link de WhatsApp si el historial es largo o la IA detecta necesidad
            if (this.history.length > 4 || respuesta.toLowerCase().includes("whatsapp") || respuesta.toLowerCase().includes("persona")) {
                ELEMENTS.whatsappSupportLink.style.display = 'block';
            }

        } catch (e) {
            console.error("Error soporte:", e);
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.innerText = "Lo siento, he tenido un pequeño nudo en mi proceso. ¿Podrías intentar contactarme por WhatsApp directamente?";
            ELEMENTS.whatsappSupportLink.style.display = 'block';
        }
    },

    appendMessage: function (text, role, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        if (id) msgDiv.id = id;
        if (text === "...") msgDiv.classList.add('typing');

        msgDiv.innerHTML = role === 'ia' ? (text === "..." ? text : marked.parse(text)) : text;

        ELEMENTS.supportChatBox.appendChild(msgDiv);
        ELEMENTS.supportChatBox.scrollTop = ELEMENTS.supportChatBox.scrollHeight;
    }
};

// Listeners Soporte
ELEMENTS.supportBubble?.addEventListener('click', () => SOPORTE.abrir());
ELEMENTS.closeSupport?.addEventListener('click', () => SOPORTE.cerrar());
ELEMENTS.sendSupportBtn?.addEventListener('click', () => SOPORTE.enviar());
ELEMENTS.supportInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') SOPORTE.enviar();
});

async function llamarGemini(message, history, intent, extraData = {}, onChunk = null) {
    try {
        const stream = !!onChunk;
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history, intent, stream, ...extraData })
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
    if (supabase) return; // Evitar múltiples instancias
    console.log("🔍 Iniciando inicialización de Supabase...");
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
            supabase = window.supabase.createClient(config.url, config.key);
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
    supabase.auth.onAuthStateChange((event, session) => {
        console.log("🔐 Evento Auth:", event, "Session:", session?.user?.email);
        const user = session?.user;

        if (event === 'PASSWORD_RECOVERY') {
            isRecoveringPassword = true;
            ELEMENTS.authOverlay.style.display = 'flex';
            ELEMENTS.resetPasswordContainer.style.display = 'block';
            ELEMENTS.authError.innerText = "Modo recuperación: Introduce tu nueva contraseña.";
            // Ocultar campos normales de auth para que no confundan
            document.querySelectorAll('#authOverlay input:not(#newPassword), #authOverlay .auth-buttons, #authOverlay .auth-extra')
                .forEach(el => el.style.display = 'none');
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
            console.log("🛠️ Detectada cuenta sin resumen pero con historial. Reparando perfil...");
            MODULOS.generarYGuardarResumen();
        }

        // Saludar siempre al iniciar sesión para empezar con un chat limpio y el mensaje de bienvenida
        saludarUsuario(user, perfil);

        // --- VERIFICACIÓN DE EMAIL ---
        // Mostrar banner si es usuario FREE no verificado
        EMAIL_VERIFICATION.show(perfil);

        // --- TOUR DE BIENVENIDA ---
        // Pequeño delay para asegurar que el DOM está listo
        setTimeout(() => TOUR.start(), 1000);
    } catch (e) {
        console.error("Error crítico en cargarPerfil:", e);
    }
}

async function cargarHistorialDesdeDB(userId) {
    try {
        const { data: mensajes, error } = await supabase
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

        ELEMENTS.chatBox.innerHTML = "";
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
    const isVisible = user ? 'block' : 'none';
    const isFlex = user ? 'flex' : 'none';

    ELEMENTS.authOverlay.style.display = (user && !isRecoveringPassword) ? 'none' : 'flex';
    if (ELEMENTS.headerButtons) ELEMENTS.headerButtons.style.display = isFlex;
    if (ELEMENTS.mainHelpBtn) ELEMENTS.mainHelpBtn.style.display = isFlex;

    Object.values(ELEMENTS.navButtons).forEach(btn => {
        if (btn) btn.style.display = isVisible;
    });

    if (user) {
        if (!isRecoveringPassword) {
            ELEMENTS.authOverlay.style.display = 'none';
        }

        // El perfil puede tardar un poco en cargar, usamos el tier del perfil si existe
        const tier = (userProfile?.subscription_tier || 'free').toLowerCase().trim();
        console.log("🛠️ Debug UI - User:", user.email, "Tier Detectado:", tier);

        if (tier === 'premium' || tier === 'transforma') {
            if (ELEMENTS.upgradeBtn) ELEMENTS.upgradeBtn.style.display = 'none';
            if (ELEMENTS.sesionBtn) ELEMENTS.sesionBtn.style.display = 'flex'; // Usar flex si es icon-nav-btn
            console.log("✅ Mostrando botón de sesiones (Premium)");
        } else if (tier === 'pro' || tier === 'profundiza' || tier === 'miembro promo inicial') {
            if (ELEMENTS.upgradeBtn) {
                ELEMENTS.upgradeBtn.title = "Mejorar a Transforma";
                ELEMENTS.upgradeBtn.style.display = 'flex';
            }
            if (ELEMENTS.sesionBtn) ELEMENTS.sesionBtn.style.display = 'flex';
            console.log("✅ Mostrando botón de sesiones (Pro/Promo)");
        } else {
            if (ELEMENTS.upgradeBtn) {
                ELEMENTS.upgradeBtn.title = "Mejorar Plan";
                ELEMENTS.upgradeBtn.style.display = 'flex';
            }
            if (ELEMENTS.sesionBtn) ELEMENTS.sesionBtn.style.display = 'none';
            console.log("ℹ️ Escondiendo botón de sesiones (Free)");
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

const authActions = {
    async signUp() {
        const nombre = document.getElementById('authName').value;
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        if (!email || !password || !nombre) {
            ELEMENTS.authError.style.color = "red";
            return ELEMENTS.authError.innerText = "Completa todos los campos.";
        }

        const signUpBtn = document.getElementById('signUpBtn');
        const loginBtn = document.getElementById('loginBtn');
        signUpBtn.disabled = true;
        loginBtn.disabled = true;
        signUpBtn.innerText = "Registrando...";
        ELEMENTS.authError.innerText = "";

        try {
            if (!supabase) await inicializarSupabase();
            if (!supabase) {
                const specError = window.supabaseInitError ? `: ${window.supabaseInitError}` : "";
                throw new Error("No se pudo conectar con el servidor" + specError + ". Por favor, recarga la página.");
            }

            console.log("Iniciando registro para:", email, "con nombre:", nombre);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nombre: nombre },
                    emailRedirectTo: window.location.origin + '/index.html'
                }
            });

            if (error) throw error;

            if (data?.user) {
                // Verificar si el usuario ya existe (identities vacío = ya registrado)
                if (data.user.identities && data.user.identities.length === 0) {
                    throw new Error("Este correo ya está registrado. Por favor, inicia sesión.");
                }

                console.log("Registro exitoso. Disparando email de bienvenida...");

                // Disparar email de bienvenida/verificación de forma asíncrona (no bloqueante para la UI)
                fetch('/api/send-verification-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: data.user.id,
                        email: email,
                        nombre: nombre
                    })
                }).catch(err => console.error("Error disparando bienvenida:", err));

                ELEMENTS.authError.style.color = "#2ecc71"; // Verde esmeralda
                ELEMENTS.authError.innerText = "¡Registro exitoso! Ya puedes iniciar sesión. Revisa tu bandeja de entrada (o spam) para confirmar tu cuenta y recibir tu bienvenida.";

                // Limpiar campos
                document.getElementById('authPassword').value = "";
            }
        } catch (error) {
            console.error("Error en registro:", error);
            ELEMENTS.authError.style.color = "red";
            ELEMENTS.authError.innerText = "Error: " + error.message;
        } finally {
            signUpBtn.disabled = false;
            loginBtn.disabled = false;
            signUpBtn.innerText = "Registrarme";
        }
    },
    async login() {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        if (!email || !password) {
            ELEMENTS.authError.style.color = "red";
            return ELEMENTS.authError.innerText = "Completa los campos.";
        }

        const loginBtn = document.getElementById('loginBtn');
        const signUpBtn = document.getElementById('signUpBtn');
        loginBtn.disabled = true;
        signUpBtn.disabled = true;
        loginBtn.innerText = "Entrando...";
        ELEMENTS.authError.innerText = "";

        try {
            if (!supabase) await inicializarSupabase();
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error) {
            console.error("Error en login:", error);
            ELEMENTS.authError.style.color = "red";
            ELEMENTS.authError.innerText = "Error: " + error.message;
        } finally {
            loginBtn.disabled = false;
            signUpBtn.disabled = false;
            loginBtn.innerText = "Entrar";
        }
    },
    async resetPassword() {
        const email = document.getElementById('authEmail').value;
        if (!email) return ELEMENTS.authError.innerText = "Introduce tu email primero.";

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/index.html'
        });
        if (error) ELEMENTS.authError.innerText = "Error: " + error.message;
        else alert("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    },
    async updatePassword() {
        const newPassword = document.getElementById('newPassword').value;
        if (!newPassword) return alert("Introduce la nueva contraseña.");

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) alert("Error actualizando: " + error.message);
        else {
            alert("Contraseña actualizada con éxito.");
            isRecoveringPassword = false;
            location.reload();
        }
    }
};

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

    ELEMENTS.chatInput.value = '';
    ELEMENTS.chatInput.style.height = 'auto'; // Reset height after sending
    ELEMENTS.chatInput.disabled = true;
    ELEMENTS.sendBtn.disabled = true;

    // --- ESTADO PENSANDO ---
    const thinkingId = 'msg-thinking-' + Date.now();
    appendMessage("...", 'ia thinking', thinkingId);

    try {
        ['msg-botiquin', 'msg-bienvenida'].forEach(id => document.getElementById(id)?.remove());

        const { data: { user } } = await supabase.auth.getUser();
        const extraData = {
            userId: user?.id,
            originPost: sessionStorage.getItem('dtv_origin_post'),
            originCat: sessionStorage.getItem('dtv_origin_cat'),
            canRecommend: canAIRecommend(),
            blogLibrary: blogLibrary
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
            const resEl = document.getElementById(responseId);
            if (resEl) {
                resEl.innerHTML = window.marked ? window.marked.parse(responseText + " ▮") : responseText;
                resEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        });

        const finalEl = document.getElementById(responseId);
        if (finalEl) finalEl.innerHTML = window.marked ? window.marked.parse(responseText) : responseText;

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log(`Intentando guardar mensaje de ${emisor}...`);
        const payload = {
            texto: texto,
            emisor: emisor,
            alumno: user.id
        };

        if (customDate) payload.created_at = customDate;

        const { error } = await supabase.from('mensajes').insert(payload);

        if (error) {
            console.error("Error Supabase (insert):", error);
        } else {
            console.log("Mensaje guardado correctamente.");
            // --- ACTUALIZAR ACTIVIDAD PARA EMAIL DE INACTIVIDAD ---
            await supabase
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
        if (!supabase || !userProfile) {
            alertCustom("Inicia sesión para descargar tu conversación.");
            return;
        }

        console.log("📥 Generando documento de la sesión actual...");

        // 1. Buscamos el último resumen_diario o crónica para saber dónde empieza "hoy"
        const { data: ultimoResumen } = await supabase
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
        const { data: mensajes, error } = await supabase
            .from('mensajes')
            .select('created_at, texto, emisor')
            .eq('alumno', userProfile.user_id)
            .gt('created_at', fechaInicioBusqueda)
            .order('created_at', { ascending: true });

        if (error) throw error;

        let mensajesFinales = mensajes;
        if (!mensajesFinales || mensajesFinales.length === 0) {
            const { data: backupMsgs } = await supabase
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
        const logoUrl = window.location.origin + "/assets/logo-appDTV2.png"; // Corrected path
        let htmlBody = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Bitácora de Alquimia Vocal</title>
                <style>
                    body { font-family: 'Georgia', serif; color: #333; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #8e7d6d; padding-bottom: 20px; }
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
                <div class='header'>
                    <img src='${logoUrl}' class='logo' alt='Logo DTV'>
                    <h1 class='title'>Bitácora de Alquimia Vocal</h1>
                    <p class='subtitle'>El viaje hacia tu propia voz</p>
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
            const labelText = isMentor ? '🤖 MENTOR VOCAL' : `👤 ${userProfile.nombre?.toUpperCase() || 'ALUMNO'}`;

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

        // 4. Crear el Blob y descargar
        const blob = new Blob(['\ufeff', htmlBody], { type: 'application/msword' });
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

function appendMessage(text, type, id = null) {
    if (!ELEMENTS.chatBox) return;
    const div = document.createElement('div');
    div.className = `message ${type}`;
    // Si no es IA, asignamos el ID directamente al div
    if (!type.startsWith('ia') && id) div.id = id;

    if (type.startsWith('ia')) {
        div.innerHTML = window.marked ? window.marked.parse(text) : text;

        if (type !== 'ia-botiquin' && (text.includes("cerrar sesión") || text.includes("encuentro de hoy quede guardado"))) {
            // Contenedor para los botones de acción final
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
            downloadBtn.onclick = () => exportarChatDoc();
            actionContainer.appendChild(downloadBtn);

            // Botón: Guardar y Cerrar Sesión
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'chat-logout-btn';
            logoutBtn.innerHTML = '✨ Guardar y Cerrar Sesión';
            logoutBtn.onclick = () => {
                logoutBtn.innerHTML = '⌛ Guardando...';
                logoutBtn.disabled = true;
                ELEMENTS.navButtons.logout.click();
            };
            actionContainer.appendChild(logoutBtn);

            div.appendChild(actionContainer);
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

        // El ID debe ir en el div del mensaje para que el stream lo encuentre y no borre el avatar
        if (id) div.id = id;

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
            const msgGuardada = document.getElementById('msg-sesion-guardada');
            if (msgGuardada) {
                const logoutRealBtn = document.createElement('button');
                logoutRealBtn.className = 'chat-logout-btn';
                logoutRealBtn.innerHTML = '🚪 Cerrar sesión y salir';
                logoutRealBtn.onclick = async () => {
                    logoutRealBtn.innerHTML = '⌛ Cerrando...';
                    logoutRealBtn.disabled = true;
                    await supabase.auth.signOut();
                    location.reload();
                };
                msgGuardada.appendChild(logoutRealBtn);
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
            const { data: { user } } = await supabase.auth.getUser();
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
                    <select id="freqSelector" class="audio-select" onchange="if(currentAudio) { currentAudio.pause(); currentAudio=null; if(currentAudioBtn) currentAudioBtn.innerHTML='▶'; }">
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
        const { data: { user } } = await supabase.auth.getUser();
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
            const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
            perfil = data;
        }

        let frase, autor;
        const tier = perfil?.subscription_tier || 'free';

        if (tier === 'free') {
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

                const respuesta = await llamarGemini(prompt, [], "inspiracion_dia", { userId: user.id });
                frase = respuesta.trim().replace(/^["']|["']$/g, '');
                autor = `Tu Mentor, para ${nombre}`;
            } catch (e) {
                console.error("Error frases:", e);
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
        const { data: { user } } = await supabase.auth.getUser();
        const { data: perfil } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
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
        if (!supabase || chatHistory.length < 2) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
            console.log("🪄 [Proactivo] Generando resumen de perfil y transmutación...");
            const prompt = `Analiza profundamente nuestra conversación y el progreso del alumno. Genera un JSON con este formato: {"resumen":"resumen técnico de los últimos avances","creencias":"creencias limitantes detectadas o trabajadas hoy","historia_vocal":"actualización de su pasado vocal si ha revelado algo","nivel_alquimia":1-10,"creencias_transmutadas":"logros y transmutaciones conseguidas"}. Responde SOLO el JSON puramente.`;
            const raw = await llamarGemini(prompt, chatHistory, "mentor_chat", { userId: user.id });
            const data = JSON.parse(raw.replace(/```json|```/g, "").trim());

            const { error } = await supabase.from('user_profiles').update({
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

        const { data: { user } } = await supabase.auth.getUser();
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
        const { data: { user } } = await supabase.auth.getUser();
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

const AJUSTES = {
    abrirModal: async () => {
        if (!userProfile) {
            console.log("Perfil no cargado, intentando recuperar...");
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await cargarPerfil(user);
            } else {
                alert("Debes iniciar sesión para ver los ajustes.");
                return;
            }
        }

        if (!userProfile) {
            alert("No se pudo cargar tu perfil. Por favor, recarga la página.");
            return;
        }

        ELEMENTS.settingsUserName.innerText = userProfile.nombre || "Usuario";

        const TIER_NAMES = {
            'free': 'Explora',
            'pro': 'Profundiza',
            'premium': 'Transforma'
        };
        const tier = userProfile.subscription_tier || 'free';
        ELEMENTS.settingsUserTier.innerText = `PLAN ${TIER_NAMES[tier] || tier.toUpperCase()}`;

        // Cargar valores actuales tal cual están en la DB
        ELEMENTS.focusSlider.value = userProfile.mentor_focus ?? 5;
        ELEMENTS.personalitySlider.value = userProfile.mentor_personality ?? 5;
        ELEMENTS.lengthSlider.value = userProfile.mentor_length ?? 5;

        ELEMENTS.languageSelect.value = userProfile.mentor_language || 'es';
        ELEMENTS.weeklyGoalInput.value = userProfile.weekly_goal || '';

        ELEMENTS.settingsModal.style.display = 'flex';
    },

    cerrarModal: () => {
        ELEMENTS.settingsModal.style.display = 'none';
    },

    guardarAjustes: async () => {
        const btn = ELEMENTS.saveSettingsBtn;
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión.");

            const updates = {
                mentor_focus: parseInt(ELEMENTS.focusSlider.value),
                mentor_personality: parseInt(ELEMENTS.personalitySlider.value),
                mentor_length: parseInt(ELEMENTS.lengthSlider.value),
                mentor_language: ELEMENTS.languageSelect.value,
                weekly_goal: ELEMENTS.weeklyGoalInput.value.trim()
            };

            const { data: updatedProfile, error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            // Actualizar perfil local obligatoriamente con la respuesta del servidor
            if (updatedProfile) {
                userProfile = updatedProfile;
                window.userProfile = updatedProfile;
            }

            console.log("✅ Ajustes guardados y perfil local sincronizado:", updates);
            alertCustom("Ajustes guardados correctamente.");
            AJUSTES.cerrarModal();
        } catch (e) {
            console.error("Error guardando ajustes:", e);
            alertCustom("Error al guardar: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Guardar Cambios";
        }
    },

    borrarHistorial: async () => {
        if (!confirm("¿Estás seguro de que quieres borrar todo el historial de chat? Esta acción no se puede deshacer.")) return;

        const btn = ELEMENTS.clearHistoryBtn;
        btn.disabled = true;
        btn.innerText = "Borrando...";

        try {
            const { error } = await supabase
                .from('mensajes')
                .delete()
                .eq('alumno', userProfile.user_id);

            if (error) throw error;

            chatHistory = [];
            ELEMENTS.chatBox.innerHTML = "";
            saludarUsuario({ id: userProfile.user_id, email: userProfile.email }, userProfile);

            alert("Historial borrado correctamente.");
        } catch (e) {
            console.error("Error borrando historial:", e);
            alert("Error: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Borrar Historial de Chat";
        }
    }
};

// --- MODAL LEGAL ---

const LEGAL = {
    pendingPlan: null,

    abrirModal: (planType) => {
        LEGAL.pendingPlan = planType;
        if (ELEMENTS.legalModal) ELEMENTS.legalModal.style.display = 'flex';

        // Mostrar caja de promo solo si hay un código activo en la sesión
        if (ELEMENTS.promoTermsBox) {
            const activePromo = sessionStorage.getItem('dtv_promo_code');
            ELEMENTS.promoTermsBox.style.display = (activePromo === 'PROMO1MES') ? 'block' : 'none';
        }

        // Reset checkboxes
        if (ELEMENTS.checkTerms) ELEMENTS.checkTerms.checked = false;
        if (ELEMENTS.checkMedical) ELEMENTS.checkMedical.checked = false;
        if (ELEMENTS.confirmLegalBtn) ELEMENTS.confirmLegalBtn.disabled = true;
    },

    cerrarModal: () => {
        if (ELEMENTS.legalModal) ELEMENTS.legalModal.style.display = 'none';
        LEGAL.pendingPlan = null;
    },

    validarChecks: () => {
        const bothChecked = ELEMENTS.checkTerms?.checked && ELEMENTS.checkMedical?.checked;
        if (ELEMENTS.confirmLegalBtn) ELEMENTS.confirmLegalBtn.disabled = !bothChecked;
    },

    confirmarYContinuar: async () => {
        const btn = ELEMENTS.confirmLegalBtn;
        if (!btn) return;
        btn.disabled = true;
        btn.innerText = "Registrando...";

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Actualizar en base de datos
            const { error } = await supabase
                .from('user_profiles')
                .update({ accepted_terms: true })
                .eq('user_id', user.id);

            if (error) throw error;

            // Actualizar perfil local
            if (userProfile) userProfile.accepted_terms = true;

            // Cerrar modal
            LEGAL.cerrarModal();

            // Continuar con el pago que quedó pendiente
            if (LEGAL.pendingPlan && window.ejecutarPagoPostLegal) {
                window.ejecutarPagoPostLegal(LEGAL.pendingPlan);
            }

        } catch (e) {
            console.error("Error al aceptar términos:", e);
            alert("Hubo un error al registrar tu aceptación. Inténtalo de nuevo.");
            btn.disabled = false;
            btn.innerText = "Confirmar y Continuar";
        }
    }
};

// Listeners para el Modal Legal
ELEMENTS.checkTerms?.addEventListener('change', LEGAL.validarChecks);
ELEMENTS.checkMedical?.addEventListener('change', LEGAL.validarChecks);
ELEMENTS.cancelLegalBtn?.addEventListener('click', LEGAL.cerrarModal);
ELEMENTS.confirmLegalBtn?.addEventListener('click', LEGAL.confirmarYContinuar);

// Hacer accesible para stripe-checkout.js
window.mostrarModalLegal = LEGAL.abrirModal;
// Getter para que stripe-checkout.js vea el estado actual
window.getAcceptedTermsStatus = () => userProfile?.accepted_terms || false;

// --- PREFERENCIAS DE EMAIL Y CUENTA ---

const PREFERENCIAS = {
    abrirModal: () => {
        if (!userProfile) return alert("Inicia sesión para gestionar tus preferencias.");

        // Cargar estado actual
        ELEMENTS.marketingToggle.checked = userProfile.consent_marketing !== false;
        ELEMENTS.lifecycleToggle.checked = userProfile.consent_lifecycle !== false;
        ELEMENTS.prefStatusMessage.style.display = 'none';

        ELEMENTS.preferencesModal.style.display = 'flex';
    },

    cerrarModal: () => {
        ELEMENTS.preferencesModal.style.display = 'none';
    },

    guardar: async () => {
        const btn = ELEMENTS.savePreferencesBtn;
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            const updates = {
                consent_marketing: ELEMENTS.marketingToggle.checked,
                consent_lifecycle: ELEMENTS.lifecycleToggle.checked,
                last_active_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', userProfile.user_id);

            if (error) throw error;

            Object.assign(userProfile, updates);
            PREFERENCIAS.showStatus("Preferencias guardadas. ✨", "success");
            setTimeout(() => PREFERENCIAS.cerrarModal(), 1500);
        } catch (e) {
            console.error(e);
            PREFERENCIAS.showStatus("Error al guardar.", "error");
        } finally {
            btn.disabled = false;
            btn.innerText = "Guardar Preferencias";
        }
    },

    showStatus: (text, type) => {
        const msg = ELEMENTS.prefStatusMessage;
        msg.innerText = text;
        msg.className = type === 'success' ? 'status-success' : 'status-error';
        msg.style.display = 'block';
    },

    borrarCuenta: async () => {
        const confirmDelete = confirm("¿Estás COMPLETAMENTE seguro? Esta acción es IRREVERSIBLE, se borrarán todos tus datos y progreso para siempre. 🌿");
        if (!confirmDelete) return;

        ELEMENTS.deleteAccountBtn.disabled = true;
        PREFERENCIAS.showStatus("Procesando baja definitiva...", "success");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { error } = await supabase.functions.invoke('delete-user-account', {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (error) throw error;

            PREFERENCIAS.showStatus("Cuenta eliminada. Te deseamos lo mejor. ✨", "success");
            setTimeout(async () => {
                await supabase.auth.signOut();
                location.reload();
            }, 3000);
        } catch (e) {
            console.error(e);
            PREFERENCIAS.showStatus("Error en la eliminación. Contacta con soporte.", "error");
            ELEMENTS.deleteAccountBtn.disabled = false;
        }
    }
};

// Event Listeners Preferencias
ELEMENTS.openPreferencesBtn?.addEventListener('click', () => PREFERENCIAS.abrirModal());
ELEMENTS.closePreferences?.addEventListener('click', () => PREFERENCIAS.cerrarModal());
ELEMENTS.savePreferencesBtn?.addEventListener('click', () => PREFERENCIAS.guardar());
ELEMENTS.deleteAccountBtn?.addEventListener('click', () => PREFERENCIAS.borrarCuenta());

// Event Listeners Ajustes
ELEMENTS.ajustesBtn?.addEventListener('click', () => AJUSTES.abrirModal());
ELEMENTS.closeSettings?.addEventListener('click', () => AJUSTES.cerrarModal());
ELEMENTS.saveSettingsBtn?.addEventListener('click', () => AJUSTES.guardarAjustes());
ELEMENTS.clearHistoryBtn?.addEventListener('click', () => AJUSTES.borrarHistorial());
ELEMENTS.upgradeSettingsBtn?.addEventListener('click', () => {
    AJUSTES.cerrarModal();
    ELEMENTS.upgradeModal.style.display = 'flex';
});

// --- VOZ Y VIAJE ---

const VOICE = {
    recognition: null,
    audioActual: null,
    setup() {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech || !ELEMENTS.micBtn) return ELEMENTS.micBtn && (ELEMENTS.micBtn.style.display = 'none');

        this.recognition = new Speech();
        this.recognition.lang = 'es-ES';
        ELEMENTS.micBtn.addEventListener('click', () => {
            try { this.recognition.start(); ELEMENTS.micBtn.style.backgroundColor = "#ffcccc"; } catch (e) { console.error(e); }
        });

        this.recognition.onresult = e => {
            ELEMENTS.chatInput.value = e.results[0][0].transcript;
            ELEMENTS.micBtn.style.backgroundColor = "";
            sendMessage();
        };
        this.recognition.onerror = () => { ELEMENTS.micBtn.style.backgroundColor = ""; alert("¿Micro?"); };
        this.recognition.onend = () => ELEMENTS.micBtn.style.backgroundColor = "";
    }
};

VOICE.setup();

async function hablarTexto(texto, btn) {
    if (VOICE.audioActual && !VOICE.audioActual.paused) {
        VOICE.audioActual.pause();
        VOICE.audioActual = null;
        btn.innerHTML = '🔊 Oír Mentor';
        return;
    }

    btn.innerHTML = '⏳...';
    btn.disabled = true;

    try {
        const textoLimpio = texto.replace(/#|\*|_|\[|\]|\(|\)/g, "").trim();
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textoLimpio, voiceName: 'es-ES-Chirp3-HD-Aoede' })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const audioBlob = b64toBlob(data.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        VOICE.audioActual = new Audio(audioUrl);

        VOICE.audioActual.onplay = () => { btn.innerHTML = '⏸ Detener'; btn.disabled = false; };
        VOICE.audioActual.onended = () => { btn.innerHTML = '🔊 Oír Mentor'; URL.revokeObjectURL(audioUrl); VOICE.audioActual = null; };
        VOICE.audioActual.play();
    } catch (e) {
        console.error(e);
        btn.innerHTML = '🔊 Oír Mentor';
        btn.disabled = false;
    }
}

function b64toBlob(b64, type = '', sliceSize = 512) {
    const byteChars = atob(b64);
    const byteArrays = [];
    for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
        const slice = byteChars.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type });
}

// Event Listeners
ELEMENTS.navButtons.botiquin?.addEventListener('click', () => MODULOS.abrirBotiquin());
ELEMENTS.closeBotiquin?.addEventListener('click', () => ELEMENTS.botiquinModal.style.display = 'none');
ELEMENTS.navButtons.inspiracion?.addEventListener('click', () => MODULOS.mostrarInspiracion());
ELEMENTS.navButtons.progreso?.addEventListener('click', () => MODULOS.toggleProgreso());
ELEMENTS.navButtons.viaje?.addEventListener('click', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ELEMENTS.authOverlay.style.display = 'flex';
    document.getElementById('viajeModal').style.display = 'flex';
    try {
        const { initJourney } = await import(`./mi_viaje/main.js?v=${Date.now()}`);
        initJourney(supabase, user);
    } catch (e) { console.error(e); }
});

// --- SESIONES 1/1 (CAL.COM) ---

const SESIONES = {
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
        // o si permites comprar extra a un free, el planKey debe existir en Stripe
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
    }
};

// Event Listeners Sesiones
ELEMENTS.sesionBtn?.addEventListener('click', () => SESIONES.abrirModal());
ELEMENTS.closeSesion?.addEventListener('click', () => ELEMENTS.sesionModal.style.display = 'none');
ELEMENTS.closeInspiracion?.addEventListener('click', () => ELEMENTS.inspiracionModal.style.display = 'none');
ELEMENTS.book30Btn?.addEventListener('click', () => SESIONES.reservar('normal30'));
ELEMENTS.book60Btn?.addEventListener('click', () => SESIONES.reservar('normal60'));
ELEMENTS.buyExtra30Btn?.addEventListener('click', () => SESIONES.comprarExtra('30'));
ELEMENTS.buyExtra60Btn?.addEventListener('click', () => SESIONES.comprarExtra('60'));

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

// --- INICIALIZACIÓN Y ESTADOS DE PAGO ---
async function checkPaymentStatus() {
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
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await cargarPerfil(user);
        } else if (isExtraSession) {
            // Caso Sesión Extra (Pago único) - Abrir Cal.com automáticamente
            const duracion = planType.includes('30') ? '30' : '60';
            const tier = planType.includes('premium') ? 'premium' : 'pro';

            // Determinar el enlace correcto de Cal.com
            let calLink = '';
            if (duracion === '30') {
                calLink = SESIONES.links.normal30;
            } else {
                calLink = SESIONES.links.normal60;
            }

            // Construir URL con datos del usuario
            const finalUrl = `${calLink}?email=${encodeURIComponent(userProfile.email)}&name=${encodeURIComponent(userProfile.nombre || "")}`;

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

        // Esperar un momento para que la UI esté lista
        setTimeout(() => {
            const upgradeModal = document.getElementById('upgradeModal');
            if (upgradeModal) {
                upgradeModal.style.display = 'flex';
                console.log(`🔔 Abriendo modal de upgrade automáticamente (plan: ${autoUpgrade})`);
            }
        }, 1000);
    }
}

const TOUR = {
    currentStep: 0,
    isActive: false,
    elements: null,
    steps: [
        {
            target: null,
            title: "¡Bienvenido/a!",
            text: "Soy tu Mentor Vocal. Vamos a realizar un breve recorrido para que sepas cómo puedo acompañarte en tu transformación."
        },
        {
            target: "#viajeBtn",
            title: "Tu Hoja de Ruta",
            text: "Aquí encontrarás los 5 Módulos de Sanación Vocal. Es el corazón de tu proceso de desbloqueo y crecimiento."
        },
        {
            target: "#progresoBtn",
            title: "Tu Evolución",
            text: "En este apartado registro tus hitos, cambios emocionales y el progreso técnico que vamos logrando juntos."
        },
        {
            target: "#botiquinBtn",
            title: "S.O.S Vocal",
            text: "¿Nervios antes de cantar o un bloqueo repentino? Pulsa aquí para recibir calma y pautas inmediatas."
        },
        {
            target: "#sesionBtn",
            title: "Tutorías Privadas",
            text: "Gestiona aquí tus encuentros personales 1/1 conmigo para profundizar en tu voz y mentalidad."
        },
        {
            target: "#upgradeBtn",
            title: "Mejorar Plan",
            text: "Sube de nivel para desbloquear la memoria profunda ilimitada y funciones exclusivas de acompañamiento."
        },
        {
            target: "#ajustesBtn",
            title: "A tu Medida",
            text: "Cambia mi idioma, ajusta mi personalidad (más técnico o motivador) y define tus objetivos semanales."
        },
        {
            target: "#mainHelpBtn",
            title: "Guía Rápida",
            text: "Si alguna vez olvidas para qué sirve un icono, esta señal te mostrará un resumen visual de cada función."
        },
        {
            target: "#chatMentoriaInput",
            title: "Caja de Chat",
            text: "Escríbeme aquí tus dudas, sensaciones tras ensayar o simplemente cómo te sientes hoy. ¡Estoy aquí para ti!"
        },
        {
            target: "#micBtn",
            title: "Habla conmigo",
            text: "Si no te apetece escribir, pulsa el micro y transcribiré tus palabras para que nuestra charla sea más fluida."
        },
        {
            target: "#logoutBtn",
            title: "Guardar y Salir",
            text: "<strong>MUY IMPORTANTE</strong>: Cierra sesión siempre aquí para que pueda procesar y guardar todo nuestro avance."
        }
    ],

    init() {
        if (localStorage.getItem('dtv_tour_seen') === 'true') return;

        // Crear elementos del DOM si no existen
        if (!document.getElementById('dtvTourOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'dtvTourOverlay';
            overlay.className = 'dtv-tour-overlay';

            overlay.innerHTML = `
                <div id="dtvTourSpotlight" class="dtv-tour-spotlight"></div>
                <div id="dtvTourBubble" class="dtv-tour-bubble">
                    <div class="dtv-tour-content">
                        <h4 id="dtvTourTitle"></h4>
                        <p id="dtvTourText"></p>
                    </div>
                    <div class="dtv-tour-footer">
                        <span id="dtvTourProgress" class="dtv-tour-progress"></span>
                        <div class="dtv-tour-nav">
                            <button id="dtvTourPrev" class="dtv-tour-btn btn-prev">Ant.</button>
                            <button id="dtvTourNext" class="dtv-tour-btn btn-next">Sig.</button>
                        </div>
                    </div>
                    <a id="dtvTourSkip" class="dtv-tour-skip">Saltar tutorial</a>
                </div>
            `;
            document.body.appendChild(overlay);

            // Listeners
            document.getElementById('dtvTourNext').addEventListener('click', () => this.next());
            document.getElementById('dtvTourPrev').addEventListener('click', () => this.prev());
            document.getElementById('dtvTourSkip').addEventListener('click', () => this.end());
            window.addEventListener('resize', () => { if (this.isActive) this.render(); });
        }

        this.elements = {
            overlay: document.getElementById('dtvTourOverlay'),
            spotlight: document.getElementById('dtvTourSpotlight'),
            bubble: document.getElementById('dtvTourBubble'),
            title: document.getElementById('dtvTourTitle'),
            text: document.getElementById('dtvTourText'),
            progress: document.getElementById('dtvTourProgress'),
            btnPrev: document.getElementById('dtvTourPrev'),
            btnNext: document.getElementById('dtvTourNext')
        };
    },

    start() {
        this.init();
        if (localStorage.getItem('dtv_tour_seen') === 'true') return;

        console.log("🚀 Iniciando Tour de Bienvenida...");
        this.isActive = true;
        this.elements.overlay.classList.add('active');
        this.currentStep = 0;
        this.render();
    },

    render() {
        const step = this.steps[this.currentStep];
        const targetEl = step.target ? document.querySelector(step.target) : null;

        // Si el target existe pero no es visible, saltar al siguiente (o anterior si venimos de atrás)
        if (step.target && (!targetEl || targetEl.offsetParent === null)) {
            console.log(`Paso ${this.currentStep} saltado (elemento oculto)`);
            if (this.currentStep > 0 && this._direction === 'prev') {
                this.prev();
            } else {
                this.next();
            }
            return;
        }

        // Actualizar contenido
        this.elements.title.innerText = step.title;
        this.elements.text.innerHTML = step.text;

        // El paso 0 no cuenta en el total de 10 pasos para el texto (X/10)
        const displayIndex = this.currentStep;
        const totalSteps = this.steps.length - 1;
        this.elements.progress.innerText = displayIndex === 0 ? "" : `${displayIndex} / ${totalSteps}`;

        // Botones
        this.elements.btnPrev.style.display = this.currentStep === 0 ? 'none' : 'block';
        this.elements.btnNext.innerText = this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Siguiente';

        // Posicionar Spotlight
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const padding = 5;
            this.elements.spotlight.style.width = `${rect.width + padding * 2}px`;
            this.elements.spotlight.style.height = `${rect.height + padding * 2}px`;
            this.elements.spotlight.style.top = `${rect.top - padding}px`;
            this.elements.spotlight.style.left = `${rect.left - padding}px`;
            this.elements.spotlight.style.opacity = "1";
            this.elements.bubble.classList.remove('centered');
            this.positionBubble(rect);
        } else {
            // Paso central (Bienvenida)
            this.elements.spotlight.style.width = "0";
            this.elements.spotlight.style.height = "0";
            this.elements.spotlight.style.top = "50%";
            this.elements.spotlight.style.left = "50%";
            this.elements.spotlight.style.opacity = "0";
            this.elements.bubble.classList.add('centered');
            this.elements.bubble.style.top = "50%";
            this.elements.bubble.style.left = "50%";
        }

        this.elements.bubble.classList.add('active');
    },

    positionBubble(targetRect) {
        const bubble = this.elements.bubble;
        const bubbleWidth = bubble.offsetWidth || 300;
        const bubbleHeight = bubble.offsetHeight || 150;
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        let top, left;
        bubble.className = 'dtv-tour-bubble active'; // Reset arrows

        // Estrategia: intentar debajo, si no arriba, si no a los lados
        if (targetRect.bottom + bubbleHeight + 20 < viewHeight) {
            // Debajo
            top = targetRect.bottom + 20;
            left = Math.max(10, Math.min(viewWidth - bubbleWidth - 10, targetRect.left + targetRect.width / 2 - bubbleWidth / 2));
            bubble.classList.add('arrow-top');
        } else if (targetRect.top - bubbleHeight - 20 > 0) {
            // Arriba
            top = targetRect.top - bubbleHeight - 20;
            left = Math.max(10, Math.min(viewWidth - bubbleWidth - 10, targetRect.left + targetRect.width / 2 - bubbleWidth / 2));
            bubble.classList.add('arrow-bottom');
        } else {
            // Fallback: Centro si no hay espacio
            top = viewHeight / 2 - bubbleHeight / 2;
            left = viewWidth / 2 - bubbleWidth / 2;
        }

        bubble.style.top = `${top}px`;
        bubble.style.left = `${left}px`;
    },

    next() {
        this._direction = 'next';
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.render();
        } else {
            this.end();
        }
    },

    prev() {
        this._direction = 'prev';
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    },

    end() {
        this.isActive = false;
        this.elements.overlay.classList.remove('active');
        localStorage.setItem('dtv_tour_seen', 'true');
        console.log("Tour finalizado.");

        // Disparar saludo inicial si es necesario
        if (typeof saludarUsuario === 'function' && userProfile) {
            // saludarUsuario(supabase.auth.user(), userProfile);
        }
    }
};

// Ejecutamos la comprobación al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPaymentStatus);
} else {
    checkPaymentStatus();
}

// --- VERIFICACIÓN DE EMAIL ---
const EMAIL_VERIFICATION = {
    banner: document.getElementById('emailVerificationBanner'),
    resendBtn: document.getElementById('resendVerificationBtn'),
    closeBtn: document.getElementById('closeVerificationBanner'),

    init() {
        // Listeners
        this.resendBtn?.addEventListener('click', () => this.resendEmail());
        this.closeBtn?.addEventListener('click', () => this.closeBanner());

        // Verificar parámetros de URL (resultado de verificación)
        this.checkVerificationStatus();
    },

    async show(userProfile) {
        // Solo mostrar para usuarios FREE no verificados
        if (!userProfile) return;

        const isFree = userProfile.subscription_tier === 'free';
        const isVerified = !!userProfile.email_confirmado_at; // Usar columna existente
        const bannerDismissed = sessionStorage.getItem('email_banner_dismissed');

        if (isFree && !isVerified && !bannerDismissed && this.banner) {
            this.banner.style.display = 'block';
        }
    },

    closeBanner() {
        if (this.banner) {
            this.banner.style.display = 'none';
            sessionStorage.setItem('email_banner_dismissed', 'true');
        }
    },

    async resendEmail() {
        if (!userProfile) return;

        this.resendBtn.disabled = true;
        this.resendBtn.innerText = 'Enviando...';

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const response = await fetch('/api/send-verification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    nombre: userProfile.nombre || user.email.split('@')[0]
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.resendBtn.innerText = '✓ Enviado';
                setTimeout(() => {
                    this.resendBtn.innerText = 'Reenviar email';
                    this.resendBtn.disabled = false;
                }, 3000);
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error reenviando email:', error);
            this.resendBtn.innerText = 'Error. Intenta de nuevo';
            setTimeout(() => {
                this.resendBtn.innerText = 'Reenviar email';
                this.resendBtn.disabled = false;
            }, 3000);
        }
    },

    checkVerificationStatus() {
        const params = new URLSearchParams(window.location.search);
        const verification = params.get('verification');

        if (verification) {
            let message = '';
            switch (verification) {
                case 'success':
                    message = '✅ ¡Email verificado con éxito! Ya tienes acceso completo.';
                    this.closeBanner();
                    break;
                case 'already_verified':
                    message = 'Tu email ya estaba verificado.';
                    this.closeBanner();
                    break;
                case 'expired':
                    message = '⚠️ El link de verificación ha expirado. Solicita uno nuevo.';
                    break;
                case 'invalid_token':
                    message = '❌ Link de verificación inválido.';
                    break;
                case 'error':
                    message = '❌ Error al verificar el email. Inténtalo de nuevo.';
                    break;
            }

            if (message) {
                setTimeout(() => {
                    appendMessage(message, 'ia');
                }, 1000);

                // Limpiar parámetro de URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
};

// Inicializar verificación de email
EMAIL_VERIFICATION.init();

// --- SISTEMA DE REPRODUCCIÓN AUDIO BOTIQUÍN ---
let currentAudio = null;
let currentAudioBtn = null;

function reproducirAudioBotiquin(file, btn) {
    const loopBtn = btn.parentElement.querySelector('.audio-loop-btn');
    const isLooping = loopBtn ? loopBtn.classList.contains('active') : true;

    // Usamos el nombre del archivo para la comparación, evitando problemas con rutas relativas/absolutas
    const fileName = file.split('/').pop();
    if (currentAudio && currentAudio.src.includes(fileName)) {
        if (currentAudio.paused) {
            currentAudio.loop = isLooping;
            currentAudio.play().catch(e => console.error("Error play:", e));
            btn.innerHTML = '⏸';
        } else {
            currentAudio.pause();
            btn.innerHTML = '▶';
        }
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        if (currentAudioBtn) currentAudioBtn.innerHTML = '▶';
    }

    console.log("🔊 Intentando reproducir:", file);
    currentAudio = new Audio(file);
    currentAudio.loop = isLooping;
    currentAudioBtn = btn;

    currentAudio.play()
        .then(() => {
            btn.innerHTML = '⏸';
        })
        .catch(err => {
            console.error("Error reproduciendo archivo:", err);
            btn.innerHTML = '❌';
            setTimeout(() => btn.innerHTML = '▶', 2000);
        });

    currentAudio.onended = () => {
        if (!currentAudio.loop) {
            btn.innerHTML = '▶';
            currentAudio = null;
            currentAudioBtn = null;
        }
    };

    currentAudio.onerror = (e) => {
        console.error("Error cargando audio:", e);
        btn.innerHTML = '⚠️';
    };
}

// Exportar al ámbito global para poder ser llamadas desde onclick
window.reproducirAudioBotiquin = reproducirAudioBotiquin;
window.toggleLoop = toggleLoop;


function toggleLoop(btn) {
    btn.classList.toggle('active');
    if (currentAudio && currentAudioBtn === btn.parentElement.querySelector('.audio-play-btn')) {
        currentAudio.loop = btn.classList.contains('active');
    }
}
