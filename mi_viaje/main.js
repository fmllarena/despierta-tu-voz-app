import { ROLES_ALQUIMIA, MODULES_METADATA } from './config.js';

let currentModuleIndex = 0;
let currentModuleData = null; // Carga dinámica
let currentStepIndex = 0;
let currentQuestionSubIndex = 0;
let userAnswers = {};
let isIntroView = true;

// GLOBAL STORAGE for cumulative answers to feed the AI
let journeyContext = [];

let cachedSupabase = null;
let cachedUser = null;

export async function initJourney(supabaseClient, user) {
    cachedSupabase = supabaseClient;
    cachedUser = user;
    console.log("Iniciando Mi Viaje 2.0 (Dynamic)...", user);

    // Sincronización proactiva para usuarios antiguos
    await syncJourneyStatus(supabaseClient, user);

    renderRoadmap();

    // UI Events
    document.querySelector('.close-viaje').onclick = () => {
        document.getElementById('viajeModal').style.display = 'none';
    };
    document.querySelector('.close-modulo').onclick = () => {
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex';
        renderRoadmap(); // Refresh to show unlocked modules
    };

    document.getElementById('nextQBtn').onclick = () => nextStep(cachedSupabase, cachedUser);
    document.getElementById('prevQBtn').onclick = prevStep;
    document.getElementById('finishModuleBtn').onclick = () => finishModuleWithAI(cachedSupabase, cachedUser);
}

/**
 * Detecta si el usuario ya tiene datos grabados para evitar que módulos antiguos salgan bloqueados
 */
async function syncJourneyStatus(supabase, user) {
    try {
        console.log("🔄 Sincronizando progreso del viaje...");

        // 1. Forzar recarga del perfil mediante API (que repara si falta)
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const profile = await response.json();

        if (profile && !profile.error) {
            if (!window.userProfile) window.userProfile = {};
            window.userProfile.last_hito_completed = profile.last_hito_completed;
            window.userProfile.subscription_tier = profile.subscription_tier;
            console.log(`- Hito en DB: ${profile.last_hito_completed}`);
        }

        // 2. Verificación de seguridad: ¿Hay datos reales que indiquen más progreso?
        // Solo lo hacemos si el hito es menor a 5 para ahorrar recursos
        if ((profile?.last_hito_completed || 0) < 5) {
            const { data: coaching } = await supabase
                .from('user_coaching_data')
                .select('linea_vida_hitos, herencia_raices, roles_familiares, ritual_sanacion, plan_accion')
                .eq('user_id', user.id)
                .maybeSingle();

            if (coaching) {
                let realHito = 0;
                if (Array.isArray(coaching.linea_vida_hitos) && coaching.linea_vida_hitos.length > 0) realHito = 1;
                if (Array.isArray(coaching.herencia_raices) && coaching.herencia_raices.length > 0) realHito = 2;
                if (Array.isArray(coaching.roles_familiares) && coaching.roles_familiares.length > 0) realHito = 3;
                if (Array.isArray(coaching.ritual_sanacion) && coaching.ritual_sanacion.length > 0) realHito = 4;
                if (Array.isArray(coaching.plan_accion) && coaching.plan_accion.length > 0) realHito = 5;

                if (realHito > (profile?.last_hito_completed || 0)) {
                    console.log(`🚀 Reparando last_hito_completed a ${realHito}...`);
                    await supabase
                        .from('user_profiles')
                        .update({ last_hito_completed: realHito })
                        .eq('user_id', user.id);
                    window.userProfile.last_hito_completed = realHito;
                }
            }
        }
    } catch (e) {
        console.error("❌ Error en syncJourneyStatus:", e);
    }
}

function renderRoadmap() {
    const container = document.getElementById('journeyRoadmap');
    container.innerHTML = '';

    const lastHito = window.userProfile?.last_hito_completed || 0;
    const subscriptionTier = window.userProfile?.subscription_tier || 'free';

    MODULES_METADATA.forEach((mod, index) => {
        // El Diario de Alquimia (módulo especial) siempre está desbloqueado
        // Lógica de desbloqueo combinada:
        // 1. Plan FREE: Solo módulo 1 accesible
        // 2. Plan PRO/PREMIUM: Desbloqueo progresivo (siguiente módulo al completar anterior)
        let isUnlocked;
        if (mod.special) {
            isUnlocked = true; // Diario siempre accesible
        } else if (subscriptionTier === 'free') {
            isUnlocked = mod.id === 1; // Solo módulo 1 para free
        } else {
            isUnlocked = mod.id === 1 || mod.id <= lastHito + 1; // Progresivo para pro/premium
        }
        const isCompleted = mod.id <= lastHito;

        // Render Node
        const node = document.createElement('div');
        node.className = `roadmap-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''} ${mod.special ? 'special-node' : ''}`;

        node.onclick = () => {
            if (mod.special) {
                // Módulo especial: Diario de Alquimia
                abrirDiarioAlquimia();
            } else if (isUnlocked) {
                if (isCompleted) {
                    abrirBitacora(mod);
                } else {
                    openModule(index);
                }
            } else {
                // Mensaje diferenciado según el motivo del bloqueo
                if (subscriptionTier === 'free') {
                    alert("Este módulo forma parte del Plan Profundiza o Premium. ¡Mejora tu plan para continuar el viaje! 🌟");
                } else {
                    alert("Este módulo aún está bloqueado. Completa el módulo anterior para continuar tu viaje de forma progresiva. 🔒");
                }
            }
        };

        const statusIcon = mod.special ? '📖' : (isCompleted ? '✅' : (isUnlocked ? '▶' : '🔒'));

        node.innerHTML = `
            <div class="node-icon">${mod.icon}</div>
            <div class="node-info">
                <h3>${mod.special ? '' : `Módulo ${mod.id}: `}${mod.title}</h3>
                <p>${mod.description}</p>
            </div>
            <div class="node-status">${statusIcon}</div>
        `;
        container.appendChild(node);
    });
}

