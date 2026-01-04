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
                    { id: "h1_child_mem", text: "¿Qué es lo primero que recuerdas que te dijeran sobre tu voz cuando eras niño/a?", type: "long_text" },
                    { id: "h1_child_emo", text: "¿Sentiste que tu voz era un lugar seguro o algo que debías esconder?", type: "text" }
                ],
                field: "linea_vida_hitos"
            },
            {
                id: "step2",
                stage: "La Adolescencia (El Cierre o la Apertura)",
                instructions: "La época del cambio. Observa si hubo un juicio externo o interno.",
                questions: [
                    { id: "h1_teen_mem", text: "¿Hubo algún momento donde sentiste que 'perdiste' tu voz o dejaste de cantar por miedo?", type: "long_text" },
                    { id: "h1_teen_body", text: "¿En qué parte del cuerpo sientes hoy la tensión de ese recuerdo? (Garganta, pecho, estómago...)", type: "text" }
                ],
                field: "linea_vida_hitos"
            },
            {
                id: "step3",
                stage: "El Presente (La Toma de Conciencia)",
                instructions: "Hoy, aquí y ahora. La verdad te hará libre.",
                questions: [
                    { id: "h1_now_mask", text: "Cuando cantas para otros, qué sientes... ¿ intentas gustar o expresarte a través del canto?", type: "text" },
                    { id: "h1_now_heal", text: "Ahora que te ves en la distancia, escribe una frase para ese niño/a que no se atrevió a sonar.", type: "long_text" }
                ],
                field: "linea_vida_hitos"
            }
        ]
    }
    // Otros módulos se irán implementando...
];

let currentModuleIndex = 0;
let currentStepIndex = 0;
let currentQuestionSubIndex = 0;
let userAnswers = {}; // Cache local temporal para el paso actual
let isIntroView = true; // State for Intro Screen

export function initJourney(supabaseClient, user) {
    console.log("Iniciando Mi Viaje 2.0...", user);
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

    // Create SVG Layer
    // We add it first so it sits behind nodes naturally (though z-index handles it too)
    const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgLayer.setAttribute("class", "roadmap-svg-layer");
    svgLayer.setAttribute("id", "roadmapSvg");
    container.appendChild(svgLayer);

    modules.forEach((mod, index) => {
        const isUnlocked = index === 0 || localStorage.getItem(`module_${mod.id}_unlocked`);
        const node = document.createElement('div');
        node.className = `roadmap-node ${isUnlocked ? 'unlocked' : 'locked'}`;
        node.onclick = () => { if (isUnlocked) openModule(index); };

        node.innerHTML = `
            <div class="node-icon">${mod.icon}</div>
            <div class="node-info">
                <h3>Módulo ${mod.id}: ${mod.title}</h3>
                <p>${mod.description}</p>
            </div>
            <div class="node-status">${isUnlocked ? '▶' : '🔒'}</div>
        `;
        container.appendChild(node);
    });

    // Draw lines after layout
    setTimeout(drawRoadmapLines, 100);
    window.addEventListener('resize', drawRoadmapLines);
}

