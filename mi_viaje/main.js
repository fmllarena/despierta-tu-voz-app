export const modules = [
    {
        id: 1,
        title: "El Espejo del Pasado",
        description: "Reconoce tu historia para liberar tu voz.",
        icon: "🪞",
        activity: "Línea de Tiempo de Vida",
        questions: [
            { id: "h1_q1", text: "¿Qué evento de tu infancia sientes que marcó tu confianza al cantar hoy?", type: "text", field: "linea_vida_hitos" },
            { id: "h1_q2", text: "¿Qué emociones asocias a ese recuerdo?", type: "text", field: "linea_vida_hitos" }
        ]
    },
    {
        id: 2,
        title: "Herencia y Raíces",
        description: "Sana los patrones familiares heredados.",
        icon: "🌳",
        activity: "Árbol Genealógico Emocional",
        questions: [
            { id: "h2_q1", text: "¿Había patrones de silencio o crítica en tu hogar?", type: "text", field: "arbol_genealogico" },
            { id: "h2_q2", text: "¿Qué emociones eran consideradas 'inaceptables' en tu familia?", type: "text", field: "arbol_genealogico" }
        ]
    },
    {
        id: 3,
        title: "El Personaje",
        description: "Desmonta los roles que limitan tu expresión.",
        icon: "🎭",
        activity: "Identificación de Roles",
        questions: [
            { id: "h3_q1", text: "¿Eras el 'perfeccionista' o el 'mediador'?", type: "text", field: "roles_familiares" },
            { id: "h3_q2", text: "¿Cómo influye ese rol en tu búsqueda de aprobación al cantar?", type: "text", field: "roles_familiares" }
        ]
    },
    {
        id: 4,
        title: "Sanación de la Voz",
        description: "Libera las emociones reprimidas con amor.",
        icon: "💌",
        activity: "Cartas de Alquimia",
        questions: [
            { id: "h4_q1", text: "¿Qué consejo le darías a tu yo adolescente basándote en lo que sabes hoy?", type: "long_text", field: "carta_yo_pasado" },
            { id: "h4_q2", text: "¿Qué necesitas de tus padres en el presente para sentirte validado?", type: "long_text", field: "carta_padres" }
        ]
    },
    {
        id: 5,
        title: "Tu Nueva Identidad",
        description: "Transforma tu narrativa y alza el vuelo.",
        icon: "🦅",
        activity: "Alquimia y Propósito",
        questions: [
            { id: "h5_q1", text: "Cambia 'Mi voz suena fea' por una creencia potenciadora:", type: "text", field: "inventario_creencias" },
            { id: "h5_q2", text: "Define tu visión ideal del mundo en 25 palabras:", type: "text", field: "proposito_vida" },
            { id: "h5_q3", text: "Visión a 10 años: ¿Cómo suena tu voz libre?", type: "text", field: "proposito_vida" }
        ]
    }
];

let currentModuleIndex = 0;
let currentQuestionIndex = 0;
let userAnswers = {}; // Cache local temporal

export function initJourney(supabaseClient, user) {
    console.log("Iniciando Mi Viaje...", user);
    renderRoadmap();

    // Event Listeners
    document.querySelector('.close-viaje').onclick = () => {
        document.getElementById('viajeModal').style.display = 'none';
    };
    document.querySelector('.close-modulo').onclick = () => {
        document.getElementById('moduloModal').style.display = 'none';
        document.getElementById('viajeModal').style.display = 'flex'; // Volver al mapa
    };

    // Navegación de preguntas
    document.getElementById('nextQBtn').onclick = () => nextQuestion(supabaseClient, user);
    document.getElementById('prevQBtn').onclick = prevQuestion;
    document.getElementById('finishModuleBtn').onclick = () => finishModule(supabaseClient, user);
}