async function openModule(index) {
    currentModuleIndex = index;
    const meta = MODULES_METADATA[currentModuleIndex];

    document.getElementById('viajeModal').style.display = 'none';
    document.getElementById('moduloModal').style.display = 'flex';

    renderLoading(`Cargando Módulo ${meta.id}...`);

    try {
        // Carga dinámica del contenido del módulo
        const moduleFile = `./modules/module${meta.id}.js?v=${Date.now()}`;
        const moduleModule = await import(moduleFile);
        currentModuleData = moduleModule.default;

        isIntroView = !!currentModuleData.intro;
        currentStepIndex = 0;
        currentQuestionSubIndex = 0;
        userAnswers = {};
        journeyContext = [];

        document.getElementById('questionContainer').innerHTML = '';

        if (isIntroView) {
            renderIntro();
        } else {
            renderStep();
        }
    } catch (err) {
        console.error("Error cargando módulo dinámico:", err);
        alert("No se pudo cargar el contenido del módulo. Por favor, intenta de nuevo.");
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex';
    }
}

async function abrirBitacora(mod) {
    document.getElementById('viajeModal').style.display = 'none';
    document.getElementById('moduloModal').style.display = 'flex';
    renderLoading(`Abriendo Bitácora del Módulo ${mod.id}...`);

    try {
        const columns = {
            1: ['linea_vida_hitos'],
            2: ['herencia_raices'],
            3: ['roles_familiares'],
            4: ['carta_yo_pasado', 'carta_padres', 'sanacion_heridas', 'ritual_sanacion'],
            5: ['inventario_creencias', 'proposito_vida', 'plan_accion']
        };

        const colList = columns[mod.id] || [];
        const { data, error } = await cachedSupabase
            .from('user_coaching_data')
            .select(colList.join(','))
            .eq('user_id', cachedUser.id)
            .single();

        if (error) throw error;

        renderBitacora(mod, data);
    } catch (err) {
        console.error("Error cargando bitácora:", err);
        alert("No se pudo cargar tu bitácora. Asegúrate de haber completado el módulo.");
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex';
    }
}

function renderBitacora(mod, data) {
    const container = document.getElementById('questionContainer');
    document.getElementById('nextQBtn').style.display = 'none';
    document.getElementById('prevQBtn').style.display = 'none';
    document.getElementById('finishModuleBtn').style.display = 'none';

    let contentHtml = `
        <div class="bitacora-view">
            <div class="bitacora-header">
                <div class="bitacora-badge">Módulo ${mod.id} Completado</div>
                <span class="bitacora-icon-large">${mod.icon}</span>
                <h2>Bitácora de Alquimia: ${mod.title}</h2>
                <p>Aquí se guardan las semillas que plantaste en esta etapa de tu viaje.</p>
            </div>
            <div class="bitacora-body">
    `;

    if (!data) {
        container.innerHTML = `
            <div class="bitacora-view">
                <div class="bitacora-header">
                    <span class="bitacora-icon-large">${mod.icon}</span>
                    <h2>${mod.title}</h2>
                    <p>Aún no hay huellas en esta etapa del viaje.</p>
                </div>
                <div class="bitacora-empty">
                    <p>Parece que aún no has dejado tus reflexiones aquí. ¡Vuelve al mapa para iniciar este módulo!</p>
                </div>
                <div class="bitacora-actions">
                    <button class="journey-btn secondary" onclick="document.querySelector('.close-modulo').click()">← Volver al Mapa</button>
                    <button class="journey-btn" id="restartModuleBtn">Iniciar Módulo 🚀</button>
                </div>
            </div>
        `;
        document.getElementById('restartModuleBtn').onclick = () => {
            const modIndex = MODULES_METADATA.findIndex(m => m.id === mod.id);
            openModule(modIndex);
        };
        return;
    }

    // Mapeo de campos por módulo para filtrar la bitácora
    const moduleFields = {
        1: ['linea_vida_hitos'],
        2: ['herencia_raices'],
        3: ['roles_familiares'],
        4: ['carta_yo_pasado', 'carta_padres', 'sanacion_heridas', 'ritual_sanacion'],
        5: ['inventario_creencias', 'proposito_vida', 'plan_accion']
    };

    const allowedFields = moduleFields[mod.id] || [];

    // Procesar hitos de las columnas permitidas
    // 1. Aplanar todos los hitos de las columnas permitidas
    let allHits = [];
    for (const [colName, hits] of Object.entries(data)) {
        if (!allowedFields.includes(colName) || !Array.isArray(hits)) continue;
        allHits.push(...hits);
    }

    let hasEntries = false;
    // 2. Ordenar hitos por fecha descendente (más recientes primero)
    allHits.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // 3. Filtrar: Quedarse solo con la versión más reciente de cada etapa
    const latestByEtapa = new Map();
    allHits.forEach(hito => {
        const etapa = hito.etapa || 'Hito del Camino';
        if (!latestByEtapa.has(etapa)) {
            // Normalizar respuestas (limpiar texto)
            const cleanResponses = {};
            Object.keys(hito.respuestas || {}).forEach(key => {
                let val = hito.respuestas[key];
                if (typeof val === 'string') val = val.replace(/\*\*/g, '').trim();
                if (val) cleanResponses[key] = val;
            });

            latestByEtapa.set(etapa, {
                ...hito,
                respuestas: cleanResponses
            });
        }
    });

    // 4. Convertir a array y ordenar cronológicamente para la vista (ascendente)
    let finalHitos = Array.from(latestByEtapa.values());
    finalHitos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (finalHitos.length > 0) {
        hasEntries = true;
        finalHitos.forEach(hito => {
            contentHtml += `
                <div class="bitacora-card">
                    <div class="card-header">
                        <span class="card-title">${hito.etapa || 'Hito del Camino'}</span>
                        <span class="card-date">${new Date(hito.fecha).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div class="card-content">`;

            for (const [qId, answer] of Object.entries(hito.respuestas || {})) {
                contentHtml += `
                    <div class="bitacora-entry-item">
                        <div class="entry-label">🌿 Reflexión profunda</div>
                        <div class="entry-text">${answer}</div>
                    </div>
                `;
            }
            contentHtml += `
                    </div>
                    <div class="card-footer">
                        <span class="seal">Sello de Alquimia ✨</span>
                    </div>
                </div>`;
        });
    }

    if (!hasEntries) {
        contentHtml += `
            <div class="bitacora-empty">
                <p>Las páginas de este módulo están esperando tus palabras...</p>
            </div>`;
    }

    contentHtml += `
            </div>
            <div class="bitacora-actions">
                <button class="journey-btn secondary" onclick="document.querySelector('.close-modulo').click()">← Volver al Mapa</button>
                <button class="journey-btn danger-outline" id="restartModuleBtn">Reiniciar Módulo 🔄</button>
            </div>
        </div>
    `;

    container.innerHTML = contentHtml;

    document.getElementById('restartModuleBtn').onclick = () => {
        if (confirm("¿Estás seguro de que quieres reiniciar este módulo? Podrás volver a realizar los ejercicios, pero esto no borrará tu historial anterior en la base de datos (se añadirá como nuevas entradas).")) {
            const modIndex = MODULES_METADATA.findIndex(m => m.id === mod.id);
            openModule(modIndex);
        }
    };
}

