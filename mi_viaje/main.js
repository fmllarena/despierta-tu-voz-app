const ROLES_ALQUIMIA = {
    perfeccionista: {
        titulo: "El Perfeccionista",
        lema: "Mi voz debe ser impecable. Si no es perfecta, mejor no sonar.",
        icon: "💎"
    },
    mediador: {
        titulo: "El Mediador",
        lema: "Canto para agradar y suavizar tensiones. Mi voz es complaciente.",
        icon: "🕊️"
    },
    invisible: {
        titulo: "El Invisible",
        lema: "Prefiero no destacar. Si mi voz es pequeña, estoy a salvo.",
        icon: "👻"
    },
    fuerte: {
        titulo: "El Fuerte",
        lema: "Mi voz es mi escudo. Siempre suena potente pero rígida.",
        icon: "🛡️"
    }
};

export const modules = [
    {
        id: 1,
        title: "El Espejo del Pasado",
        description: "Reconoce tu historia para liberar tu voz.",
        icon: "🪞",
        activity: "Línea de Vida Vocal",
        intro: {
            text: "Esta actividad es la base de todo el proceso. No es solo recordar fechas, sino detectar qué 'huella emocional' dejaron en ti.",
            buttonText: "¡Estoy preparado/a!"
        },
        steps: [
            {
                id: "step1",
                stage: "La Infancia (La Semilla)",
                instructions: "Viaja a tus primeros recuerdos. Cierra los ojos y busca ese momento.",
                questions: [
                    { id: "h1_child_mem", text: "¿Cómo te recuerdas de niño/a?¿Quién era la voz de autoridad?", type: "long_text" },
                    { id: "h1_child_emo", text: "¿Te gustaba estar con tu familia o sentías que te debías esconder?", type: "text" }
                ],
                field: "linea_vida_hitos"
            },
            {
                id: "step2",
                stage: "La Adolescencia (El Cierre o la Apertura)",
                instructions: "La época del cambio. Observa si hubo un juicio externo o interno.",
                questions: [
                    { id: "h1_adol_voice", text: "Durante tu adolescencia, cuando el cuerpo cambia... ¿Hubo algún momento donde sentiste que 'perdiste' tu voz o dejaste de cantar por miedo al juicio?", type: "long_text" }
                ],
                field: "linea_vida_hitos"
            },
            {
                id: "step3",
                stage: "El Presente (La Toma de Conciencia)",
                instructions: "Hoy, aquí y ahora. La verdad te hará libre.",
                questions: [
                    { id: "h1_pres_voice", text: "Hoy, cuando cantas para otros... ¿cómo te sientes? Seguro que disfrutas haciéndolo, pero...¿cantas para expresar o cantas para intentar agradar al que te oye?", type: "long_text" }
                ],
                field: "linea_vida_hitos"
            }
        ]
    },
    {
        id: 2,
        title: "Herencia y Raíces",
        description: "Desbloquea los patrones familiares heredados.",
        icon: "🌳",
        activity: "Constelación Vocal",
        intro: {
            text: "En este módulo, buscaremos identificar tus 'lealtades invisibles'. Descubriremos cómo el entorno en el que creciste moldeó la voz que tienes hoy.",
            buttonText: "Explorar mis raíces"
        },
        steps: [
            {
                id: "h2_step1",
                stage: "El Clima Vocal en Casa",
                instructions: "Recuerda los sonidos de tu hogar. No solo las palabras, sino el volumen y la libertad sonora.",
                questions: [
                    { id: "h2_home_climate", text: "¿En tu hogar de la infancia, ¿se permitía expresar el enfado o la tristeza a través del sonido (gritos, llanto, risa fuerte)?", type: "long_text" }
                ],
                field: "herencia_raices"
            },
            {
                id: "h2_step2",
                stage: "La Voz de los Ancestros",
                instructions: "Busca en tu memoria auditiva el eco de tus padres.",
                questions: [
                    { id: "h2_ancestors_voice", text: "Si cierras los ojos y escuchas la voz de tu madre o de tu padre... ¿qué adjetivo le darías? (¿Apretada, ausente, cálida, autoritaria?)", type: "long_text" }
                ],
                field: "herencia_raices"
            },
            {
                id: "h2_step3",
                stage: "El Patrón Heredado",
                instructions: "Observa tu propia voz hoy cuando estás ante otros.",
                questions: [
                    { id: "h2_inherited_pattern", text: "¿Sientes que al cantar o hablar en público 'heredas' esa misma cualidad que acabas de describir?", type: "long_text" }
                ],
                field: "herencia_raices"
            }
        ]
    },
    {
        id: 3,
        title: "El Personaje",
        description: "¿Quién crees que eres cuando cantas?",
        icon: "🎭",
        activity: "Máscaras Sonoras",
        intro: {
            text: "Aquí identificarás el 'rol' que has adoptado para sobrevivir. Ese papel que hoy está limitando tu voz natural.",
            buttonText: "Descubrir mi máscara"
        },
        steps: [
            {
                id: "h3_step1",
                stage: "La Pantalla de Selección",
                instructions: "Elige la tarjeta con la que más te identifiques hoy.",
                questions: [
                    { id: "h3_role_select", text: "¿Cuál es tu personaje dominante?", type: "roles_selection" }
                ],
                field: "roles_familiares"
            },
            {
                id: "h3_step2",
                stage: "Dinámica de Profundización",
                instructions: "Observa las sombras detrás de tu máscara.",
                questions: [
                    { id: "h3_secondary_gain", text: "¿Qué crees que ganas (o de qué te proteges) cuando actúas desde este personaje?", type: "long_text" },
                    { id: "h3_vocal_cost", text: "Cuando este personaje toma el control al cantar, ¿qué es lo primero que sacrificas: tu brillo, tu potencia, tu emoción o tu libertad?", type: "long_text" }
                ],
                field: "roles_familiares"
            }
        ]
    },
    {
        id: 4,
        title: "Sanación de la Voz",
        description: "Rehabilitando el instrumento desde la emoción.",
        icon: "❤️‍🩹",
        activity: "Frecuencias Curativas",
        steps: []
    },
    {
        id: 5,
        title: "Voz Real y Expansión",
        description: "Tu sonido auténtico, libre y potente.",
        icon: "🦅",
        activity: "Vuelo Vocal",
        steps: []
    }
];

