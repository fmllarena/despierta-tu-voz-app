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
        const btn = ELEMENTS.navButtons.inspiracion;
        if (btn) btn.disabled = true;

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
        if (btn) btn.disabled = false;
    },

    async toggleProgreso() {
        const modal = document.getElementById('diarioModal');
        if (!modal) return;

        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            this.mostrarDiario(modal);
        }
    },

    async mostrarDiario(modal) {
        const perfil = state.userProfile;
        const content = document.getElementById('diarioContent');
        if (!content) return;

        modal.style.display = 'flex';
        content.innerHTML = `<div class="ia thinking">Abriendo tu Bitácora...</div>`;

        try {
            // 1. Cargar crónicas históricas
            const { data: cronicas } = await state.supabase
                .from('mensajes')
                .select('texto, created_at')
                .eq('alumno', state.userProfile.user_id)
                .eq('emisor', 'resumen_diario')
                .order('created_at', { ascending: false })
                .limit(5);

            const nivel = perfil?.nivel_alquimia || 1;

            let html = `
                <div class="diario-header">
                    <div class="diario-seccion">
                        <h4>Nivel de Alquimia: ${nivel}/10</h4>
                        <div class="progress-bar-container"><div class="progress-fill" style="width: ${nivel * 10}%"></div></div>
                    </div>
                </div>
                
                <div class="diario-grid">
                    <div class="diario-seccion">
                        <h5><img src="assets/icon_progreso.png" width="16"> Último Estado</h5>
                        <p>${perfil?.ultimo_resumen || "Iniciando el camino..."}</p>
                    </div>
                    <div class="diario-seccion">
                        <h5>✨ Logros Transmutados</h5>
                        <p>${perfil?.creencias_transmutadas || "Camino por sembrar..."}</p>
                    </div>
                </div>

                <div class="diario-cronicas">
                    <h4>Bitácora de Sesiones Reales</h4>
                    ${cronicas && cronicas.length > 0 ?
                    cronicas.map(c => `
                            <div class="cronica-item">
                                <span class="cronica-date">${new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                <div class="cronica-text">${window.marked ? window.marked.parse(c.texto) : c.texto}</div>
                            </div>
                        `).join('')
                    : `<p class="empty-msg">Aún no hay crónicas guardadas. Cierra tu primera sesión con el Mentor para generarla.</p>`
                }
                </div>
            `;
            content.innerHTML = html;
        } catch (e) {
            console.error("Error al cargar diario:", e);
            content.innerHTML = `<p class="error-msg">No hemos podido abrir la bitácora. Inténtalo de nuevo.</p>`;
        }
    },

    async generarYGuardarResumen() {
        if (state.chatHistory.length < 2) return;
        try {
            const prompt = `Analiza nuestra conversación. Genera un JSON con este formato: {"resumen":"resumen técnico de los avances","creencias":"creencias limitantes detectadas","historia_vocal":"actualización del pasado vocal","nivel_alquimia":1-10,"creencias_transmutadas":"logros conseguidos"}. Responde SOLO el JSON.`;
            const raw = await llamarGemini(prompt, state.chatHistory, "mentor_chat", { userId: state.userProfile?.user_id });
            const data = JSON.parse(raw.replace(/```json|```/g, "").trim());

            await state.supabase.from('user_profiles').update({
                ultimo_resumen: data.resumen,
                creencias: data.creencias,
                historia_vocal: data.historia_vocal,
                nivel_alquimia: data.nivel_alquimia || 1,
                creencias_transmutadas: data.creencias_transmutadas || ""
            }).eq('user_id', state.userProfile.user_id);

            updateState({ userProfile: { ...state.userProfile, ...data } });
            console.log("✨ Perfil actualizado proactivamente.");
        } catch (e) {
            console.error("Error resumen proactivo:", e);
        }
    },

    async generarCronicaSesion() {
        if (state.chatHistory.length < 4) return;

        // Evitar duplicados recientes
        const now = Date.now();
        if (state.lastCronicaTime && (now - state.lastCronicaTime) < 300000) return; // 5 min gap

        try {
            console.log("📝 Sintetizando crónica de sesión...");
            const responseText = await llamarGemini("Genera la crónica de nuestra sesión.", state.chatHistory, "session_chronicle", { userId: state.userProfile?.user_id });

            if (responseText) {
                await guardarMensajeDB(responseText, 'resumen_diario');
                updateState({ lastCronicaTime: now });
                console.log("✅ Crónica de Alquimia guardada.");
            }
        } catch (e) {
            console.error("Error generando crónica:", e);
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
            const { initJourney } = await import(`../../mi_viaje/main.js?v=${Date.now()}`);
            initJourney(state.supabase, user);
        } catch (e) {
            console.error("Error cargando Mi Viaje:", e);
        }
    }
};