async function abrirDiarioAlquimia() {
    document.getElementById('viajeModal').style.display = 'none';
    document.getElementById('moduloModal').style.display = 'flex';
    renderLoading("Abriendo tu Diario de Alquimia...");

    try {
        // Obtener crónicas automáticas (resumen_diario)
        const { data: cronicas, error: errorCronicas } = await cachedSupabase
            .from('mensajes')
            .select('texto, created_at')
            .eq('alumno', cachedUser.id)
            .eq('emisor', 'resumen_diario')
            .order('created_at', { ascending: false });

        if (errorCronicas) throw errorCronicas;

        // Obtener notas personales
        const { data: userData, error: errorUser } = await cachedSupabase
            .from('user_profiles')
            .select('notas_personales')
            .eq('user_id', cachedUser.id)
            .single();

        if (errorUser) throw errorUser;

        renderDiarioAlquimia(cronicas || [], userData?.notas_personales || []);
    } catch (err) {
        console.error("Error cargando Diario de Alquimia:", err);
        alert("No se pudo cargar tu Diario. Inténtalo de nuevo.");
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex';
    }
}

function renderDiarioAlquimia(cronicas, notasPersonales) {
    const container = document.getElementById('questionContainer');
    document.getElementById('nextQBtn').style.display = 'none';
    document.getElementById('prevQBtn').style.display = 'none';
    document.getElementById('finishModuleBtn').style.display = 'none';

    let contentHtml = `
        <div class="diario-alquimia-view">
            <div class="diario-header">
                <span class="diario-icon">📖</span>
                <h2>Tu Diario de Alquimia</h2>
                <p>Aquí se guardan las huellas de tu transformación vocal y emocional.</p>
            </div>
            
            <!-- Sección de Notas Personales -->
            <div class="diario-section notas-section">
                <h3>✍️ Tus Notas Personales</h3>
                <p class="section-desc">Escribe aquí tus reflexiones, aprendizajes o cualquier cosa que quieras recordar de tu viaje.</p>
                <textarea id="notasPersonalesInput" placeholder="Escribe tus notas aquí..." rows="6">${notasPersonales.join('\n\n---\n\n') || ''}</textarea>
                <button id="guardarNotasBtn" class="journey-btn" style="margin-top: 15px;">💾 Guardar Notas</button>
            </div>

            <!-- Sección de Crónicas Automáticas -->
            <div class="diario-section cronicas-section">
                <h3>🌙 Crónicas de tus Sesiones</h3>
                <p class="section-desc">Resúmenes automáticos generados por el Mentor después de cada sesión.</p>
                <div class="cronicas-timeline">
    `;

    if (cronicas.length === 0) {
        const tier = (window.userProfile?.subscription_tier || 'free').toLowerCase();
        if (tier === 'free') {
            contentHtml += `<p class="empty-state">Cambia de Plan si quieres ver aquí los resúmenes de tus sesiones con el Mentor.</p>`;
        } else {
            contentHtml += `<p class="empty-state">Aún no tienes crónicas. Sigue conversando con el Mentor para que se generen automáticamente.</p>`;
        }
    } else {
        cronicas.forEach(cronica => {
            const fecha = new Date(cronica.created_at);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            contentHtml += `
                <div class="cronica-entry">
                    <div class="cronica-date">${fechaFormateada}</div>
                    <div class="cronica-text">${cronica.texto}</div>
                </div>
            `;
        });
    }

    contentHtml += `
                </div>
            </div>

            <div class="diario-actions">
                <button class="journey-btn secondary" onclick="document.querySelector('.close-modulo').click()">← Volver al Mapa</button>
            </div>
        </div>
    `;

    container.innerHTML = contentHtml;

    // Event listener para guardar notas
    document.getElementById('guardarNotasBtn').onclick = async () => {
        const notasInput = document.getElementById('notasPersonalesInput');
        const nuevasNotas = notasInput.value.trim();

        if (!nuevasNotas) {
            alert("Escribe algo antes de guardar.");
            return;
        }

        const btn = document.getElementById('guardarNotasBtn');
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            // Crear array de notas (separadas por el delimitador)
            const notasArray = nuevasNotas.split('\n\n---\n\n').filter(n => n.trim());

            const { error } = await cachedSupabase
                .from('user_profiles')
                .update({ notas_personales: notasArray })
                .eq('user_id', cachedUser.id);

            if (error) throw error;

            btn.innerText = "✅ Guardado";
            setTimeout(() => {
                btn.innerText = "💾 Guardar Notas";
                btn.disabled = false;
            }, 2000);
        } catch (err) {
            console.error("Error guardando notas:", err);
            alert("Error al guardar tus notas. Inténtalo de nuevo.");
            btn.innerText = "💾 Guardar Notas";
            btn.disabled = false;
        }
    };
}