let currentModuleIndex = 0;
let currentStepIndex = 0;
let currentQuestionSubIndex = 0;
let userAnswers = {};
let isIntroView = true;

// GLOBAL STORAGE for cumulative answers to feed the AI
let journeyContext = [];

let cachedSupabase = null;
let cachedUser = null;

export function initJourney(supabaseClient, user) {
    cachedSupabase = supabaseClient;
    cachedUser = user;
    console.log("Iniciando Mi Viaje 2.0 (Dynamic)...", user);
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

function renderRoadmap() {
    const container = document.getElementById('journeyRoadmap');
    container.innerHTML = '';

    // No JS SVG layer anymore. We use intermediate connector divs.

    modules.forEach((mod, index) => {
        const isUnlocked = index === 0 || localStorage.getItem(`module_${mod.id}_unlocked`);

        // 1. Render Node
        const node = document.createElement('div');
        node.className = `roadmap-node ${isUnlocked ? 'unlocked' : 'locked'}`;
        node.onclick = () => {
            if (isUnlocked) {
                if (mod.steps && mod.steps.length > 0) {
                    openModule(index);
                } else {
                    alert("Este módulo aún no está disponible (Próximamente).");
                }
            }
        };

        node.innerHTML = `
            <div class="node-icon">${mod.icon}</div>
            <div class="node-info">
                <h3>Módulo ${mod.id}: ${mod.title}</h3>
                <p>${mod.description}</p>
            </div>
            <div class="node-status">${isUnlocked ? '▶' : '🔒'}</div>
        `;
        container.appendChild(node);

        // 2. Render Connector to the NEXT node (if exists)
        if (index < modules.length - 1) {
            const connector = document.createElement('div');
            connector.className = 'roadmap-connector';

            let pathD = "";

            // Logic for Alternating Curve
            if (index % 2 === 0) {
                // Even Index (0): Starts Left. Next (1) is Right.
                // Connector goes Left -> Right.
                pathD = "M 30% 0 C 30% 55, 70% 25, 70% 100%";
            } else {
                // Odd Index (1): Starts Right. Next (2) is Left.
                // Connector goes Right -> Left.
                pathD = "M 70% 0 C 70% 55, 30% 25, 30% 100%";
            }

            connector.innerHTML = `<svg><path class="connector-path" d="${pathD}" vector-effect="non-scaling-stroke"></path></svg>`;
            container.appendChild(connector);
        }
    });
}

function openModule(index) {
    currentModuleIndex = index;
    const module = modules[currentModuleIndex];
    isIntroView = !!module.intro;
    currentStepIndex = 0;
    currentQuestionSubIndex = 0;
    userAnswers = {};
    journeyContext = []; // Reset context for new module run

    document.getElementById('viajeModal').style.display = 'none';
    document.getElementById('moduloModal').style.display = 'flex';
    document.getElementById('questionContainer').innerHTML = '';

    if (isIntroView) {
        renderIntro();
    } else {
        renderStep();
    }
}

function renderIntro() {
    const module = modules[currentModuleIndex];
    const container = document.getElementById('questionContainer');

    document.getElementById('nextQBtn').style.display = 'none';
    document.getElementById('prevQBtn').style.display = 'none';
    document.getElementById('finishModuleBtn').style.display = 'none';

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
    const module = modules[currentModuleIndex];
    if (!module) return console.error("❌ Módulo no encontrado");
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
                await guardarHitoJSON(cachedSupabase, cachedUser, step.field, hito);
                console.log("✅ OK Supabase");

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
                // Restaurar la función si falla
                renderStep();
            }
        };

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

    const module = modules[currentModuleIndex];
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
    const module = modules[currentModuleIndex];

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

