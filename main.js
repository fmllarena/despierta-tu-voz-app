// --- CONFIGURACIÓN Y ESTADO ---
let supabase;
let userProfile = null;
let chatHistory = [];

const MENSAJE_BIENVENIDA = `<p>Hola, ¿qué tal? Soy tu Mentor Vocal privado.</p><br><p>Bienvenido/a a un espacio sagrado donde tu voz es el puente entre tu técnica y tu alma. 
Aquí no solo buscaremos la nota perfecta, sino que usaremos cada sonido como una llave para abrir los cerrojos de tu historia y desvelar los secretos 
que guarda tu inconsciente. Respira, confía y prepárate para transformar tu vida a través del canto. ¿Cómo te sientes al iniciar este viaje hoy?</p>`;

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
        bienvenida: document.getElementById('bienvenidaBtn'),
        viaje: document.getElementById('viajeBtn'),
        progreso: document.getElementById('progresoBtn'),
        botiquin: document.getElementById('botiquinBtn'),
        logout: document.getElementById('logoutBtn')
    },
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    resetPasswordContainer: document.getElementById('resetPasswordContainer'),
    updatePasswordBtn: document.getElementById('updatePasswordBtn'),
    upgradeBtn: document.getElementById('upgradeBtn'),
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
    notificationSelect: document.getElementById('notificationSelect')
};

async function llamarGemini(message, history, intent, context = "") {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history, intent, context })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.text;
    } catch (e) {
        console.error("Error en llamarGemini:", e);
        throw e;
    }
}

async function inicializarSupabase() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        if (window.supabase) {
            supabase = window.supabase.createClient(config.url, config.key);
            console.log("Supabase inicializado.");
            setupAuthListener();
        }
    } catch (e) {
        console.error("Error inicializando Supabase:", e);
    }
}

function setupAuthListener() {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log("Evento Auth:", event);
        const user = session?.user;

        if (event === 'PASSWORD_RECOVERY') {
            ELEMENTS.resetPasswordContainer.style.display = 'block';
            ELEMENTS.authError.innerText = "Modo recuperación: Introduce tu nueva contraseña.";
        }

        // Solo actuar si el usuario realmente ha cambiado para evitar borrados accidentales
        const userWasLoggedIn = !!userProfile;
        const userIsLoggedIn = !!user;

        if (event === 'SIGNED_OUT') {
            userProfile = null;
            updateUI(null);
        } else if (user && !userWasLoggedIn) {
            updateUI(user);
            cargarPerfil(user);
        }
    });
}

async function cargarPerfil(user) {
    let { data: perfil } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!perfil) {
        console.error("⚠️ Perfil no encontrado.");
        return;
    }

    userProfile = perfil;
    window.userProfile = perfil;

    // Actualizar UI con el tier correcto del perfil
    updateUI(user);

    // Al cargar el perfil, recuperamos el historial para el contexto de la IA
    await cargarHistorialDesdeDB(user.id);

    // Saludar siempre al iniciar sesión para empezar con un chat limpio y el mensaje de bienvenida
    saludarUsuario(user, perfil);
}

async function cargarHistorialDesdeDB(userId) {
    try {
        console.log("Intentando recuperar historial para:", userId);
        const { data: mensajes, error } = await supabase
            .from('mensajes')
            .select('*')
            .eq('alumno', userId)
            .order('created_at', { ascending: true })
            .limit(30);

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

        mensajes.forEach(msg => {
            // No añadimos los mensajes al UI (ChatBox) para empezar cada sesión limpios
            // Pero sí los añadimos al chatHistory para que la IA tenga contexto
            const role = msg.emisor === 'ia' ? 'model' : 'user';
            chatHistory.push({ role: role, parts: [{ text: msg.texto }] });
        });

        console.log(`Historial recuperado con éxito: ${mensajes.length} mensajes.`);
    } catch (e) {
        console.error("Error crítico recuperando historial:", e);
    }
}