function renderIntro() {
    const module = currentModuleData;
    const container = document.getElementById('questionContainer');

    document.getElementById('nextQBtn').style.display = 'none';
    document.getElementById('prevQBtn').style.display = 'none';
    document.getElementById('finishModuleBtn').style.display = 'none';

    // Ocultar botón de ayuda en la intro
    const helpBtn = document.getElementById('helpModuleBtn');
    const helpTooltip = document.getElementById('helpModuleTooltip');
    if (helpBtn) helpBtn.style.display = 'none';
    if (helpTooltip) helpTooltip.classList.remove('active');

    container.innerHTML = `
        <div class="question-slide" style="text-align: center; padding: 20px;">
            <h2 style="color: var(--color-acento); margin-bottom: 20px;">${module.title}</h2>
            <div style="font-size: 3em; margin-bottom: 20px;">${module.icon}</div>
            <p style="font-size: 1.2em; line-height: 1.6; color: #555; margin-bottom: 30px;">
                ${module.intro.text}
            </p>
            <button id="startModuleBtn" class="journey-btn" style="font-size: 1.1em; padding: 12px 30px;">
                ${module.intro.buttonText}
            </button>
        </div>
    `;

    document.getElementById('startModuleBtn').onclick = () => {
        isIntroView = false;
        renderStep();
    };
}


