import { ELEMENTS } from './elements.js';
import { llamarGemini } from '../services/ai-service.js';
import { state } from './state.js';

export const SOPORTE = {
    history: [],
    isOpen: false,

    init() {
        ELEMENTS.supportBubble?.addEventListener('click', () => this.abrir());
        ELEMENTS.closeSupport?.addEventListener('click', () => this.cerrar());
        ELEMENTS.sendSupportBtn?.addEventListener('click', () => this.enviar());
        ELEMENTS.supportInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.enviar();
        });
    },

    abrir() {
        if (ELEMENTS.supportModal) ELEMENTS.supportModal.style.display = 'flex';
        this.isOpen = true;
    },

    cerrar() {
        if (ELEMENTS.supportModal) ELEMENTS.supportModal.style.display = 'none';
        this.isOpen = false;
    },

    async enviar() {
        const input = ELEMENTS.supportInput;
        const text = input.value.trim();
        if (!text) return;

        input.value = "";
        this.appendMessage(text, 'user');
        this.history.push({ role: 'user', parts: [{ text: text }] });

        const typingId = 'ia-typing-' + Date.now();
        this.appendMessage("...", 'ia', typingId);

        try {
            const respuesta = await llamarGemini(text, this.history, 'support_chat', {
                userId: state.userProfile?.user_id
            });

            const typingEl = document.getElementById(typingId);
            if (typingEl) {
                typingEl.innerHTML = window.marked ? window.marked.parse(respuesta) : respuesta;
                typingEl.classList.remove('typing');
            }

            this.history.push({ role: 'model', parts: [{ text: respuesta }] });

            if (this.history.length > 4 || respuesta.toLowerCase().includes("whatsapp") || respuesta.toLowerCase().includes("persona")) {
                if (ELEMENTS.whatsappSupportLink) ELEMENTS.whatsappSupportLink.style.display = 'block';
            }

        } catch (e) {
            console.error("Error soporte:", e);
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.innerText = "Lo siento, he tenido un pequeño nudo en mi proceso. ¿Podrías intentar contactarme por WhatsApp directamente?";
            if (ELEMENTS.whatsappSupportLink) ELEMENTS.whatsappSupportLink.style.display = 'block';
        }
    },

    appendMessage(text, role, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        if (id) msgDiv.id = id;
        if (text === "...") msgDiv.classList.add('typing');

        msgDiv.innerHTML = role === 'ia' ? (text === "..." ? text : (window.marked ? window.marked.parse(text) : text)) : text;

        if (ELEMENTS.supportChatBox) {
            ELEMENTS.supportChatBox.appendChild(msgDiv);
            ELEMENTS.supportChatBox.scrollTop = ELEMENTS.supportChatBox.scrollHeight;
        }
    }
};