function drawRoadmapLines() {
    const svg = document.getElementById('roadmapSvg');
    if (!svg) return;

    // Clear existing paths
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }

    const nodes = document.querySelectorAll('.roadmap-node');
    const container = document.getElementById('journeyRoadmap');

    if (nodes.length < 2) return;

    // Recalculate SVG size to match scrollHeight if needed
    // But since it's 100% height of relative container, it should match.

    for (let i = 0; i < nodes.length - 1; i++) {
        const nodeA = nodes[i];
        const nodeB = nodes[i + 1];

        // Get coordinates relative to container
        const posA = {
            left: nodeA.offsetLeft,
            top: nodeA.offsetTop,
            width: nodeA.offsetWidth,
            height: nodeA.offsetHeight
        };
        const posB = {
            left: nodeB.offsetLeft,
            top: nodeB.offsetTop,
            width: nodeB.offsetWidth,
            height: nodeB.offsetHeight
        };

        // Determine Start and End points based on alternating layout
        // Even index (0, 2): Left Side -> Connect from Right edge
        // Odd index (1, 3): Right Side -> Connect from Left edge

        let startX, startY, endX, endY;

        // Node A
        if (i % 2 === 0) { // Left Node
            startX = posA.left + posA.width;
            startY = posA.top + posA.height / 2;
        } else { // Right Node
            startX = posA.left;
            startY = posA.top + posA.height / 2;
        }

        // Node B
        if ((i + 1) % 2 === 0) { // Next is Left Node
            endX = posB.left + posB.width; // Connect to its Right edge? No, usually snake connects Left-Right-Right-Left
            // Wait: 
            // 0(L) -> 1(R).  Start: 0.Right. End: 1.Left.
            // 1(R) -> 2(L).  Start: 1.Left.  End: 2.Right.

            endX = posB.left + posB.width;
            endY = posB.top + posB.height / 2;
        } else { // Next is Right Node
            endX = posB.left;
            endY = posB.top + posB.height / 2;
        }

        // Adjust Control Points for Curve
        // If going Left->Right: Start Handle +X, End Handle -X
        // If going Right->Left: Start Handle -X, End Handle +X

        const isGoingRight = endX > startX;
        const offset = Math.abs(endY - startY) * 0.5; // Curve depth based on vertical distance

        const cp1X = isGoingRight ? startX + 50 : startX - 50;
        const cp1Y = startY;

        const cp2X = isGoingRight ? endX - 50 : endX + 50;
        const cp2Y = endY;

        // Create Path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

        path.setAttribute("d", d);
        path.setAttribute("class", "roadmap-path");

        // Unlock status styling for line? 
        // If nodeA is unlocked, line is unlocked? Or NodeB?
        // Let's keep it simple gold for now.

        svg.appendChild(path);
    }
}

function openModule(index) {
    currentModuleIndex = index;
    const module = modules[currentModuleIndex];

    // Check if module has Intro
    isIntroView = !!module.intro;

    currentStepIndex = 0;
    currentQuestionSubIndex = 0;
    userAnswers = {};

    document.getElementById('viajeModal').style.display = 'none';
    document.getElementById('moduloModal').style.display = 'flex';
    document.getElementById('questionContainer').innerHTML = '';

    // Si tiene Intro, mostramos Intro. Si no, renderStep directamente.
    if (isIntroView) {
        renderIntro();
    } else {
        renderStep();
    }
}

function renderIntro() {
    const module = modules[currentModuleIndex];
    const container = document.getElementById('questionContainer');

    // Ocultar botones de navegación estándar
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
    if (!module.steps) {
        alert("Módulo en construcción");
        return;
    }

    const step = module.steps[currentStepIndex];
    const question = step.questions[currentQuestionSubIndex];

    // Calculate progress (Logic remains same)
    const totalQ = module.steps.reduce((acc, s) => acc + s.questions.length, 0);
    const currentAbsoluteQ = module.steps.slice(0, currentStepIndex).reduce((acc, s) => acc + s.questions.length, 0) + currentQuestionSubIndex + 1;
    const progressPercent = (currentAbsoluteQ / totalQ) * 100;

    const isLastOfModule = (currentStepIndex === module.steps.length - 1) && (currentQuestionSubIndex === step.questions.length - 1);

    document.getElementById('nextQBtn').style.display = isLastOfModule ? 'none' : 'inline-block';
    document.getElementById('finishModuleBtn').style.display = isLastOfModule ? 'inline-block' : 'none';
    document.getElementById('prevQBtn').style.display = 'inline-block'; // Show Prev button

    // Inject Progress Bar HTML if not exists
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

    // Dynamic Button Text
    const nextBtn = document.getElementById('nextQBtn');
    if (currentQuestionSubIndex === step.questions.length - 1 && currentStepIndex < module.steps.length - 1) {
        nextBtn.innerText = "Guardar Etapa ➤";
    } else {
        nextBtn.innerText = "Siguiente";
    }

    setTimeout(() => document.getElementById('answerInput')?.focus(), 100);
}