function renderStep() {
    const module = currentModuleData;
    if (!module) return console.error("❌ Módulo no cargado");
    const step = module.steps[currentStepIndex];
    if (!step) return console.error("❌ Paso no encontrado", currentStepIndex);

    console.log(`[Viaje] Renderizando Módulo ${currentModuleIndex}, Paso ${currentStepIndex}, SubIndex ${currentQuestionSubIndex}`);

    // Safety check if dynamic questions aren't loaded yet
    if (step.dynamic && (step.questions.length === 0)) {
        renderLoading("Generando preguntas personalizadas...");
        return;
        // This shouldn't happen if logic flows correctly, but just in case.
    }

    const question = step.questions[currentQuestionSubIndex];

    const totalQ = module.steps.reduce((acc, s) => acc + (s.questions ? s.questions.length : 1), 0);
    // Estimated 1 for dynamic steps if empty

    const previousStepsCount = module.steps.slice(0, currentStepIndex).reduce((acc, s) => acc + s.questions.length, 0);
    const currentAbsoluteQ = previousStepsCount + currentQuestionSubIndex + 1;
    const progressPercent = (currentAbsoluteQ / totalQ) * 100;

    const isLastOfModule = (currentStepIndex === module.steps.length - 1) && (currentQuestionSubIndex === step.questions.length - 1);

    document.getElementById('nextQBtn').style.display = isLastOfModule ? 'none' : 'inline-block';
    document.getElementById('finishModuleBtn').style.display = isLastOfModule ? 'inline-block' : 'none';
    document.getElementById('prevQBtn').style.display = 'inline-block';

    let progressBar = document.querySelector('.module-progress-bar');
    if (!progressBar) {
        const pContainer = document.createElement('div');
        pContainer.className = 'module-progress';
        pContainer.innerHTML = '<div class="module-progress-bar"></div>';
        document.getElementById('questionContainer').before(pContainer);
        progressBar = pContainer.querySelector('.module-progress-bar');
    }
    progressBar.style.width = `${progressPercent}%`;

    const container = document.getElementById('questionContainer');

    // --- GESTIÓN DE BOTÓN DE AYUDA ---
    let helpBtn = document.getElementById('helpModuleBtn');
    let helpTooltip = document.getElementById('helpModuleTooltip');

    if (question.help) {
        if (!helpBtn) {
            helpBtn = document.createElement('button');
            helpBtn.id = 'helpModuleBtn';
            helpBtn.className = 'help-modulo-btn';
            helpBtn.innerHTML = '?';
            document.querySelector('.module-content').appendChild(helpBtn);

            helpTooltip = document.createElement('div');
            helpTooltip.id = 'helpModuleTooltip';
            helpTooltip.className = 'help-tooltip';
            document.querySelector('.module-content').appendChild(helpTooltip);

            helpBtn.onclick = (e) => {
                e.stopPropagation();
                helpTooltip.classList.toggle('active');
            };

            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (helpTooltip && !helpTooltip.contains(e.target) && e.target !== helpBtn) {
                    helpTooltip.classList.remove('active');
                }
            });
        }
        helpBtn.style.display = 'flex';
        helpTooltip.innerHTML = `<h5>💡 Guía del Mentor</h5><p>${question.help}</p>`;
        helpTooltip.classList.remove('active'); // Ocultar al cambiar de pregunta
    } else {
        if (helpBtn) helpBtn.style.display = 'none';
        if (helpTooltip) helpTooltip.classList.remove('active');
    }

    if (question.type === 'roles_selection') {
        // --- INTERFAZ ESPECIAL DE TARJETAS DE ROLES ---
        document.getElementById('nextQBtn').style.display = 'none';

        let cardsHtml = '<div class="role-cards-container">';
        for (const [key, rol] of Object.entries(ROLES_ALQUIMIA)) {
            cardsHtml += `
                <div class="role-card" onclick="window.seleccionarRol('${key}')">
                    <div class="role-card-icon">${rol.icon}</div>
                    <h3>${rol.titulo}</h3>
                    <p class="role-card-lema">"${rol.lema}"</p>
                </div>
            `;
        }
        cardsHtml += '</div>';

        container.innerHTML = `
            <div class="question-slide">
                <h4>${step.stage}</h4>
                <p style="color:#666; font-style:italic; margin-bottom:20px;">${step.instructions}</p>
                ${cardsHtml}
            </div>
        `;

        // Exponemos la función globalmente para los clics
        window.seleccionarRol = async (idOfRol) => {
            console.log(`💎 [${new Date().toLocaleTimeString()}] SELECCIÓN ROL (CLIC):`, idOfRol);

            if (!cachedSupabase || !cachedUser) {
                console.error("❌ ERROR: No hay sesión (cachedSupabase/cachedUser vacíos)");
                alert("Error de sesión. Recarga la página.");
                return;
            }

            const role = ROLES_ALQUIMIA[idOfRol];
            if (!role) return;

            // Bloqueamos clics repetidos
            const originalFunc = window.seleccionarRol;
            window.seleccionarRol = () => { console.warn("⏳ Seleccionando, espera..."); };

            // Guardamos selección localmente
            userAnswers[question.id] = role.titulo;

            // hitoData para guardar
            const hito = {
                etapa: "Selección de Rol",
                respuestas: { ...userAnswers },
                fecha: new Date().toISOString()
            };

            try {
                console.log(`📡 Guardando... Stage: ${step.stage}, SubQ: ${currentQuestionSubIndex}`);
                // Sincronizamos también con la columna individual 'personaje'
                await guardarHitoJSON(cachedSupabase, cachedUser, step.field, hito, { personaje: role.titulo });
                console.log("✅ OK Supabase (History + ColumnSync)");

                journeyContext.push({ stage: step.stage, question: question.text, answer: role.titulo });

                if (currentQuestionSubIndex === step.questions.length - 1) {
                    if (currentStepIndex < module.steps.length - 1) {
                        currentStepIndex++;
                        currentQuestionSubIndex = 0;
                        userAnswers = {};
                        console.log("🚀 AVANCE A NEXT STEP:", currentStepIndex);
                    }
                } else {
                    currentQuestionSubIndex++;
                }
                renderStep();
            } catch (err) {
                console.error("Error al seleccionar rol:", err);
                alert("Hubo un error al guardar tu elección. Inténtalo de nuevo.");
            }
        };

    } else if (question.type === 'pergamino') {
        // --- INTERFAZ DE PERGAMINO (MÓDULO 4) ---
        container.innerHTML = `
            <div class="question-slide">
                <h4>${step.stage}</h4>
                <p style="color:#666; font-style:italic; margin-bottom:15px;">${step.instructions}</p>
                <div class="pergamino-container">
                    <textarea id="answerInput" class="pergamino-input" placeholder="Escribe aquí tu carta desde el alma..."></textarea>
                </div>
            </div>
        `;
        setTimeout(() => document.getElementById('answerInput')?.focus(), 100);

    } else if (question.type === 'ritual_closure') {
        // --- RITUAL DE CIERRE ALQUÍMICO ---
        document.getElementById('nextQBtn').style.display = 'none';
        document.getElementById('prevQBtn').style.display = 'none';
        document.getElementById('finishModuleBtn').style.display = 'none';

        container.innerHTML = `
            <div class="question-slide ritual-closure-ui">
                <h4>${step.stage}</h4>
                <p style="color:#666; font-style:italic; margin-bottom:15px;">${step.instructions}</p>
                <div class="ritual-vibration">🌌</div>
                <h3 class="question-text">${question.text}</h3>
                <button id="sellarBtn" class="sellar-btn">✦ SELLAR Y TRANSMUTAR ✦</button>
            </div>
        `;

        document.getElementById('sellarBtn').onclick = async () => {
            const btn = document.getElementById('sellarBtn');
            btn.disabled = true;
            btn.innerText = "TRANSMUTANDO...";

            // Efecto visual: FLASH + Transmutación
            const slide = container.querySelector('.question-slide');

            // Creamos dinámicamente el overlay de flash
            const flash = document.createElement('div');
            flash.className = 'ritual-flash';
            container.appendChild(flash);

            // Activamos efectos con pequeño delay para sincronismo
            setTimeout(() => {
                flash.classList.add('active');
                slide.classList.add('transmuting');
            }, 50);

            // Guardamos hito simbólico
            userAnswers[question.id] = "Sello de Alquimia emitido";
            // Bypassing input check y pasando a la IA
            setTimeout(() => {
                finishModuleWithAI(cachedSupabase, cachedUser, true);
            }, 1800);
        };

    } else if (question.type === 'belief_transmuter') {
        // --- TRANSMUTADOR DE CREENCIAS (MÓDULO 5) ---
        container.innerHTML = `
            <div class="question-slide">
                <h4>${step.stage}</h4>
                <p style="color:#666; font-style:italic; margin-bottom:15px;">${step.instructions}</p>
                <div class="transmuter-grid">
                    <div class="belief-box limiting">
                        <label>Sombra (Creencia Limitante)</label>
                        <textarea id="limitingInput" readonly placeholder="Identificando tu bloqueo principal..."></textarea>
                    </div>
                    <div class="transmuter-arrow">→</div>
                    <div class="belief-box empowering">
                        <label>Luz (Verdad Potenciadora)</label>
                        <textarea id="empoweringInput" placeholder="Escribe aquí tu nueva verdad..."></textarea>
                    </div>
                </div>
                <input type="hidden" id="answerInput"> 
            </div>
        `;

        const limitInput = document.getElementById('limitingInput');
        const empowerInput = document.getElementById('empoweringInput');
        const dummy = document.getElementById('answerInput');

        // Función para autocompletar la sombra mediante IA
        const autofillShadow = async () => {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intent: "identify_limiting_belief",
                        message: "Analiza el historial para extraer 1 creencia.",
                        context: JSON.stringify(journeyContext)
                    })
                });
                const data = await response.json();
                if (data.text) {
                    limitInput.value = data.text.trim();
                    updateDummy();
                }
            } catch (err) {
                console.error("Error identificando creencia:", err);
                limitInput.value = "Mi voz tiene miedo de ser juzgada."; // Fallback
                limitInput.readOnly = false;
            }
        };

        const updateDummy = () => {
            dummy.value = `Sombra: ${limitInput.value} | Luz: ${empowerInput.value}`;
        };

        limitInput.oninput = updateDummy;
        empowerInput.oninput = updateDummy;

        autofillShadow(); // Disparamos la detección automática en background

    } else if (question.type === 'purpose_guide') {
        // --- GUÍA DE PROPÓSITO (3 ACTOS) ---
        container.innerHTML = `
            <div class="question-slide">
                <h4>${step.stage}</h4>
                <p style="color:#666; font-style:italic; margin-bottom:15px;">${step.instructions}</p>
                <div class="purpose-acts">
                    <div class="purpose-act">
                        <h5>Acto 1: La Visión (El Mundo Ideal)</h5>
                        <p class="guide-note">Máximo 25 palabras.</p>
                        <textarea id="visionInput" placeholder="¿Cómo es el mundo que sueñas?"></textarea>
                    </div>
                    <div class="purpose-act">
                        <h5>Acto 2: La Misión (Tu Canto Hoy)</h5>
                        <textarea id="missionInput" placeholder="¿Cómo ayuda tu voz a esa visión hoy?"></textarea>
                    </div>
                    <div class="purpose-act">
                        <h5>Acto 3: El Futuro (10 años)</h5>
                        <textarea id="futureInput" placeholder="¿Dónde está tu voz en una década?"></textarea>
                    </div>
                </div>
                <input type="hidden" id="answerInput">
            </div>
        `;

        const v = document.getElementById('visionInput');
        const m = document.getElementById('missionInput');
        const f = document.getElementById('futureInput');
        const dummy = document.getElementById('answerInput');

        const updateDummy = () => {
            dummy.value = `Visión: ${v.value} | Misión: ${m.value} | Futuro: ${f.value}`;
        };
        v.oninput = updateDummy;
        m.oninput = updateDummy;
        f.oninput = updateDummy;

    } else if (question.type === 'action_plan') {
        // --- PLAN DE ACCIÓN SMART (AUTOGENERADO POR IA) ---
        container.innerHTML = `
        <div class="question-slide">
            <h4>${step.stage}</h4>
            <p style="color:#666; font-style:italic; margin-bottom:15px;">${step.instructions}</p>
            <div class="action-plan-grid">
                <div class="plan-section">
                    <h5>🎯 Consejos del Mentor (Objetivos SMART)</h5>
                    <textarea id="smartInput" readonly placeholder="El Mentor está diseñando tus metas..."></textarea>
                </div>
                <div class="plan-section">
                    <h5>🌿 Tu Rutina de Autocuidado</h5>
                    <textarea id="routineInput" readonly placeholder="El Mentor está preparando tu rutina diaria..."></textarea>
                </div>
            </div>
            <input type="hidden" id="answerInput">
        </div>
    `;

        const s = document.getElementById('smartInput');
        const r = document.getElementById('routineInput');
        const dummy = document.getElementById('answerInput');

        const updateDummy = () => {
            dummy.value = `Objetivos SMART: ${s.value} | Rutina Autocuidado: ${r.value}`;
        };

        const autofillActionPlan = async () => {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intent: "generate_action_plan",
                        message: "Genera el plan de cierre basado en el historial.",
                        context: JSON.stringify(journeyContext)
                    })
                });
                const data = await response.json();

                // Limpieza básica de posible markdown
                const cleanJson = data.text.replace(/```json|```/g, '').trim();
                const plan = JSON.parse(cleanJson);

                if (plan.smart_goals && plan.self_care_routine) {
                    s.value = plan.smart_goals;
                    r.value = plan.self_care_routine;
                    s.readOnly = false; // Permitimos editar por si quiere ajustar algo
                    r.readOnly = false;
                    updateDummy();
                }
            } catch (err) {
                console.error("Error generando plan de acción:", err);
                s.value = "Objetivo: Cantar 10 minutos al día con presencia. Medir: Cada noche. Alcanzable: Sí. Relevante: Sí. Tiempo: 1 mes.";
                r.value = "1. Respiración consciente (3 min).\n2. Sirenas vocales suaves (5 min).\n3. Canto intuitivo libre (2 min).";
                s.readOnly = false;
                r.readOnly = false;
                updateDummy();
            }
        };

        s.oninput = updateDummy;
        r.oninput = updateDummy;

        autofillActionPlan();

    } else {
        // --- RENDER ESTÁNDAR (TEXTO) ---
        container.innerHTML = `
            <div class="question-slide">
                <h4>${step.stage}</h4>
                <p style="color:#666; font-style:italic; margin-bottom:15px;">${step.instructions}</p>
                <h3 class="question-text">${question.text}</h3>
                ${question.type === 'long_text'
                ? `<textarea id="answerInput" placeholder="Escribe aquí tu sentir..."></textarea>`
                : `<input type="text" id="answerInput" placeholder="Tu respuesta...">`
            }
            </div>
        `;
        setTimeout(() => document.getElementById('answerInput')?.focus(), 100);
    }

    const nextBtn = document.getElementById('nextQBtn');
    if (currentQuestionSubIndex === step.questions.length - 1 && currentStepIndex < module.steps.length - 1) {
        nextBtn.innerText = "Siguiente Etapa ➤";
    } else {
        nextBtn.innerText = "Siguiente";
    }

    setTimeout(() => document.getElementById('answerInput')?.focus(), 100);
}

