export const modules = [
    {
        id: 1,
        title: "El Espejo del Pasado",
        description: "Reconoce tu historia para liberar tu voz.",
        icon: "🪞",
        activity: "Línea de Vida Vocal",
        intro: {
            text: "Esta actividad es la base de todo el proceso. No es solo recordar fechas, sino detectar qué \"huella\" dejaron en la voz.",
            buttonText: "¡Estoy preparado/a!"
        },
        steps: [
            {
                id: "step1",
                stage: "La Infancia (La Semilla)",
                instructions: "Viaja a tu primer recuerdo vocal. Cierra los ojos y busca ese momento.",
                questions: [
                    { id: "h1_child_mem", text: "¿Cómo te recuerdas de niño/a?", type: "long_text" },
                    { id: "h1_child_emo", text: "¿Te gustaba estar con tus padres y familia o sentías que te debías esconder?", type: "text" }
                ],
                field: "linea_vida_hitos"
            },
            {
                id: "step2",
                stage: "La Adolescencia (El Cierre o la Apertura)",
                instructions: "La época del cambio. Observa si hubo un juicio externo o interno.",
                dynamic: true, // Indicates questions are AI-generated
                questions: [], // Placeholder
                field: "linea_vida_hitos"
            },
            {
                id: "step3",
                stage: "El Presente (La Toma de Conciencia)",
                instructions: "Hoy, aquí y ahora. La verdad te hará libre.",
                dynamic: true,
                questions: [], // Placeholder
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
        steps: [] // To be implemented
    },
    {
        id: 3,
        title: "El Personaje",
        description: "¿Quién crees que eres cuando cantas?",
        icon: "🎭",
        activity: "Máscaras Sonoras",
        steps: []
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

export function initJourney(supabaseClient, user) {
    console.log("Iniciando Mi Viaje 2.0 (Dynamic)...", user);
    renderRoadmap();

    // UI Events
    document.querySelector('.close-viaje').onclick = () => {
        document.getElementById('viajeModal').style.display = 'none';
    };
    document.querySelector('.close-modulo').onclick = () => {
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex';
    };

    document.getElementById('nextQBtn').onclick = () => nextStep(supabaseClient, user);
    document.getElementById('prevQBtn').onclick = prevStep;
    document.getElementById('finishModuleBtn').onclick = () => finishModuleWithAI(supabaseClient, user);
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
    const step = module.steps[currentStepIndex];

    // Safety check if dynamic questions aren't loaded yet
    if (step.dynamic && (step.questions.length === 0)) {
        renderLoading("Generando preguntas personalizadas...");
        return;
        // This shouldn't happen if logic flows correctly, but just in case.
    }

    const question = step.questions[currentQuestionSubIndex];

    const totalQ = module.steps.reduce((acc, s) => acc + (s.questions ? s.questions.length : 2), 0);
    // Estimated 2 for dynamic steps if empty

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
    container.innerHTML = `
        <div class="question-slide" style="text-align:center; padding:40px;">
            <div style="font-size:3em; animation:pulse 1s infinite;">🧠</div>
            <h3>${msg}</h3>
            <p>El Mentor está analizando tus respuestas previas...</p>
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
        // End of Step
        const hitoData = {
            etapa: step.stage,
            respuestas: { ...userAnswers },
            fecha: new Date().toISOString()
        };

        await guardarHitoJSON(supabase, user, step.field, hitoData);
        userAnswers = {};

        if (currentStepIndex < module.steps.length - 1) {
            // Check if NEXT step is dynamic and empty
            const nextStepObj = module.steps[currentStepIndex + 1];
            if (nextStepObj.dynamic && nextStepObj.questions.length === 0) {
                renderLoading(`Preparando etapa: ${nextStepObj.stage}`);
                await generateDynamicQuestions(nextStepObj, journeyContext);
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
    if (currentQuestionSubIndex > 0) {
        currentQuestionSubIndex--;
        renderStep();
    } else if (currentStepIndex > 0) {
        alert("Ya has completado la etapa anterior. Continúa hacia adelante.");
    } else {
        isIntroView = true;
        renderIntro();
    }
}

async function generateDynamicQuestions(stepObj, context) {
    console.log("Generating questions for:", stepObj.stage);

    try {
        const historyText = JSON.stringify(context);
        const prompt = `
            [SISTEMA: GENERACIÓN DE PREGUNTAS DE COACHING]
            Contexto del usuario hasta ahora: ${historyText}
            
            Tu objetivo: Generar 2 preguntas de coaching vocal profundo para la siguiente etapa: "${stepObj.stage}".
            
            Reglas:
            1. Las preguntas deben estar personalizadas basándose en las respuestas anteriores del usuario.
            2. Etapa Adolescencia: Enfócate en cambios, juicios y bloqueos.
            3. Etapa Presente: Enfócate en la consciencia actual y la sanación.
            4. Devuelve ÚNICAMENTE un array JSON con este formato:
            [
                { "id": "dyn_1", "text": "¿Pregunta 1?", "type": "long_text" },
                { "id": "dyn_2", "text": "¿Pregunta 2?", "type": "text" }
            ]
        `;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt, history: [] })
        });

        const data = await response.json();
        const jsonStr = data.text.replace(/```json|```/g, '').trim();
        const newQuestions = JSON.parse(jsonStr);

        // Assign to step object
        stepObj.questions = newQuestions;

    } catch (e) {
        console.error("Error generating questions:", e);
        // Fallback questions if AI fails
        stepObj.questions = [
            { id: "fallback_1", text: "Si pudieras decirle algo a tu voz en esta etapa, ¿qué sería?", type: "long_text" },
            { id: "fallback_2", text: "¿Qué sientes en tu cuerpo al recordar esto?", type: "text" }
        ];
    }
}

async function guardarHitoJSON(supabase, user, column, newObject) {
    // ... (Misma lógica de guardado) ...
    try {
        let { data: currentData } = await supabase.from('user_coaching_data').select(column).eq('user_id', user.id).single();
        let currentArray = (currentData && currentData[column] && Array.isArray(currentData[column])) ? currentData[column] : [];
        currentArray.push(newObject);
        await supabase.from('user_coaching_data').upsert({ user_id: user.id, [column]: currentArray, updated_at: new Date() }, { onConflict: 'user_id' });
    } catch (e) { console.error(e); }
}

async function finishModuleWithAI(supabase, user) {
    const input = document.getElementById('answerInput');
    if (input.value.trim()) {
        const module = modules[currentModuleIndex];
        const step = module.steps[currentStepIndex];
        const previousQ = step.questions[currentQuestionSubIndex]; // Get actual question object

        // Push last answer to context
        journeyContext.push({ stage: step.stage, question: previousQ.text, answer: input.value });

        const hitoData = {
            etapa: step.stage,
            respuestas: { ...userAnswers, ultimo: input.value },
            fecha: new Date().toISOString()
        };
        await guardarHitoJSON(supabase, user, step.field, hitoData);
    }

    const container = document.getElementById('questionContainer');
    container.innerHTML = `
        <div class="question-slide" style="text-align:center;">
            <h3>🔮 Conectando con el Mentor...</h3>
            <p>Analizando tu historia vocal...</p>
        </div>
    `;

    try {
        const historia = JSON.stringify(journeyContext); // Use local memory context for speed/accuracy

        const promptAnalysis = `
            [SISTEMA: ANÁLISIS DE HITO FINALIZADO]
            El usuario ha completado el Módulo 1.
            Respuestas: ${historia}.
            
            Tarea: Breve análisis alquímico (3 frases) detectando el patrón emocional repetitivo y validando al usuario.
        `;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: promptAnalysis, history: [] })
        });

        const data = await response.json();

        container.innerHTML = `
            <div class="question-slide">
                <h3 style="color:var(--color-acento)">✨ Tu Lectura de Alquimia</h3>
                <p style="font-size:1.1em; line-height:1.6; padding:15px; background:#f9f9f9; border-radius:10px;">
                    ${data.text}
                </p>
                <button id="closeModuleBtn" class="nav-btn journey-btn" style="width:100%; margin-top:20px;">Guardar y Volver al Mapa</button>
            </div>
        `;

        document.getElementById('nextQBtn').style.display = 'none';
        document.getElementById('finishModuleBtn').style.display = 'none';
        document.getElementById('prevQBtn').style.display = 'none';

        document.getElementById('closeModuleBtn').onclick = () => {
            localStorage.setItem(`module_2_unlocked`, 'true');
            alert("Módulo 1 completado. Has desbloqueado 'Herencia y Raíces'.");
            document.getElementById('moduloModal').style.display = 'none';
            document.getElementById('viajeModal').style.display = 'flex';
            renderRoadmap();
        };

    } catch (e) {
        console.error("Error AI analysis:", e);
        alert("Error de conexión con el Mentor.");
        document.getElementById('moduloModal').style.display = 'none';
        renderRoadmap();
    }
}
