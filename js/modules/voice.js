import { ELEMENTS } from './elements.js';
import { state, updateState } from './state.js';

export const VOICE = window.VOICE = {
    recognition: null,
    audioActual: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    isAnalyzing: false,

    setup(sendMessageCallback) {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech || !ELEMENTS.micBtn) return ELEMENTS.micBtn && (ELEMENTS.micBtn.style.display = 'none');

        this.recognition = new Speech();
        this.recognition.lang = 'es-ES';

        ELEMENTS.micBtn.addEventListener('click', () => {
            try {
                this.recognition.start();
                this.startAnalysis();
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
                if (sendMessageCallback) {
                    sendMessageCallback();
                } else if (window.sendMessage) {
                    window.sendMessage();
                }
            }
        };

        this.recognition.onerror = () => {
            ELEMENTS.micBtn.style.backgroundColor = "";
            this.stopAnalysis();
            alert("¿Micro?");
        };

        this.recognition.onend = () => {
            ELEMENTS.micBtn.style.backgroundColor = "";
            // La detención del análisis se maneja en onresult o onerror para asegurar que los datos estén listos
        };
    },

    async startAnalysis() {
        if (this.isAnalyzing) return;

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            this.isAnalyzing = true;
            this.analyzeLoop();
        } catch (err) {
            console.error("Error iniciando análisis de audio:", err);
        }
    },

    analyzeLoop() {
        if (!this.isAnalyzing) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Cálculo de métricas
        let values = 0;
        let max = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            values += this.dataArray[i];
            if (this.dataArray[i] > max) max = this.dataArray[i];
        }

        const avg = values / this.dataArray.length;
        const vol = Math.min(avg / 128, 1);
        const energy = Math.min(max / 255, 1);

        // Estabilidad (simplificada: relación entre avg y max)
        const stability = max > 0 ? Math.max(0, 1 - (Math.abs(max - avg) / 255)) : 1;

        updateState({
            vocalAnalytics: {
                volumen: parseFloat(vol.toFixed(2)),
                energia: parseFloat(energy.toFixed(2)),
                estabilidad: parseFloat(stability.toFixed(2)),
                timestamp: Date.now()
            }
        });

        requestAnimationFrame(() => this.analyzeLoop());
    },

    stopAnalysis() {
        this.isAnalyzing = false;
        console.log("Análisis vocal finalizado:", state.vocalAnalytics);
    }
};

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VOICE.setup());
} else {
    VOICE.setup();
}