function renderLoading(msg) {
    const container = document.getElementById('questionContainer');
    // We use a more elegant transition style
    container.innerHTML = `
        <div class="question-slide transition-screen" style="text-align:center; padding:60px 20px;">
            <div class="loading-alchemy">
                <div class="alchemy-circle"></div>
                <div class="alchemy-icon">🔮</div>
            </div>
            <h3 style="margin-top:25px; color:var(--color-acento);">${msg}</h3>
            <p style="opacity:0.7; font-style:italic;">Analizando tu historia para personalizar el siguiente paso...</p>
        </div>
    `;
    document.getElementById('nextQBtn').style.display = 'none';
    document.getElementById('prevQBtn').style.display = 'none';
}

async function nextStep(supabase, user) {
    const input = document.getElementById('answerInput');
    if (!input.value.trim()) return alert("Por favor, responde para continuar.");

    const module = currentModuleData;
    const step = module.steps[currentStepIndex];
    const question = step.questions[currentQuestionSubIndex];

    userAnswers[question.id] = input.value;

    // Save to global context for AI
    journeyContext.push({
        stage: step.stage,
        question: question.text,
        answer: input.value
    });

    if (currentQuestionSubIndex === step.questions.length - 1) {
        // Preparar hito antes de enviarlo
        const hitoData = {
            etapa: step.stage,
            respuestas: { ...userAnswers },
            fecha: new Date().toISOString()
        };

        console.log(`💾 Guardando Paso '${step.stage}'...`, hitoData);
        await guardarHitoJSON(supabase, user, step.field, hitoData);

        userAnswers = {}; // Reset local answers for next step

        if (currentStepIndex < module.steps.length - 1) {
            // Check if NEXT step is dynamic and empty
            const nextStepObj = module.steps[currentStepIndex + 1];
            if (nextStepObj.dynamic && nextStepObj.questions.length === 0) {
                renderLoading(`${nextStepObj.stage}`);
                // Ensure at least 1.2 seconds to avoid "flash" and feel intentional
                await Promise.all([
                    generateDynamicQuestions(nextStepObj, journeyContext),
                    new Promise(resolve => setTimeout(resolve, 1200))
                ]);
            }

            currentStepIndex++;
            currentQuestionSubIndex = 0;
            renderStep();
            return;
        }
    } else {
        currentQuestionSubIndex++;
        renderStep();
    }
}