function updateUI(user) {
    const isVisible = user ? 'block' : 'none';
    const isFlex = user ? 'flex' : 'none';

    ELEMENTS.authOverlay.style.display = user ? 'none' : 'flex';
    if (ELEMENTS.headerButtons) ELEMENTS.headerButtons.style.display = isFlex;
    if (ELEMENTS.mainHelpBtn) ELEMENTS.mainHelpBtn.style.display = isFlex;

    Object.values(ELEMENTS.navButtons).forEach(btn => {
        if (btn) btn.style.display = isVisible;
    });

    if (user) {
        ELEMENTS.authOverlay.style.display = 'none';

        // El perfil puede tardar un poco en cargar, usamos el tier del perfil si existe
        const tier = userProfile?.subscription_tier || 'free';
        console.log("Actualizando UI para Tier:", tier);

        if (tier === 'premium') {
            ELEMENTS.upgradeBtn.style.display = 'none';
            ELEMENTS.sesionBtn.style.display = 'block';
        } else if (tier === 'pro') {
            ELEMENTS.upgradeBtn.innerText = "Mejorar a Transforma";
            ELEMENTS.upgradeBtn.style.display = 'block';
            ELEMENTS.sesionBtn.style.display = 'block'; // Pro también puede ver Sesiones (para extras)
        } else {
            ELEMENTS.upgradeBtn.innerText = "Mejorar Plan";
            ELEMENTS.upgradeBtn.style.display = 'block';
            ELEMENTS.sesionBtn.style.display = 'none';
        }
        if (ELEMENTS.ajustesBtn) ELEMENTS.ajustesBtn.style.display = 'block';
    } else {
        ELEMENTS.authOverlay.style.display = 'flex';
        ELEMENTS.upgradeBtn.style.display = 'none';
        ELEMENTS.sesionBtn.style.display = 'none';
        if (ELEMENTS.ajustesBtn) ELEMENTS.ajustesBtn.style.display = 'none';
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
        if (!email || !password || !nombre) return ELEMENTS.authError.innerText = "Completa todos los campos.";

        console.log("Iniciando registro para:", email, "con nombre:", nombre);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre: nombre }
            }
        });
        console.log("Respuesta de Auth:", { data, error });
        if (error) {
            ELEMENTS.authError.innerText = "Error: " + error.message;
        } else {
            if (data?.user) {
                console.log("Registro exitoso. El trigger de base de datos creará el perfil.");
            }
            alert("Registro exitoso. Revisa tu correo para confirmar la cuenta.");
        }
    },
    async login() {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        if (!email || !password) return ELEMENTS.authError.innerText = "Completa los campos.";

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) ELEMENTS.authError.innerText = "Error: " + error.message;
    },
    async resetPassword() {
        const email = document.getElementById('authEmail').value;
        if (!email) return ELEMENTS.authError.innerText = "Introduce tu email primero.";

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
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
            ELEMENTS.resetPasswordContainer.style.display = 'none';
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

async function obtenerContextoAlumno() {
    if (!supabase) return "";
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";

    const [{ data: perfil }, { data: viaje }] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_coaching_data').select('*').eq('user_id', user.id).single()
    ]);

    let ctx = `\n[CONTEXTO PRIVADO DEL ALUMNO]\n`;
    if (perfil) {
        ctx += `- Historia Vocal: ${perfil.historia_vocal || 'N/A'}\n- Creencias: ${perfil.creencias || 'N/A'}\n- Alquimia: ${perfil.nivel_alquimia || 1}/10\n`;

        // --- AJUSTES DEL MENTOR ---
        ctx += `\n[PREFERENCIAS DE RESPUESTA]\n`;
        ctx += `- Enfoque (0 Técnico - 1 Emocional): ${perfil.mentor_focus || 0.5}\n`;
        ctx += `- Personalidad (0 Neutro - 1 Motivador): ${perfil.mentor_personality || 0.5}\n`;
        ctx += `- Extensión (0 Breve - 1 Detallado): ${perfil.mentor_length || 0.5}\n`;
        ctx += `- Idioma preferido: ${perfil.mentor_language || 'es'}\n`;
        if (perfil.weekly_goal) ctx += `- Objetivo Semanal: ${perfil.weekly_goal}\n`;

        ctx += `\nInstrucción adicional: Adapta tu tono y contenido a estas preferencias. Si el idioma no es 'es', responde en el idioma indicado.\n`;
    }
    if (viaje) {
        ctx += `\n[VIAJE]\n- M1: ${JSON.stringify(viaje.linea_vida_hitos?.respuestas || {})}\n- M2: ${JSON.stringify(viaje.herencia_raices?.respuestas || {})}\n`;
        // ... (el resto del contexto se mantiene igual o truncado)
    }
    return ctx + `\n------------------------\n`;
}

