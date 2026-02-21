import { ELEMENTS } from './elements.js';
import { llamarGemini } from '../services/ai-service.js';

export const SOPORTE = window.SOPORTE = {
    history: [],
    isOpen: false,

    abrir() {
        this.isOpen = true;
        ELEMENTS.supportModal.style.display = 'flex';
        if (this.history.length === 0) {
            this.appendMessage("Hola, soy el asistente de soporte de Despierta tu Voz. ¿En qué puedo ayudarte con la plataforma?", 'ia');
        }
    },

    cerrar() {
        this.isOpen = false;
        ELEMENTS.supportModal.style.display = 'none';
    },

    async enviar() {
        const text = ELEMENTS.supportInput.value.trim();
        if (!text) return;

        this.appendMessage(text, 'user');
        ELEMENTS.supportInput.value = "";

        const msgId = 'support-msg-' + Date.now();
        this.appendMessage("...", 'ia', msgId);

        try {
            const prompt = "Eres el asistente de soporte técnico de la plataforma 'Despierta tu Voz'. Ayuda al usuario con dudas sobre el funcionamiento, errores o suscripciones. Sé amable y conciso.";

            // Usamos llamarGemini del servicio
            const response = await llamarGemini(text, this.history, "support_chat", { systemPrompt: prompt });

            // Eliminar el indicador de carga y mostrar respuesta
            const loadingMsg = document.getElementById(msgId);
            if (loadingMsg) loadingMsg.remove();

            this.appendMessage(response, 'ia');
            this.history.push({ role: 'user', content: text });
            this.history.push({ role: 'ia', content: response });

        } catch (e) {
            console.error("Error soporte:", e);
            const loadingMsg = document.getElementById(msgId);
            if (loadingMsg) loadingMsg.innerHTML = "Lo siento, ha habido un error. Inténtalo más tarde o contacta por WhatsApp.";
        }
    },

    appendMessage: function (text, role, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        if (id) msgDiv.id = id;
        if (text === "...") msgDiv.classList.add('typing');

        // Soporte usa marked para IA
        msgDiv.innerHTML = role === 'ia' ? (text === "..." ? text : window.marked.parse(text)) : text;

        ELEMENTS.supportChatBox.appendChild(msgDiv);
        ELEMENTS.supportChatBox.scrollTop = ELEMENTS.supportChatBox.scrollHeight;
    },

    setup() {
        // Listeners Soporte
        ELEMENTS.supportBubble?.addEventListener('click', () => this.abrir());
        ELEMENTS.closeSupport?.addEventListener('click', () => this.cerrar());
        ELEMENTS.sendSupportBtn?.addEventListener('click', () => this.enviar());
        ELEMENTS.supportInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.enviar();
        });
    }
};

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SOPORTE.setup());
} else {
    SOPORTE.setup();
}