function prevStep() {
    const module = currentModuleData;

    if (currentQuestionSubIndex > 0) {
        // Simple: go back one question within current step
        currentQuestionSubIndex--;
        renderStep();
    } else if (currentStepIndex > 0) {
        // Go back to previous step's last question
        currentStepIndex--;
        const prevStep = module.steps[currentStepIndex];
        currentQuestionSubIndex = prevStep.questions.length - 1;
        renderStep();
    } else {
        // We're at the very first question of the module
        // Go back to intro
        isIntroView = true;
        renderIntro();
    }
}

async function generateDynamicQuestions(stepObj, context) {
    console.log("Generating questions for:", stepObj.stage);

    try {
        const historyText = JSON.stringify(context);
        const questionsAsked = context.map(c => c.question).join(" | ");

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: "generate_questions",
                message: `Etapa: ${stepObj.stage}. Preguntas previas: ${questionsAsked}`,
                context: historyText
            })
        });

        const data = await response.json();
        const jsonStr = data.text.replace(/```json|```/g, '').trim();
        const newQuestions = JSON.parse(jsonStr);

        // Ensure we only keep 1 question
        stepObj.questions = newQuestions.slice(0, 1);
        console.log("Pregunta de etapa generada:", stepObj.questions[0].text);

    } catch (e) {
        console.error("Error generating questions:", e);
        // Fallback question if AI fails
        stepObj.questions = [
            { id: "fallback_1", text: "¿Qué sientes en tu cuerpo al recordar esta etapa de tu vida?", type: "long_text" }
        ];
    }
}

async function guardarHitoJSON(supabase, user, column, newObject, extraPayload = {}) {
    try {
        if (!user || !user.id) {
            console.error("❌ SUPABASE: No hay usuario autenticado en el objeto 'user'.", user);
            alert("Error: No se detectó sesión de usuario. Por favor, cierra sesión y vuelve a entrar.");
            return;
        }

        console.log(`[DEBUG SUPABASE] Iniciando guardado...`);
        console.log(`- URL: ${supabase?.supabaseUrl}`);
        console.log(`- User ID: ${user.id}`);
        console.log(`- Columna: ${column}`);
        console.log(`- Datos a añadir:`, newObject);

        // 1. Obtener registro actual
        const { data: currentRecord, error: fetchError } = await supabase
            .from('user_coaching_data')
            .select(column)
            .eq('user_id', user.id)
            .maybeSingle();

        if (fetchError) {
            console.error("❌ SUPABASE Error Fetch Detallado:", fetchError);
        } else {
            console.log("📡 Datos actuales recuperados:", currentRecord);
        }

        // 2. Preparar datos
        let currentArray = [];
        if (currentRecord && currentRecord[column] && Array.isArray(currentRecord[column])) {
            currentArray = currentRecord[column];
        }

        // Evitar duplicados exactos (mismo hito y respuestas similares en un tiempo corto o idénticas)
        const isDuplicate = currentArray.some(item => {
            const sameEtapa = item.etapa === newObject.etapa;
            const sameAnswers = JSON.stringify(item.respuestas) === JSON.stringify(newObject.respuestas);

            // Si es la misma etapa y respuestas, es duplicado
            if (sameEtapa && sameAnswers) return true;

            // Si es la misma etapa y se guardó hace menos de 5 segundos, sospechamos de duplicado por doble clic
            const itemTime = new Date(item.fecha).getTime();
            const newTime = new Date(newObject.fecha).getTime();
            if (sameEtapa && Math.abs(newTime - itemTime) < 5000) return true;

            return false;
        });

        if (!isDuplicate) {
            currentArray.push(newObject);
            console.log(`- Nuevo array preparado (${currentArray.length} hitos)`);
        } else {
            console.warn("⚠️ Hito duplicado o muy reciente detectado, omitiendo push.");
            return; // No guardamos si es duplicado
        }

        // 3. Upsert crítico
        const payload = {
            user_id: user.id,
            [column]: currentArray,
            updated_at: new Date().toISOString(),
            ...extraPayload
        };
        console.log("🚀 Enviando Payload Upsert:", payload);

        const { data: upsertData, error: upsertError } = await supabase
            .from('user_coaching_data')
            .upsert(payload, { onConflict: 'user_id' })
            .select();

        if (upsertError) {
            console.error("❌ SUPABASE Error Upsert Detallado:", {
                message: upsertError.message,
                details: upsertError.details,
                hint: upsertError.hint,
                code: upsertError.code
            });

            let message = upsertError.message;
            if (upsertError.code === '42703') {
                message = `La columna '${column}' no existe en la tabla. Asegúrate de haber ejecutado el SQL para añadirla.`;
            }

            alert("⚠️ Error de Base de Datos (Upsert):\nMensaje: " + message + "\nCódigo: " + upsertError.code);
            throw upsertError;
        }

        console.log("✅ SUPABASE: ¡Guardado exitoso confirmado!", upsertData);
    } catch (e) {
        console.error("❌ ERROR CRÍTICO EN LA FUNCIÓN DE GUARDADO:", e);
        alert("Error crítico al guardar. Revisa la consola (F12) para detalles técnicos.");
    }
}

