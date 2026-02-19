import { state, updateState } from './state.js';
import { ELEMENTS } from './elements.js';
import { llamarGemini } from '../services/ai-service.js';
import { AUDIOS_BOTIQUIN } from './config.js';
import { guardarMensajeDB } from '../services/user-service.js';

export const APP_MODULES = {
    async abrirBotiquin() {
        if (ELEMENTS.navButtons.botiquin) ELEMENTS.navButtons.botiquin.disabled = true;

        ELEMENTS.botiquinModal.style.display = 'flex';
        ELEMENTS.botiquinContent.innerHTML = `
            <div class="botiquin-loading">
                <div class="ia thinking" style="padding: 15px; border-radius: 20px;">Preparando tu botiquín...</div>
            </div>
        `;

        try {
            const prompt = `[MODO EMERGENCIA] Audición/presentación inminente. Basado en mi perfil, dame: 1. Ejercicio 2min, 2. Consejo técnico, 3. Frase poder. REGLA ESTRICTA: NO incluyas links a YouTube ni menciones a "cerrar sesión" o despedidas finales. Enfócate solo en la ayuda inmediata.`;

            let responseText = "";
            await llamarGemini(prompt, [], "mentor_chat", { userId: state.userProfile?.user_id }, (chunk, fullText) => {
                responseText = fullText;
                ELEMENTS.botiquinContent.innerHTML = `
                    <div class="botiquin-response">
                        ${window.marked ? window.marked.parse(responseText + " ▮") : responseText}
                    </div>
                `;
            });

            // Limpiar respuesta final
            const finalHtml = window.marked ? window.marked.parse(responseText) : responseText;
            ELEMENTS.botiquinContent.innerHTML = `<div class="botiquin-response">${finalHtml}</div>`;

            // Insertar lista de audios
            const audioList = document.createElement('div');
            audioList.className = 'botiquin-audios';
            audioList.innerHTML = `<h3>Música de Apoyo</h3>`;
            AUDIOS_BOTIQUIN.forEach(audio => {
                const btn = document.createElement('button');
                btn.className = 'audio-btn';
                btn.innerHTML = `<span>▶</span> ${audio.title}`;
                btn.onclick = () => window.MUSICA.seleccionarYReproducir(audio.file, btn);
                audioList.appendChild(btn);
            });
            ELEMENTS.botiquinContent.appendChild(audioList);

        } catch (e) {
            console.error(e);
            ELEMENTS.botiquinContent.innerHTML = `<p class="error-msg">Error al preparar el botiquín. Inténtalo de nuevo.</p>`;
        } finally {
            if (ELEMENTS.navButtons.botiquin) ELEMENTS.navButtons.botiquin.disabled = false;
        }
    },

    async mostrarInspiracion() {
        if (!state.userProfile) return;
        if (ELEMENTS.navButtons.inspiracion) ELEMENTS.navButtons.inspiracion.disabled = true;

        if (ELEMENTS.inspiracionModal) ELEMENTS.inspiracionModal.style.display = 'flex';
        if (ELEMENTS.inspiracionFrase) {
            ELEMENTS.inspiracionFrase.textContent = "Consultando a las musas...";
            ELEMENTS.inspiracionFrase.classList.add('pulse-loading');
        }

        const tier = state.userProfile.subscription_tier || 'free';
        let frase, autor;

        if (tier === 'free') {
            const frasesMusicos = [
                { frase: "La música puede cambiar el mundo porque puede cambiar a las personas.", autor: "Bono" },
                { frase: "Sin música, la vida sería un error.", autor: "Friedrich Nietzsche" },
                { frase: "Donde las palabras fallan, la música habla.", autor: "Hans Christian Andersen" },
                { frase: "La música es el lenguaje de los espíritus.", autor: "Kahlil Gibran" }
            ];
            const aleatoria = frasesMusicos[Math.floor(Math.random() * frasesMusicos.length)];
            frase = aleatoria.frase;
            autor = aleatoria.autor;
        } else {
            try {
                const prompt = `Eres el mentor vocal de ${state.userProfile.nombre}. Basándote en su perfil, dame una frase de inspiración corta y potente para hoy.`;
                const respuesta = await llamarGemini(prompt, [], "inspiracion_dia", { userId: state.userProfile.user_id });
                frase = respuesta.trim().replace(/^["']|["']$/g, '');
                autor = `Tu Mentor`;
            } catch (e) {
                frase = "Tu voz es el eco de tu alma.";
                autor = "Tu Mentor";
            }
        }

        if (ELEMENTS.inspiracionFrase) {
            ELEMENTS.inspiracionFrase.textContent = frase;
            ELEMENTS.inspiracionFrase.classList.remove('pulse-loading');
        }
        if (ELEMENTS.inspiracionAutor) ELEMENTS.inspiracionAutor.textContent = `— ${autor}`;
        if (ELEMENTS.navButtons.inspiracion) ELEMENTS.navButtons.inspiracion.disabled = false;
    },

    async generarYGuardarResumen() {
        if (state.chatHistory.length < 2) return;
        try {
            const prompt = `Analiza profundamente nuestra conversación actual y los temas tratados hoy. Genera un JSON con: resumen (un párrafo cálido), creencias (lista de creencias limitantes detectadas), nivel_alquimia (número 1-10).`;
            const raw = await llamarGemini(prompt, state.chatHistory, "mentor_chat", { userId: state.userProfile?.user_id });
            const data = JSON.parse(raw.replace(/```json|```/g, "").trim());

            await state.supabase.from('user_profiles').update({
                ultimo_resumen: data.resumen,
                creencias: data.creencias,
                nivel_alquimia: data.nivel_alquimia || 1
            }).eq('user_id', state.userProfile.user_id);

            updateState({ userProfile: { ...state.userProfile, ...data } });
        } catch (e) {
            console.error("Error resumen proactivo:", e);
        }
    },

    async abrirViaje() {
        if (!state.supabase) return;
        const { data: { user } } = await state.supabase.auth.getUser();
        if (!user) {
            ELEMENTS.authOverlay.style.display = 'flex';
            return;
        }

        const modal = document.getElementById('viajeModal');
        if (modal) modal.style.display = 'flex';

        try {
            // Carga dinámica del módulo Mi Viaje
            const { initJourney } = await import(`../../mi_viaje/main.js?v=${Date.now()}`);
            initJourney(state.supabase, user);
        } catch (e) {
            console.error("Error cargando Mi Viaje:", e);
        }
    }
};