async function sendMessage() {
    const text = ELEMENTS.chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    guardarMensajeDB(text, 'user'); // Guardar en Supabase sin esperar para no ralentizar

    ELEMENTS.chatInput.value = '';
    ELEMENTS.chatInput.disabled = true;
    ELEMENTS.sendBtn.disabled = true;

    try {
        ['msg-botiquin', 'msg-bienvenida'].forEach(id => document.getElementById(id)?.remove());
        const contexto = await obtenerContextoAlumno();
        const responseText = await llamarGemini(text, chatHistory, "mentor_chat", contexto);

        appendMessage(responseText, 'ia');
        guardarMensajeDB(responseText, 'ia'); // Guardar respuesta de la IA

        chatHistory.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: responseText }] });
    } catch (e) {
        appendMessage(`Error: ${e.message}`, 'ia');
    } finally {
        ELEMENTS.chatInput.disabled = false;
        ELEMENTS.sendBtn.disabled = false;
        ELEMENTS.chatInput.focus();
    }
}

async function guardarMensajeDB(texto, emisor) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log(`Intentando guardar mensaje de ${emisor}...`);
        const { error } = await supabase.from('mensajes').insert({
            texto: texto,
            emisor: emisor,
            alumno: user.id
        });

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
        }
    } catch (e) {
        console.error("Error crítico guardando mensaje:", e);
    }
}

function appendMessage(text, type, id = null) {
    if (!ELEMENTS.chatBox) return;
    const div = document.createElement('div');
    div.className = `message ${type}`;
    if (id) div.id = id;

    if (type.startsWith('ia')) {
        div.innerHTML = window.marked ? window.marked.parse(text) : text;

        if (text.includes("cerrar sesión") || text.includes("encuentro de hoy quede guardado")) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'chat-logout-btn';
            logoutBtn.innerHTML = '✨ Guardar y Cerrar Sesión';
            logoutBtn.onclick = () => {
                logoutBtn.innerHTML = '⌛ Guardando...';
                logoutBtn.disabled = true;
                ELEMENTS.navButtons.logout.click();
            };
            div.appendChild(logoutBtn);
        }
    } else {
        div.innerText = text;
        div.style.whiteSpace = "pre-wrap";
    }

    ELEMENTS.chatBox.appendChild(div);

    // Desplazar el chat: siempre queremos que la última respuesta de la IA sea visible desde su inicio
    if (type.startsWith('ia')) {
        div.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
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
}
if (ELEMENTS.navButtons.logout) {
    ELEMENTS.navButtons.logout.addEventListener('click', async () => {
        ELEMENTS.navButtons.logout.innerText = "Guardando...";
        await MODULOS.generarYGuardarResumen();
        await supabase.auth.signOut();
        location.reload();
    });
}

// --- MÓDULOS ESPECÍFICOS ---

const MODULOS = {
    async abrirBotiquin() {
        const btn = ELEMENTS.navButtons.botiquin;
        document.getElementById('msg-bienvenida')?.remove();

        const existing = document.getElementById('msg-botiquin');
        if (existing) return existing.remove();

        btn.disabled = true;
        btn.innerText = "⏳";
        try {
            const ctx = await obtenerContextoAlumno();
            const prompt = `${ctx}\n[MODO EMERGENCIA] Audición/presentación inminente. Basado en mi perfil, dame: 1. Ejercicio 2min, 2. Consejo técnico, 3. Frase poder, 4. Link YouTube música/frecuencia.`;
            const resp = await llamarGemini(prompt, [], "mentor_chat");
            if (resp) appendMessage(resp, 'ia-botiquin', 'msg-botiquin');
        } finally {
            btn.disabled = false;
            btn.innerText = "Emergencia";
        }
    },
    toggleBienvenida() {
        document.getElementById('msg-botiquin')?.remove();
        const msg = document.getElementById('msg-bienvenida');
        if (msg) return msg.remove();

        // Recuperar nombre para el toggle también
        const nombre = userProfile?.nombre || "viajero/a";
        const nombreCap = nombre.charAt(0).toUpperCase() + nombre.slice(1);
        const saludo = `¡Hola, <strong>${nombreCap}</strong>!<br><br>${MENSAJE_BIENVENIDA}`;

        appendMessage(saludo, 'ia', 'msg-bienvenida');
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
            const prompt = `Genera un JSON: {"resumen":"técnico","creencias":"limitantes","historia_vocal":"pasado","nivel_alquimia":1-10,"creencias_transmutadas":"logros"}. Responde SOLO el JSON.`;
            const raw = await llamarGemini(prompt, chatHistory, "mentor_chat");
            const data = JSON.parse(raw.replace(/```json|```/g, "").trim());
            await supabase.from('user_profiles').upsert({
                user_id: user.id,
                ultimo_resumen: data.resumen,
                creencias: data.creencias,
                historia_vocal: data.historia_vocal,
                nivel_alquimia: data.nivel_alquimia || 1,
                creencias_transmutadas: data.creencias_transmutadas || ""
            });
        } catch (e) { console.error("Error resumen:", e); }
    }
};

