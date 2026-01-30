export default {
    id: 3,
    title: "El Personaje",
    icon: "🎭",
    intro: {
        text: "Aquí identificarás el 'rol' que has adoptado para sobrevivir. Ese papel que hoy puede estar limitando tu voz natural.",
        buttonText: "Descubrir mi máscara"
    },
    steps: [
        {
            id: "h3_step1",
            stage: "Identificación del Rol (La Máscara)",
            instructions: "Elige la tarjeta con la que más te identifiques hoy. Tu elección es el punto de partida.",
            questions: [
                { id: "h3_role_select", text: "¿Cuál es tu personaje dominante?", type: "roles_selection" }
            ],
            field: "roles_familiares"
        },
        {
            id: "h3_step2",
            stage: "La Ganancia Secundaria (La Protección)",
            instructions: "Observa las sombras detrás de tu máscara. Todo rol tiene una función.",
            questions: [
                {
                    id: "h3_secondary_gain",
                    text: "¿Qué crees que ganas (o de qué te proteges) cuando actúas desde este personaje?",
                    type: "long_text",
                    help: "Los roles son comportamientos que adoptamos para encajar o sobrevivir en nuestro entorno. Todo rol cumple una función protectora. Analiza si esta identidad es algo que eliges conscientemente o si es un 'personaje' que aparece automáticamente para sentirte seguro frente a los demás.\n\n**Punto clave:** Reflexiona sobre si este personaje te ayuda a evitar el conflicto, a obtener aprobación o a protegerte de una posible crítica o rechazo que experimentaste en el pasado."
                }
            ],
            field: "roles_familiares"
        },
        {
            id: "h3_step3",
            stage: "El Coste de la Máscara (La Limitación)",
            instructions: "Mantener un personaje tiene un precio vital.",
            questions: [
                {
                    id: "h3_vocal_cost",
                    text: "Cuando este personaje toma el control al cantar, ¿qué es lo primero que sacrificas: tu brillo, tu potencia, tu emoción o tu libertad?",
                    type: "long_text",
                    help: "Mantener un personaje suele implicar reprimir necesidades o emociones auténticas.\n\n**Punto clave:** Observa si por ser el 'fuerte' no te permites la vulnerabilidad, o si por ser el 'mediador' has dejado de expresar tus propias opiniones y deseos."
                }
            ],
            field: "roles_familiares"
        },
        {
            id: "h3_step4",
            stage: "Influencias Sociales (El Entorno)",
            instructions: "Miramos hacia afuera para entender lo de adentro.",
            questions: [
                {
                    id: "h3_social_influences",
                    text: "¿Cómo han moldeado las figuras influyentes de tu vida las decisiones y roles que asumes hoy?",
                    type: "long_text",
                    help: "A menudo buscamos parecernos a figuras exitosas o figuras de autoridad para sentirnos valorados.\n\n**Punto clave:** Considera si tus aspiraciones actuales son realmente tuyas o si son un intento de cumplir con lo que la sociedad o personas influyentes esperaban de ti."
                }
            ],
            field: "roles_familiares"
        }
    ]
};
