import { ELEMENTS } from './elements.js';
import { b64toBlob } from './utils.js';
import { updateState } from './state.js';

export const VOICE = {
    recognition: null,
    audioActual: null,
    audioContext: null,
    analyser: null,
    stream: null,
    vocalData: { volumes: [] },

    setup(sendMessageCallback) {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech || !ELEMENTS.micBtn) return ELEMENTS.micBtn && (ELEMENTS.micBtn.style.display = 'none');

        this.recognition = new Speech();
        this.recognition.lang = 'es-ES';

        ELEMENTS.micBtn.addEventListener('click', () => {
            try {
                this.startAnalysis();
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
                this.stopAnalysis();
                if (sendMessageCallback) sendMessageCallback();
            }
        };

        this.recognition.onerror = () => {
            this.stopAnalysis();
            ELEMENTS.micBtn.style.backgroundColor = "";
            alert("¿Micro?");
        };

        this.recognition.onend = () => {
            this.stopAnalysis();
            ELEMENTS.micBtn.style.backgroundColor = "";
        };
    },

    async startAnalysis() {
        try {
            this.vocalData = { volumes: [] };
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const analyze = () => {
                if (!this.analyser) return;
                this.analyser.getByteTimeDomainData(dataArray);

                // Calcular RMS (Volumen)
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    let v = (dataArray[i] - 128) / 128; // Normalizar a [-1, 1]
                    sum += v * v;
                }
                let rms = Math.sqrt(sum / bufferLength);
                this.vocalData.volumes.push(rms);

                if (this.analyser) requestAnimationFrame(analyze);
            };
            analyze();
        } catch (e) {
            console.error("Error en Web Audio API:", e);
        }
    },

    stopAnalysis() {
        if (!this.analyser) return;

        // Calcular métricas finales
        const vols = this.vocalData.volumes;
        if (vols.length > 0) {
            const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
            const maxVol = Math.max(...vols);

            // Estabilidad (variación del volumen)
            let variance = 0;
            vols.forEach(v => variance += Math.pow(v - avgVol, 2));
            const stability = 1 - Math.min(1, Math.sqrt(variance / vols.length) * 10);

            const analytics = {
                volumen: parseFloat(avgVol.toFixed(3)),
                energia: parseFloat(maxVol.toFixed(3)),
                estabilidad: parseFloat(stability.toFixed(3)),
                timestamp: Date.now()
            };

            console.log("📊 Escaneo vocal completado:", analytics);
            updateState({ vocalAnalytics: analytics });
        }

        // Limpiar recursos
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        if (this.audioContext) this.audioContext.close();
        this.analyser = null;
        this.audioContext = null;
        this.stream = null;
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

window.hablarTexto = (texto, btn) => VOICE.hablarTexto(texto, btn);
