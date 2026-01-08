// --- CONFIGURACIÓN Y ESTADO ---
let supabase;
let userProfile = null;
let chatHistory = [];

const MENSAJE_BIENVENIDA = `<b>Soy tu Mentor Vocal privado.</b>
<br><br>
Bienvenido/a a un espacio sagrado donde tu voz es el puente entre tu técnica y tu alma. 
Aquí no solo buscaremos la nota perfecta, sino que usaremos cada sonido como una llave para abrir los cerrojos de tu historia y desvelar los secretos 
que guarda tu inconsciente. Respira, confía y prepárate para transformar tu vida a través del canto. ¿Cómo te sientes al iniciar este viaje hoy?`;

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
    }
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
        const user = session?.user;

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

    // Al cargar el perfil, recuperamos el historial para que no aparezca vacío
    await cargarHistorialDesdeDB(user.id);

    // Si no hay mensajes previos, saludar de forma estándar
    if (ELEMENTS.chatBox.children.length === 0) {
        saludarUsuario(user, perfil);
    }
}

async function cargarHistorialDesdeDB(userId) {
    try {
        const { data: mensajes, error } = await supabase
            .from('mensajes')
            .select('*')
            .eq('alumno', userId)
            .order('created_at', { ascending: true })
            .limit(30);

        if (error) throw error;
        if (!mensajes || mensajes.length === 0) return;

        ELEMENTS.chatBox.innerHTML = "";
        chatHistory = [];

        mensajes.forEach(msg => {
            appendMessage(msg.texto, msg.emisor);
            // Reconstruir memoria de la IA
            const role = msg.emisor === 'ia' ? 'model' : 'user';
            chatHistory.push({ role: role, parts: [{ text: msg.texto }] });
        });

        console.log(`Historial recuperado: ${mensajes.length} mensajes.`);
    } catch (e) {
        console.warn("Error recuperando historial:", e);
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

    const nombre = perfil?.nombre || (user.email || "viajero/a").split('@')[0];
    const nombreCap = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    if (!perfil || !perfil.ultimo_resumen) {
        const bienvenidaPersonalizada = `¡Hola, <strong>${nombreCap}</strong>!<br><br>${MENSAJE_BIENVENIDA}`;
        appendMessage(bienvenidaPersonalizada, 'ia', 'msg-bienvenida');
    } else {
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
    }
};

document.getElementById('signUpBtn')?.addEventListener('click', authActions.signUp);
document.getElementById('loginBtn')?.addEventListener('click', authActions.login);
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

        await supabase.from('mensajes').insert({
            texto: texto,
            emisor: emisor,
            alumno: user.id
        });
    } catch (e) {
        console.warn("No se pudo guardar el mensaje en el histórico:", e);
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

document.querySelector('.close-modal')?.addEventListener('click', () => document.getElementById('diarioModal').style.display = 'none');
window.addEventListener('click', e => e.target.id === 'diarioModal' && (e.target.style.display = 'none'));
