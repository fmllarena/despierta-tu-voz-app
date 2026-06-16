import { ELEMENTS } from './elements.js';
import { state, updateState } from './state.js';

export const VOICE = window.VOICE = {
    recognition: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    isAnalyzing: false,
    isSinging: false,
    singFrames: [],
    singStream: null,
    mediaRecorder: null,
    singCallback: null,

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
        };

        this.setupSingAnalysis(sendMessageCallback);
    },

    setupSingAnalysis(sendMessageCallback) {
        if (!ELEMENTS.singBtn) return;
        this.singCallback = sendMessageCallback;
        ELEMENTS.singBtn.addEventListener('click', () => this.analyzeSinging());
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
        let values = 0, max = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            values += this.dataArray[i];
            if (this.dataArray[i] > max) max = this.dataArray[i];
        }
        const avg = values / this.dataArray.length;
        const vol = Math.min(avg / 128, 1);
        const energy = Math.min(max / 255, 1);
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
    },

    // ─── Análisis de Canto ─────────────────────────────────────────────────────

    async analyzeSinging() {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            alert("Tu navegador no soporta grabación de audio.");
            return;
        }
        if (this.isSinging) return;

        this.isSinging = true;
        this.singFrames = [];
        ELEMENTS.singBtn.classList.add('recording');
        ELEMENTS.singBtn.textContent = '🔴';

        try {
            // Iniciar contexto de audio via Tone.js si está disponible
            if (window.Tone) {
                await Tone.start();
                this.audioContext = Tone.context.rawContext;
            } else if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.singStream = stream;

            // Configurar analyser con mayor resolución para el espectrograma
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 1024;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            // Configurar MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus' : 'audio/webm';
            this.mediaRecorder = new MediaRecorder(stream, { mimeType });
            const chunks = [];

            this.mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            // Colectar frames para el espectrograma
            const collectFrames = () => {
                if (!this.isSinging) return;
                analyser.getByteFrequencyData(dataArray);
                this.singFrames.push([...dataArray]);
                requestAnimationFrame(collectFrames);
            };

            // Iniciar grabación
            this.mediaRecorder.start();
            collectFrames();

            // Auto-detener después de 10 segundos
            await new Promise(resolve => setTimeout(resolve, 10000));
            if (!this.isSinging) return;
            this.isSinging = false;

            const mediaRecorderStop = new Promise(resolve => {
                this.mediaRecorder.onstop = resolve;
            });
            this.mediaRecorder.stop();
            stream.getTracks().forEach(t => t.stop());

            // Esperar a que MediaRecorder termine de procesar
            await mediaRecorderStop;

            // Procesar el audio grabado
            const blob = new Blob(chunks, { type: mimeType });
            if (blob.size < 1000) {
                ELEMENTS.singBtn.classList.remove('recording');
                ELEMENTS.singBtn.textContent = '🎵';
                alert("No se detectó audio. ¿Concediste permiso al micrófono?");
                return;
            }

            // Mostrar pensando en el chat
            if (window.appendMessage) {
                window.appendMessage('🎵 Analizando mi voz...', 'user');
                window.appendMessage('Analizando tu canto...', 'ia thinking', 'msg-sing-thinking');
            }

            // Decodificar audio
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Analizar tono con Tone.js
            const pitchData = this.detectPitch(audioBuffer);

            // Generar espectrograma como imagen base64
            const spectrogramData = this.generateSpectrogram(400, 200);

            // Preparar datos para el análisis por IA
            const analysisText = this.buildSingPrompt(pitchData);

            // Enviar a /api/score
            const response = await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pages: spectrogramData
                        ? [{ mimeType: 'image/png', data: spectrogramData }]
                        : [],
                    question: analysisText,
                    context: 'El alumno ha grabado su voz cantando para un análisis técnico. Por favor, analiza la afinación, la calidad del sonido, la resonancia, la proyección y ofrece consejos prácticos.',
                    stream: false
                })
            });

            // Eliminar el pensando
            const thinkingEl = document.getElementById('msg-sing-thinking');
            if (thinkingEl) thinkingEl.remove();

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error al analizar');
            }

            const result = await response.json();
            if (window.appendMessage) {
                window.appendMessage(result.text || 'Análisis completado.', 'ia');
            }

        } catch (err) {
            console.error('Error en análisis de canto:', err);
            const thinkingEl = document.getElementById('msg-sing-thinking');
            if (thinkingEl) thinkingEl.remove();
            if (window.appendMessage) {
                window.appendMessage(`Error al analizar el canto: ${err.message}`, 'ia');
            }
        } finally {
            ELEMENTS.singBtn.classList.remove('recording');
            ELEMENTS.singBtn.textContent = '🎵';
            if (this.singStream) {
                this.singStream.getTracks().forEach(t => t.stop());
                this.singStream = null;
            }
        }
    },

    // ─── Detección de tono con autocorrelación ─────────────────────────────────

    detectPitch(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const chunkSize = Math.floor(sampleRate * 0.05); // 50ms chunks
        const results = [];

        for (let start = 0; start < channelData.length - chunkSize; start += chunkSize) {
            const chunk = channelData.slice(start, start + chunkSize);
            const pitch = this.autoCorrelate(chunk, sampleRate);
            if (pitch && pitch.note) {
                results.push(pitch);
            }
        }

        if (results.length === 0) {
            return {
                notaPredominante: '—',
                frecuencia: 0,
                desviacionCents: 0,
                notas: [],
                confianza: 0
            };
        }

        // Encontrar la nota más frecuente
        const noteCounts = {};
        for (const r of results) {
            noteCounts[r.note] = (noteCounts[r.note] || 0) + 1;
        }
        let maxCount = 0;
        let predominantNote = results[0].note;
        for (const note in noteCounts) {
            if (noteCounts[note] > maxCount) {
                maxCount = noteCounts[note];
                predominantNote = note;
            }
        }

        const predominantResults = results.filter(r => r.note === predominantNote);
        const avgCents = predominantResults.reduce((s, r) => s + r.cents, 0) / predominantResults.length;
        const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / results.length;

        // Notas detectadas (únicas)
        const uniqueNotes = [...new Set(results.map(r => r.note))];

        return {
            notaPredominante: predominantNote,
            frecuencia: parseFloat(predominantResults[0].freq.toFixed(1)),
            desviacionCents: parseFloat(avgCents.toFixed(0)),
            notas: uniqueNotes.slice(0, 15),
            confianza: parseFloat(avgConfidence.toFixed(2))
        };
    },

    autoCorrelate(buffer, sampleRate) {
        const SIZE = buffer.length;
        const MAX_SAMPLES = Math.floor(SIZE / 2);
        let bestOffset = -1;
        let bestCorrelation = 0;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) return null; // Silencio

        let foundGood = false;
        const correlations = new Float64Array(MAX_SAMPLES);

        for (let offset = 0; offset < MAX_SAMPLES; offset++) {
            let correlation = 0;
            for (let i = 0; i < MAX_SAMPLES; i++) {
                correlation += Math.abs(buffer[i] - buffer[i + offset]);
            }
            correlation = 1 - (correlation / MAX_SAMPLES);
            correlations[offset] = correlation;

            if (correlation > 0.9 && !foundGood) {
                foundGood = true;
            } else if (foundGood && correlation < 0.3) {
                // Primer pico después del umbral
                const firstCorrelation = correlations[offset - 1];
                if (firstCorrelation > 0.95 || correlation > 0.5) {
                    bestOffset = offset - 1;
                    bestCorrelation = firstCorrelation;
                    break;
                }
            }
        }

        if (bestOffset === -1) {
            // Buscar el pico máximo
            for (let offset = 1; offset < MAX_SAMPLES; offset++) {
                if (correlations[offset] > bestCorrelation) {
                    bestCorrelation = correlations[offset];
                    bestOffset = offset;
                }
            }
        }

        if (bestOffset === -1 || bestOffset < 20) return null;

        const frequency = sampleRate / bestOffset;
        const noteInfo = this.freqToNote(frequency);

        return {
            freq: frequency,
            note: noteInfo.note,
            cents: noteInfo.cents,
            confidence: bestCorrelation / (rms > 0.1 ? 1 : 0.5)
        };
    },

    freqToNote(freq) {
        // Usar Tone.Frequency para conversión precisa
        if (window.Tone) {
            try {
                const note = Tone.Frequency(freq).toNote();
                const targetFreq = Tone.Frequency(note).toFrequency();
                const cents = Math.round(1200 * Math.log2(freq / targetFreq));
                return { note, cents };
            } catch (e) {
                // fallback si Tone falla
            }
        }
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const semitones = 12 * Math.log2(freq / A4);
        const rounded = Math.round(semitones);
        const cents = Math.round((semitones - rounded) * 100);
        const noteIndex = ((rounded % 12) + 12) % 12;
        const octave = 4 + Math.floor((rounded + 12) / 12) - 1;
        return {
            note: `${noteNames[noteIndex]}${octave}`,
            cents: cents
        };
    },

    // ─── Generación de espectrograma ───────────────────────────────────────────

    generateSpectrogram(width, height) {
        if (this.singFrames.length < 2) return null;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;

        const numFrames = this.singFrames.length;
        const binCount = this.singFrames[0].length;

        for (let x = 0; x < width; x++) {
            const frameIdx = Math.floor((x / width) * numFrames);
            const frame = this.singFrames[frameIdx];
            if (!frame) continue;

            for (let y = 0; y < height; y++) {
                const binIdx = Math.floor((1 - y / height) * binCount);
                const val = frame[binIdx] || 0;

                // Mapear valor a color (azul → verde → amarillo → rojo)
                const intensity = val / 255;
                let r, g, b;
                if (intensity < 0.25) {
                    r = 0; g = 0; b = 50 + intensity * 4 * 205;
                } else if (intensity < 0.5) {
                    r = 0; g = (intensity - 0.25) * 4 * 255; b = 255;
                } else if (intensity < 0.75) {
                    r = (intensity - 0.5) * 4 * 255; g = 255; b = 255 - (intensity - 0.5) * 4 * 255;
                } else {
                    r = 255; g = 255 - (intensity - 0.75) * 4 * 255; b = 0;
                }

                const pixelIdx = (y * width + x) * 4;
                pixels[pixelIdx] = Math.min(255, Math.max(0, r));
                pixels[pixelIdx + 1] = Math.min(255, Math.max(0, g));
                pixels[pixelIdx + 2] = Math.min(255, Math.max(0, b));
                pixels[pixelIdx + 3] = val > 5 ? 255 : 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
    },

    // ─── Construir prompt para la IA ────────────────────────────────────────────

    buildSingPrompt(pitchData) {
        let prompt = `🎵 **Análisis de Canto**

**Nota predominante:** ${pitchData.notaPredominante} (${pitchData.frecuencia} Hz)
**Desviación de afinación:** ${pitchData.desviacionCents > 0 ? '+' : ''}${pitchData.desviacionCents} cents
**Rango de notas detectadas:** ${pitchData.notas.join(', ') || '—'}
**Confianza del análisis:** ${Math.round(pitchData.confianza * 100)}%

Por favor, realiza un análisis completo:
1. ¿La afinación general es buena? ¿Hay tendencia a desafinar hacia arriba o abajo?
2. ¿Cómo es la calidad del sonido? ¿Se escucha tensión o está suelto?
3. ¿Qué notas son las más estables y cuáles las menos estables?
4. Recomendaciones prácticas para mejorar.`;

        return prompt;
    }
};

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VOICE.setup());
} else {
    VOICE.setup();
}