async function finishModuleWithAI(supabase, user, skipInputCheck = false) {
    const input = document.getElementById('answerInput');
    const module = currentModuleData;
    const step = module.steps[currentStepIndex];
    const question = step.questions[currentQuestionSubIndex];

    if (!skipInputCheck) {
        if (!input || !input.value.trim()) return alert("Por favor, responde antes de finalizar.");
        userAnswers[question.id] = input.value;
        journeyContext.push({ stage: step.stage, question: question.text, answer: input.value });
    }

    const hitoData = {
        etapa: step.stage,
        respuestas: { ...userAnswers },
        fecha: new Date().toISOString()
    };

    // console.log("💾 Finalizando módulo, guardando último hito...", hitoData);
    // await guardarHitoJSON(supabase, user, step.field, hitoData);
    // COMENTADO: Ya se guarda en el último nextStep() antes de llamar a esta función.
    // Evitamos duplicidad de cajas.

    // --- DISPARADOR DE EMAIL DE HITO (Brevo) ---
    // Al actualizar 'last_hito_completed', el Webhook de Supabase lanzará el email automáticamente.
    if (module.id >= 1 && module.id <= 5) {
        const updateData = { last_hito_completed: module.id };

        // Si termina el viaje completo (M5), guardamos la fecha de finalización
        if (module.id === 5) {
            updateData.journey_completed_at = new Date().toISOString();
            updateData.email_post_viaje_enviado = false; // Reset por si acaso
        }

        await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('user_id', user.id);

        // Sincronizar localmente y generar resumen de perfil proactivamente
        if (window.userProfile) window.userProfile.last_hito_completed = module.id;
        if (window.generarYGuardarResumen) {
            console.log("🎯 Disparando resumen de perfil tras hito...");
            window.generarYGuardarResumen();
        }

        console.log(`🎯 Perfil actualizado: Módulo ${module.id} completado.`);
    }

    const container = document.getElementById('questionContainer');
    container.innerHTML = `
        <div class="question-slide" style="text-align:center;">
            <h3>🔮 Conectando con el Mentor...</h3>
            <p>Analizando tu historia vocal...</p>
        </div>
    `;

    try {
        const historia = JSON.stringify(journeyContext);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: "alchemy_analysis",
                message: "Módulo 1 completado.",
                context: historia
            })
        });

        const data = await response.json();
        const isLastModule = currentModuleIndex === MODULES_METADATA.length - 1;
        const fixedLogoText = isLastModule
            ? "<strong>Has completado tu Gran Obra. Tu voz ya no es un eco de tus miedos o de tus ancestros, sino el canal de tu propósito.</strong><br><br>"
            : "";

        container.innerHTML = `
            <div class="question-slide">
                <h3 style="color:var(--color-acento)">✨ Tu Lectura de Alquimia</h3>
                <p style="font-size:1.1em; line-height:1.6; padding:15px; background:#f9f9f9; border-radius:10px;">
                    ${fixedLogoText} ${data.text}
                </p>
                <button id="closeModuleBtn" class="journey-btn" style="width:100%; margin-top:20px;">
                    ${isLastModule ? 'Continuar a mi Graduación' : 'Finalizar Módulo'}
                </button>
            </div>
        `;

        document.getElementById('nextQBtn').style.display = 'none';
        document.getElementById('finishModuleBtn').style.display = 'none';
        document.getElementById('prevQBtn').style.display = 'none';

        document.getElementById('closeModuleBtn').onclick = () => {
            if (currentModuleIndex === MODULES_METADATA.length - 1) {
                // --- CEREMONIA DE GRADUACIÓN ---
                const vision = userAnswers["proposito_actos"] || "Mi voz es mi canal de luz.";
                // Limpiamos la visión si viene con prefijos de los actos
                const cleanVision = vision.split('|')[0].replace('Visión:', '').trim();

                container.innerHTML = `
                    <div class="diploma-container">
                        <div class="diploma-shine"></div>
                        <div class="diploma-header">Orden de la Alquimia Vocal</div>
                        <h1 class="diploma-title">Diploma de Alquimista</h1>
                        <p class="diploma-text">Se certifica que has completado la Gran Obra de transmutar tu silencio en sonido auténtico.</p>
                        <div class="diploma-vision">
                            "${cleanVision}"
                        </div>
                        <div class="diploma-footer">
                            <span>Sello de la Voz Libre</span>
                            <span>${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button id="finalCloseBtn" class="journey-btn" style="width:100%; margin-top:20px;">Cerrar Viaje</button>
                `;

                document.getElementById('finalCloseBtn').onclick = () => {
                    document.getElementById('moduloModal').style.display = 'none';
                    document.getElementById('viajeModal').style.display = 'flex';
                    renderRoadmap();
                };
            } else {
                alert(`¡Felicidades! Módulo completado. El mapa se actualizará.`);
                document.getElementById('moduloModal').style.display = 'none';
                document.getElementById('viajeModal').style.display = 'flex';
                renderRoadmap();
            }
        };

    } catch (e) {
        console.error("Error en finalización AI:", e);
        // UNLOCK EVEN ON ERROR
        if (currentModuleIndex < MODULES_METADATA.length - 1) {
            localStorage.setItem(`module_${MODULES_METADATA[currentModuleIndex + 1].id}_unlocked`, 'true');
        }
        alert("¡Módulo finalizado correctamente!");
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex';
        renderRoadmap();
    }
}
