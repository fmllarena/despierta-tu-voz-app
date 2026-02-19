/**
 * Despierta tu Voz - Entry Point (Modular Refactor v1)
 */
import { state, updateState } from './js/modules/state.js';
import { ELEMENTS } from './js/modules/elements.js';
import { MENSAJE_BIENVENIDA, TIER_NAMES } from './js/modules/config.js';
import { alertCustom, scrollToBottom } from './js/modules/utils.js';
import { SOPORTE } from './js/modules/support.js';
import { MUSICA } from './js/modules/music.js';
import { VOICE } from './js/modules/voice.js';
import { APP_MODULES } from './js/modules/app-modules.js';
import { authActions } from './js/services/auth-service.js';
import { cargarPerfil, cargarHistorialDesdeDB, guardarMensajeDB } from './js/services/user-service.js';
import { MODALS } from './js/modules/modals.js';
import { llamarGemini } from './js/services/ai-service.js';

import { inicializarSupabase } from './js/services/config-service.js';

// --- INITIALIZATION ---

async function initApp() {
    console.log("🚀 Despierta tu Voz [Modular] inicializando...");

    // 1. Inicializar Supabase
    const sb = await inicializarSupabase();
    if (!sb) return;

    // 2. Setup Modules
    SOPORTE.init();
    MUSICA.init();
    VOICE.setup(() => sendMessage());
    MODALS.setup();

    // 3. Auth Listener
    state.supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user;

        if (event === 'SIGNED_OUT') {
            updateState({ userProfile: null, chatHistory: [] });
            updateUI(null);
        } else if (user) {
            const perfil = await cargarPerfil(user);
            await cargarHistorialDesdeDB(user.id);
            updateUI(user);
            saludarUsuario(user, perfil);
        }
    });

    // 4. Global Event Listeners
    setupEventListeners();
}

function setupEventListeners() {
    ELEMENTS.sendBtn?.addEventListener('click', sendMessage);
    ELEMENTS.chatInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Navigation buttons
    ELEMENTS.navButtons.viaje?.addEventListener('click', () => APP_MODULES.abrirViaje());
    ELEMENTS.navButtons.botiquin?.addEventListener('click', () => APP_MODULES.abrirBotiquin());
    ELEMENTS.navButtons.inspiracion?.addEventListener('click', () => APP_MODULES.mostrarInspiracion());
    ELEMENTS.navButtons.logout?.addEventListener('click', () => authActions.logout());

    // Add more listeners as needed...
}

function updateUI(user) {
    const isVisible = user ? 'block' : 'none';
    const isFlex = user ? 'flex' : 'none';

    ELEMENTS.authOverlay.style.display = user ? 'none' : 'flex';
    if (ELEMENTS.headerButtons) ELEMENTS.headerButtons.style.display = isFlex;

    // UI logic for tiers (Free vs Pro vs Premium)
    if (user && state.userProfile) {
        const tier = state.userProfile.subscription_tier || 'free';
        if (ELEMENTS.sesionBtn) ELEMENTS.sesionBtn.style.display = (tier !== 'free') ? 'flex' : 'none';
    }
}

function saludarUsuario(user, perfil) {
    if (!ELEMENTS.chatBox) return;
    ELEMENTS.chatBox.innerHTML = "";

    if (!perfil?.ultimo_resumen) {
        appendMessage(MENSAJE_BIENVENIDA, 'ia');
    } else {
        const nombre = perfil.nombre || user.email.split('@')[0];
        appendMessage(`¡Hola, ${nombre}! ¿Cómo te sientes hoy?`, 'ia');
    }
}

async function sendMessage() {
    const text = ELEMENTS.chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    ELEMENTS.chatInput.value = '';
    ELEMENTS.chatInput.disabled = true;

    try {
        await guardarMensajeDB(text, 'user');

        const thinkingId = 'thinking-' + Date.now();
        appendMessage("...", 'ia-thinking', thinkingId);

        let responseText = "";
        await llamarGemini(text, state.chatHistory, 'mentor_chat', { userId: state.userProfile?.user_id }, (chunk, full) => {
            responseText = full;
            const el = document.getElementById(thinkingId);
            if (el) el.innerHTML = window.marked ? window.marked.parse(full) : full;
        });

        await guardarMensajeDB(responseText, 'ia');
        state.chatHistory.push({ role: 'user', parts: [{ text }] }, { role: 'model', parts: [{ text: responseText }] });

        // Resumen proactivo
        if (state.chatHistory.length % 4 === 0) {
            APP_MODULES.generarYGuardarResumen();
        }

    } catch (e) {
        console.error("Error en sendMessage:", e);
        appendMessage("Lo siento, ha habido un error.", 'ia');
    } finally {
        ELEMENTS.chatInput.disabled = false;
        scrollToBottom(ELEMENTS.chatBox);
    }
}

function appendMessage(text, type, id = null) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    if (id) div.id = id;

    div.innerHTML = (type.startsWith('ia') && window.marked) ? window.marked.parse(text) : text;

    ELEMENTS.chatBox.appendChild(div);
    scrollToBottom(ELEMENTS.chatBox);
}

// Boot
initApp();
