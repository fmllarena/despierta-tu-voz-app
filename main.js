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
        try {
            console.log("🔐 Evento Auth detectado:", event, session?.user?.email);
            const user = session?.user;

            if (event === 'SIGNED_OUT') {
                updateState({ userProfile: null, chatHistory: [] });
                updateUI(null);
            } else if (user) {
                console.log("👤 Usuario detectado, actualizando UI inicial...");
                updateUI(user);

                const perfil = await cargarPerfil(user);
                await cargarHistorialDesdeDB(user.id);
                saludarUsuario(user, perfil);

                console.log("✅ Carga de datos completada, refrescando UI.");
                updateUI(user);
            }
        } catch (e) {
            console.error("❌ Error en el listener de Auth:", e);
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
    ELEMENTS.navButtons.progreso?.addEventListener('click', () => APP_MODULES.toggleProgreso());
    ELEMENTS.navButtons.botiquin?.addEventListener('click', () => APP_MODULES.abrirBotiquin());
    ELEMENTS.navButtons.inspiracion?.addEventListener('click', () => APP_MODULES.mostrarInspiracion());
    ELEMENTS.navButtons.logout?.addEventListener('click', () => authActions.logout());

    // Auth listeners
    ELEMENTS.loginBtn?.addEventListener('click', () => authActions.login());
    ELEMENTS.signUpBtn?.addEventListener('click', () => MODALS.abrirLegal());
    ELEMENTS.forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        authActions.resetPassword();
    });
    ELEMENTS.updatePasswordBtn?.addEventListener('click', () => authActions.updatePassword());

    // Password Toggles
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
            }
        });
    });

    // Custom Alert
    ELEMENTS.alertConfirmBtn?.addEventListener('click', () => {
        ELEMENTS.customAlert.style.display = 'none';
    });

    // Check for recovery mode in URL
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
        ELEMENTS.authOverlay.style.display = 'flex';
        ELEMENTS.resetPasswordContainer.style.display = 'block';
    }

    // Add more listeners as needed...
}

function updateUI(user) {
    const isVisible = user ? 'block' : 'none';
    const isFlex = user ? 'flex' : 'none';

    // Mantener overlay si estamos recuperando contraseña
    const showOverlay = !user || state.isRecoveringPassword;
    ELEMENTS.authOverlay.style.display = showOverlay ? 'flex' : 'none';

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
        console.log("📝 Enviando mensaje:", text);
        await guardarMensajeDB(text, 'user');

        const thinkingId = 'thinking-' + Date.now();
        appendMessage("...", 'ia thinking', thinkingId);

        let responseText = "";
        const responseId = 'ia-response-' + Date.now();

        console.log("🤖 Llamando a Gemini API...");
        await llamarGemini(text, state.chatHistory, 'mentor_chat', { userId: state.userProfile?.user_id }, (chunk, full) => {
            if (responseText === "") {
                document.getElementById(thinkingId)?.remove();
                appendMessage("", 'ia', responseId);
            }
            responseText = full;
            const container = document.getElementById(responseId);
            const resEl = container?.querySelector('.message.ia');
            if (resEl) {
                const cleanText = responseText.replace(/\[\s*SESION_FINAL\s*\]/gi, "").trim();
                resEl.innerHTML = window.marked ? window.marked.parse(cleanText + " ▮") : cleanText;
                scrollToBottom(ELEMENTS.chatBox);
            }
        });

        console.log("✅ Respuesta recibida.");
        const finalContainer = document.getElementById(responseId);
        const finalEl = finalContainer?.querySelector('.message.ia');
        const finalClean = responseText.replace(/\[\s*SESION_FINAL\s*\]/gi, "").trim();
        if (finalEl) {
            finalEl.innerHTML = window.marked ? window.marked.parse(finalClean) : finalClean;
        }

        await guardarMensajeDB(responseText, 'ia');
        state.chatHistory.push({ role: 'user', parts: [{ text }] }, { role: 'model', parts: [{ text: responseText }] });

        // Detección de sesión final
        if (/\[\s*SESION_FINAL\s*\]/i.test(responseText)) {
            if (finalEl) crearBotonesAccionFinal(finalEl);
            APP_MODULES.generarCronicaSesion();
        }

        // Resumen proactivo (si no es el final)
        else if (state.chatHistory.length % 4 === 0) {
            APP_MODULES.generarYGuardarResumen();
        }

    } catch (e) {
        console.error("❌ Error en sendMessage:", e);
        const el = document.querySelector('.ia.thinking');
        if (el) {
            el.classList.remove('thinking');
            el.innerHTML = "Lo siento, el Mentor está meditando profundamente ahora mismo. Por favor, intenta de nuevo en unos momentos o refresca la página.";
        } else {
            appendMessage("Lo siento, ha habido un problema de conexión con el Mentor vocal.", 'ia');
        }
    } finally {
        ELEMENTS.chatInput.disabled = false;
        scrollToBottom(ELEMENTS.chatBox);
    }
}

/**
 * Crea botones de acción (Descargar/Cerrar) al final de la sesión
 */
function crearBotonesAccionFinal(parentDiv) {
    if (!parentDiv || parentDiv.querySelector('.chat-action-container')) return;

    const container = document.createElement('div');
    container.className = 'chat-action-container';
    container.style.marginTop = '15px';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'save-btn';
    downloadBtn.innerHTML = '📥 Descargar sesión (.doc)';
    downloadBtn.onclick = () => window.exportarChatDoc ? window.exportarChatDoc() : alert('Exportación no lista');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'save-btn logout-action-btn';
    closeBtn.innerHTML = '✨ Guardar y Salir';
    closeBtn.onclick = () => ELEMENTS.navButtons.logout.click();

    container.appendChild(downloadBtn);
    container.appendChild(closeBtn);
    parentDiv.appendChild(container);
}

function appendMessage(text, type, id = null) {
    const div = document.createElement('div');
    div.className = `message ${type}`;

    // Si no es IA, asignamos el ID directamente al div
    if (!type.startsWith('ia') && id) div.id = id;

    if (type.startsWith('ia')) {
        // Limpiamos siempre el tag técnico para que el usuario nunca lo vea en la interfaz (vía regex flexible)
        const cleanText = text.replace(/\[\s*SESION\\?_?FINAL\s*\]/gi, "").trim();
        div.innerHTML = window.marked ? window.marked.parse(cleanText) : cleanText;

        // Si es Botiquín o estado de carga (thinking), no ponemos avatar para limpiar la interfaz
        if (type === 'ia-botiquin' || type.includes('thinking')) {
            if (id) div.id = id;
            ELEMENTS.chatBox.appendChild(div);
            scrollToBottom(ELEMENTS.chatBox);
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
    } else {
        div.innerText = text;
        div.style.whiteSpace = "pre-wrap";
        ELEMENTS.chatBox.appendChild(div);
    }

    // Desplazar el chat
    scrollToBottom(ELEMENTS.chatBox);
}

// Boot
initApp();
