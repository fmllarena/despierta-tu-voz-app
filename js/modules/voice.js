import { ELEMENTS } from './elements.js';
import { b64toBlob } from './utils.js';

export const VOICE = {
    recognition: null,
    audioActual: null,

    setup(sendMessageCallback) {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech || !ELEMENTS.micBtn) return ELEMENTS.micBtn && (ELEMENTS.micBtn.style.display = 'none');

        this.recognition = new Speech();
        this.recognition.lang = 'es-ES';

        ELEMENTS.micBtn.addEventListener('click', () => {
            try {
                this.recognition.start();
                ELEMENTS.micBtn.style.backgroundColor = "#ffcccc";
            } catch (e) {
                console.error(e);
            }
        });

        this.recognition.onresult = e => {
            if (ELEMENTS.chatInput) {
                ELEMENTS.chatInput.value = e.results[0][0].transcript;
                ELEMENTS.micBtn.style.backgroundColor = "";
                if (sendMessageCallback) sendMessageCallback();
            }
        };

        this.recognition.onerror = () => {
            ELEMENTS.micBtn.style.backgroundColor = "";
            alert("¿Micro?");
        };

        this.recognition.onend = () => ELEMENTS.micBtn.style.backgroundColor = "";
    },

    async hablarTexto(texto, btn) {
        if (this.audioActual && !this.audioActual.paused) {
            this.audioActual.pause();
            this.audioActual = null;
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
            this.audioActual = new Audio(audioUrl);

            this.audioActual.onplay = () => {
                btn.innerHTML = '⏸ Detener';
                btn.disabled = false;
            };
            this.audioActual.onended = () => {
                btn.innerHTML = '🔊 Oír Mentor';
                URL.revokeObjectURL(audioUrl);
                this.audioActual = null;
            };
            this.audioActual.play();
        } catch (e) {
            console.error(e);
            btn.innerHTML = '🔊 Oír Mentor';
            btn.disabled = false;
        }
    }
};

// Exponer a window para posibles llamadas externas
window.hablarTexto = (texto, btn) => VOICE.hablarTexto(texto, btn);