function renderRoadmap() {
    const container = document.getElementById('journeyRoadmap');
    container.innerHTML = '';

    modules.forEach((mod, index) => {
        const isUnlocked = index === 0 || localStorage.getItem(`module_${index}_unlocked`); // Lógica simple por ahora

        const node = document.createElement('div');
        node.className = `roadmap-node ${isUnlocked ? 'unlocked' : 'locked'}`;
        node.onclick = () => {
            if (isUnlocked) openModule(index);
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

        // Línea conectora
        if (index < modules.length - 1) {
            const line = document.createElement('div');
            line.className = 'roadmap-line';
            container.appendChild(line);
        }
    });
}

function openModule(index) {
    currentModuleIndex = index;
    currentQuestionIndex = 0;
    userAnswers = {}; // Resetear respuestas temporales para este módulo

    document.getElementById('viajeModal').style.display = 'none';
    document.getElementById('moduloModal').style.display = 'flex';

    renderQuestion();
}

function renderQuestion() {
    const module = modules[currentModuleIndex];
    const question = module.questions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');

    const isLast = currentQuestionIndex === module.questions.length - 1;

    document.getElementById('nextQBtn').style.display = isLast ? 'none' : 'inline-block';
    document.getElementById('finishModuleBtn').style.display = isLast ? 'inline-block' : 'none';
    document.getElementById('prevQBtn').disabled = currentQuestionIndex === 0;

    container.innerHTML = `
        <div class="question-slide">
            <h4>${module.activity} (${currentQuestionIndex + 1}/${module.questions.length})</h4>
            <h3 class="question-text">${question.text}</h3>
            ${question.type === 'long_text'
            ? `<textarea id="answerInput" placeholder="Escribe tu reflexión aquí..."></textarea>`
            : `<input type="text" id="answerInput" placeholder="Tu respuesta...">`
        }
        </div>
    `;

    // Auto-focus
    setTimeout(() => document.getElementById('answerInput').focus(), 100);
}

async function nextQuestion(supabase, user) {
    const input = document.getElementById('answerInput');
    if (!input.value.trim()) return alert("Por favor, escribe una respuesta para avanzar.");

    // Guardar temporalmente
    const currentQ = modules[currentModuleIndex].questions[currentQuestionIndex];
    userAnswers[currentQ.id] = input.value;

    // Guardar en Supabase (cada paso cuenta)
    await saveProgress(supabase, user, currentQ.field, input.value);

    currentQuestionIndex++;
    renderQuestion();
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

async function finishModule(supabase, user) {
    const input = document.getElementById('answerInput');
    if (input && input.value.trim()) {
        const currentQ = modules[currentModuleIndex].questions[currentQuestionIndex];
        await saveProgress(supabase, user, currentQ.field, input.value);
    }

    // Desbloquear siguiente módulo
    if (currentModuleIndex < modules.length - 1) {
        localStorage.setItem(`module_${currentModuleIndex + 1}_unlocked`, 'true');
    }

    alert("¡Módulo completado! Tus respuestas han sido guardadas en tu viaje.");
    document.getElementById('moduloModal').style.display = 'none';
    document.getElementById('viajeModal').style.display = 'flex';
    renderRoadmap();
}

async function saveProgress(supabase, user, field, value) {
    console.log(`Guardando ${field}:`, value);

    // Para simplificar, estamos guardando el último valor.
    // En una implementación real más compleja, podríamos querer hacer append.
    // Como Supabase upsert reemplaza, si es JSONB podríamos hacer merge, 
    // pero aquí asumiremos que el campo es texto o JSON simple y guardamos el objeto completo si es complejo.

    // Nota: La estructura solicitada tenía campos específicos. 
    // Para roles_familiares, etc., si queremos guardar histórico, necesitaríamos lógica extra.
    // Por ahora, upsert básico.

    try {
        const { error } = await supabase
            .from('user_coaching_data')
            .upsert({
                user_id: user.id,
                [field]: value,
                updated_at: new Date()
            }, { onConflict: 'user_id' }); // Asegura que actualice la fila del usuario

        if (error) throw error;
    } catch (err) {
        console.error("Error guardando progreso:", err);
    }
}