async function guardarHitoJSON(supabase, user, column, newObject) {
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

        // Evitar duplicados exactos
        const isDuplicate = currentArray.some(item =>
            item.etapa === newObject.etapa &&
            JSON.stringify(item.respuestas) === JSON.stringify(newObject.respuestas)
        );

        if (!isDuplicate) {
            currentArray.push(newObject);
            console.log(`- Nuevo array preparado (${currentArray.length} hitos)`);
        } else {
            console.warn("⚠️ Hito duplicado detectado, omitiendo push.");
        }

        // 3. Upsert crítico
        const payload = {
            user_id: user.id,
            [column]: currentArray,
            updated_at: new Date().toISOString()
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
            alert("⚠️ Error de Base de Datos (Upsert):\nMensaje: " + upsertError.message + "\nCódigo: " + upsertError.code + "\nDetalle: " + (upsertError.details || "Ninguno"));
            throw upsertError;
        }

        console.log("✅ SUPABASE: ¡Guardado exitoso confirmado!", upsertData);
    } catch (e) {
        console.error("❌ ERROR CRÍTICO EN LA FUNCIÓN DE GUARDADO:", e);
        alert("Error crítico al guardar. Revisa la consola (F12) para detalles técnicos.");
    }
}

async function finishModuleWithAI(supabase, user) {
    const input = document.getElementById('answerInput');
    if (!input.value.trim()) return alert("Por favor, responde antes de finalizar.");

    const module = modules[currentModuleIndex];
    const step = module.steps[currentStepIndex];
    const question = step.questions[currentQuestionSubIndex];

    // standardizing userAnswers inclusion
    userAnswers[question.id] = input.value;

    // Guardar contexto para IA
    journeyContext.push({ stage: step.stage, question: question.text, answer: input.value });

    const hitoData = {
        etapa: step.stage,
        respuestas: { ...userAnswers },
        fecha: new Date().toISOString()
    };

    console.log("💾 Finalizando módulo, guardando último hito...", hitoData);
    await guardarHitoJSON(supabase, user, step.field, hitoData);

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

        // RESILIENT UNLOCK: Unlock before rendering the UI
        if (currentModuleIndex < modules.length - 1) {
            const nextId = modules[currentModuleIndex + 1].id;
            localStorage.setItem(`module_${nextId}_unlocked`, 'true');
            console.log("Módulo desbloqueado proactivamente:", nextId);
        }

        container.innerHTML = `
            <div class="question-slide">
                <h3 style="color:var(--color-acento)">✨ Tu Lectura de Alquimia</h3>
                <p style="font-size:1.1em; line-height:1.6; padding:15px; background:#f9f9f9; border-radius:10px;">
                    ${data.text}
                </p>
                <button id="closeModuleBtn" class="nav-btn journey-btn" style="width:100%; margin-top:20px;">Finalizar Viaje</button>
            </div>
        `;

        document.getElementById('nextQBtn').style.display = 'none';
        document.getElementById('finishModuleBtn').style.display = 'none';
        document.getElementById('prevQBtn').style.display = 'none';

        document.getElementById('closeModuleBtn').onclick = () => {
            alert(`¡Felicidades! Módulo completado. El mapa se actualizará.`);
            document.getElementById('moduloModal').style.display = 'none';
            document.getElementById('viajeModal').style.display = 'flex';
            renderRoadmap();
        };

    } catch (e) {
        console.error("Error en finalización AI:", e);
        // UNLOCK EVEN ON ERROR
        if (currentModuleIndex < modules.length - 1) {
            localStorage.setItem(`module_${modules[currentModuleIndex + 1].id}_unlocked`, 'true');
        }
        alert("¡Módulo finalizado correctamente!");
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex';
        renderRoadmap();
    }
}