async function nextStep(supabase, user) {
    const input = document.getElementById('answerInput');
    if (!input.value.trim()) return alert("Por favor, escribe algo para continuar. Tu voz importa.");

    const module = modules[currentModuleIndex];
    const step = module.steps[currentStepIndex];
    const question = step.questions[currentQuestionSubIndex];

    userAnswers[question.id] = input.value;
    userAnswers[question.type === 'text' ? 'short' : 'long'] = input.value;

    if (currentQuestionSubIndex === step.questions.length - 1) {
        const hitoData = {
            etapa: step.stage,
            respuestas: { ...userAnswers },
            fecha: new Date().toISOString()
        };

        await guardarHitoJSON(supabase, user, step.field, hitoData);
        userAnswers = {};

        if (currentStepIndex < module.steps.length - 1) {
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
        // Allow going back to previous step? 
        // Logic gets complex if data was already saved.
        // For simplicity, we restart specific navigation or show alert.
        alert("Ya has completado la etapa anterior. Continúa tu viaje hacia adelante.");
    } else {
        // Go back to Intro?
        isIntroView = true;
        renderIntro();
    }
}

async function guardarHitoJSON(supabase, user, column, newObject) {
    console.log(`Guardando Hito en ${column}:`, newObject);
    try {
        let { data: currentData } = await supabase
            .from('user_coaching_data')
            .select(column)
            .eq('user_id', user.id)
            .single();

        let currentArray = [];
        if (currentData && currentData[column] && Array.isArray(currentData[column])) {
            currentArray = currentData[column];
        }

        currentArray.push(newObject);

        const { error } = await supabase
            .from('user_coaching_data')
            .upsert({
                user_id: user.id,
                [column]: currentArray,
                updated_at: new Date()
            }, { onConflict: 'user_id' });

        if (error) throw error;

    } catch (e) {
        console.error("Error guardando hito:", e);
    }
}

async function finishModuleWithAI(supabase, user) {
    const input = document.getElementById('answerInput');
    if (input.value.trim()) {
        const module = modules[currentModuleIndex];
        const step = module.steps[currentStepIndex];
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
        let { data: fullData } = await supabase
            .from('user_coaching_data')
            .select('linea_vida_hitos')
            .eq('user_id', user.id)
            .single();

        const historia = JSON.stringify(fullData?.linea_vida_hitos || []);

        const promptAnalysis = `
            [SISTEMA: ANÁLISIS DE HITO FINALIZADO]
            El usuario ha completado el Módulo 1: "Línea de Vida".
            Aquí están sus respuestas en formato JSON: ${historia}.
            
            Tu tarea:
            1. Analiza emocionalmente sus respuestas.
            2. Detecta el patrón repetitivo.
            3. Responde como el Mentor Alquimista.
            4. Sé breve, empático y profundo.
        `;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: promptAnalysis,
                history: []
            })
        });

        const data = await response.json();
        const aiText = data.text;

        container.innerHTML = `
            <div class="question-slide">
                <h3 style="color:var(--color-acento)">✨ Tu Lectura de Alquimia</h3>
                <p style="font-size:1.1em; line-height:1.6; padding:15px; background:#f9f9f9; border-radius:10px;">
                    ${aiText}
                </p>
                <button id="closeModuleBtn" class="nav-btn journey-btn" style="width:100%; margin-top:20px;">Guardar y Volver al Mapa</button>
            </div>
        `;

        document.getElementById('nextQBtn').style.display = 'none';
        document.getElementById('finishModuleBtn').style.display = 'none';
        document.getElementById('prevQBtn').style.display = 'none'; // Hide prev button too

        document.getElementById('closeModuleBtn').onclick = () => {
            // Unlock next module
            localStorage.setItem(`module_2_unlocked`, 'true');
            alert("Módulo 1 completado. Has desbloqueado 'Herencia y Raíces'.");
            document.getElementById('moduloModal').style.display = 'none';
            document.getElementById('viajeModal').style.display = 'flex';
            renderRoadmap();
        };

    } catch (e) {
        console.error("Error AI analysis:", e);
        alert("Módulo guardado, pero el Mentor está meditando (Error de conexión).");
        document.getElementById('moduloModal').style.display = 'none';
        renderRoadmap();
    }
}
