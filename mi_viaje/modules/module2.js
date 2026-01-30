export default {
    id: 2,
    title: "Herencia y Raíces",
    icon: "🌳",
    intro: {
        text: "En este módulo, buscaremos identificar tus 'lealtades invisibles'. Descubriremos cómo el entorno en el que creciste moldeó la voz que tienes hoy.",
        buttonText: "Explorar mis raíces"
    },
    steps: [
        {
            id: "h2_step1",
            stage: "El Clima Emocional (Ambiente)",
            instructions: "Recuerda los sonidos de tu hogar. No solo las palabras, sino el volumen y la libertad sonora.",
            questions: [
                {
                    id: "h2_home_climate",
                    text: "¿En tu hogar de la infancia, ¿se permitía expresar el enfado o la tristeza a través del sonido (gritos, llanto, risa fuerte)?",
                    type: "long_text",
                    help: "Reflexiona sobre si en tu casa existía libertad para expresar sentimientos como el enfado, la tristeza o la alegría desbordante.\n\n**Punto clave:** Analiza si había 'patrones de silencio' donde ciertas emociones eran consideradas inaceptables o debían ocultarse para mantener la armonía familiar."
                }
            ],
            field: "herencia_raices"
        },
        {
            id: "h2_step2",
            stage: "La Herencia de los Referentes (Espejo)",
            instructions: "Busca en tu memoria auditiva el eco de tus padres.",
            questions: [
                {
                    id: "h2_ancestors_voice",
                    text: "Si cierras los ojos y escuchas la voz de tu madre o de tu padre... ¿qué adjetivo le darías? (¿Apretada, ausente, cálida, autoritaria?)",
                    type: "long_text",
                    help: "Observa la personalidad y el temperamento de los miembros de tu familia. Intenta mirarlos desde la distancia, como observador, desde la empatía y la comprensión.\n\n**Punto clave:** Piensa si su forma de comunicarse era abierta y directa, o si predominaba la evitación, la crítica o la falta de validación emocional."
                }
            ],
            field: "herencia_raices"
        },
        {
            id: "h2_step3",
            stage: "Lealtades Inconscientes (Patrones)",
            instructions: "Observa tu propia voz hoy cuando estás ante otros.",
            questions: [
                {
                    id: "h2_inherited_pattern",
                    text: "¿Sientes que al cantar o hablar en público 'heredas' esa misma cualidad que acabas de describir?",
                    type: "long_text",
                    help: "Identifica si existen patrones emocionales que se han transmitido de generación en generación.\n\n**Punto clave:** Considera si tus reacciones actuales (como retraerte o buscar aprobación) son en realidad ecos de dinámicas que observaste en tus abuelos o padres."
                }
            ],
            field: "herencia_raices"
        },
        {
            id: "h2_step4",
            stage: "El Lugar en el Clan",
            instructions: "Tu posición en el sistema familiar define tu espacio en el mundo.",
            questions: [
                {
                    id: "h2_family_role",
                    text: "¿Qué lugar ocupabas en tu familia y qué se esperaba de ti?",
                    type: "long_text",
                    help: "El rol que desempeñaste (hijo mayor, mediador, el 'callado', el protector) influye en cómo te relacionas con los demás hoy.\n\n**Punto clave:** Evalúa si ese rol te proporcionó seguridad en el pasado, pero ahora limita tu capacidad de ser auténtico y libre en tu vida diaria."
                }
            ],
            field: "herencia_raices"
        }
    ]
};