const AJUSTES = {
    abrirModal: () => {
        if (!userProfile) return;
        ELEMENTS.settingsUserName.innerText = userProfile.nombre || "Usuario";
        ELEMENTS.settingsUserTier.innerText = (userProfile.subscription_tier || "free").toUpperCase();

        // Cargar valores actuales
        ELEMENTS.focusSlider.value = userProfile.mentor_focus ?? 0.5;
        ELEMENTS.personalitySlider.value = userProfile.mentor_personality ?? 0.5;
        ELEMENTS.lengthSlider.value = userProfile.mentor_length ?? 0.5;
        ELEMENTS.languageSelect.value = userProfile.mentor_language || 'es';
        ELEMENTS.weeklyGoalInput.value = userProfile.weekly_goal || '';
        ELEMENTS.notificationSelect.value = userProfile.notification_pref || 'daily';

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
            const updates = {
                mentor_focus: parseFloat(ELEMENTS.focusSlider.value),
                mentor_personality: parseFloat(ELEMENTS.personalitySlider.value),
                mentor_length: parseFloat(ELEMENTS.lengthSlider.value),
                mentor_language: ELEMENTS.languageSelect.value,
                weekly_goal: ELEMENTS.weeklyGoalInput.value.trim(),
                notification_pref: ELEMENTS.notificationSelect.value
            };

            const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', userProfile.user_id);

            if (error) throw error;

            // Actualizar perfil local
            Object.assign(userProfile, updates);
            alert("Ajustes guardados correctamente.");
            AJUSTES.cerrarModal();
        } catch (e) {
            console.error("Error guardando ajustes:", e);
            alert("Error al guardar: " + e.message);
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

// Event Listeners Ajustes
ELEMENTS.ajustesBtn?.addEventListener('click', () => AJUSTES.abrirModal());
ELEMENTS.closeSettings?.addEventListener('click', () => AJUSTES.cerrarModal());
ELEMENTS.saveSettingsBtn?.addEventListener('click', () => AJUSTES.guardarAjustes());
ELEMENTS.clearHistoryBtn?.addEventListener('click', () => AJUSTES.borrarHistorial());

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
ELEMENTS.navButtons.bienvenida?.addEventListener('click', () => MODULOS.toggleBienvenida());
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
        extra30: "#", // Placeholder
        extra60: "#"  // Placeholder
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
        const planKey = `extra_${duracion}_${tier}`;
        console.log("Iniciando compra extra:", planKey);

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
ELEMENTS.book30Btn?.addEventListener('click', () => SESIONES.reservar('normal30'));
ELEMENTS.book60Btn?.addEventListener('click', () => SESIONES.reservar('normal60'));
ELEMENTS.buyExtra30Btn?.addEventListener('click', () => SESIONES.comprarExtra('30'));
ELEMENTS.buyExtra60Btn?.addEventListener('click', () => SESIONES.comprarExtra('60'));

window.addEventListener('click', e => {
    if (e.target === ELEMENTS.sesionModal) ELEMENTS.sesionModal.style.display = 'none';
    if (e.target.id === 'diarioModal') document.getElementById('diarioModal').style.display = 'none';
});

document.querySelector('.close-modal')?.addEventListener('click', () => document.getElementById('diarioModal').style.display = 'none');

// --- INICIALIZACIÓN Y ESTADOS DE PAGO ---
async function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        const sessionId = urlParams.get('session_id');

        // Limpiamos la URL sin recargar para una experiencia más limpia
        window.history.replaceState({}, document.title, window.location.pathname);

        if (sessionId) {
            // Caso Actualización de Plan (Suscripción)
            alert("¡Tu plan se ha actualizado con éxito! Bienvenido a tu nuevo nivel de transformación.");
            // Recargamos el perfil para aplicar cambios de UI (tier)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await cargarPerfil(user);
        } else {
            // Caso Sesión Extra (Pago único)
            // Nota: En la API configuramos el redirect directo a Cal.com o de vuelta aquí
            alert("¡Sesión extra adquirida con éxito! Haz clic en 'Reservar' para elegir tu horario.");
            SESIONES.abrirModal();
        }
    } else if (urlParams.get('payment') === 'cancel') {
        window.history.replaceState({}, document.title, window.location.pathname);
        alert("El proceso de pago fue cancelado.");
    }
}

// Ejecutamos la comprobación al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPaymentStatus);
} else {
    checkPaymentStatus();
}
