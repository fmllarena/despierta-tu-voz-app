export default {
    id: 5,
    title: "Alquimia Final y Propósito",
    icon: "🦅",
    intro: {
        text: "Has llegado al punto de expansión. Es momento de dejar de mirar atrás para construir tu nueva identidad y alinear tu voz con tu misión en el mundo.",
        buttonText: "Despertar mi voz"
    },
    steps: [
        {
            id: "h5_step1",
            stage: "El Inventario de Creencias (Transmutación)",
            instructions: "Revisa los miedos que identificamos y dales la vuelta. Transmuta cada 'impureza' en una verdad brillante.",
            questions: [
                {
                    id: "creencia_transmutada",
                    text: "Escribe una creencia que te limitaba y cómo la transformas hoy en una verdad potenciadora.",
                    type: "belief_transmuter",
                    help: "De la creencia limitadora que te proponga el Mentor crea una creencia potenciadora que la reemplace. Por ejemplo: Si crees 'Mi voz no es buena', puedes reemplazarlo por 'Mi voz es única y tiene su propia belleza'. Si crees 'Tengo que ser perfecto para cantar', puedes reemplazarlo por 'Puedo disfrutar del canto en cada paso porque tengo algo importante que expresar a través de mi voz, y merezco ser escuchado'.\n\n**Punto clave:** Observa cómo las ideas negativas sobre tu capacidad condicionan tus decisiones y busca una nueva narrativa que te dé confianza."
                }
            ],
            field: "inventario_creencias"
        },
        {
            id: "h5_step2",
            stage: "Guía de Propósito",
            instructions: "Clarifica tu visión y el impacto que deseas generar con tu sonido único.",
            questions: [
                {
                    id: "proposito_actos",
                    text: "Completa los 3 actos de tu propósito vocal.",
                    type: "purpose_guide",
                    help: "En el primer apartado, te invito a escribir tu visión ideal del mundo en 25 palabras, cómo te gustaría ver este mundo en el que vives. Este ejercicio te ayudará a clarificar tus valores y a entender qué mundo quieres ayudar a crear con tu personalidad, tu voz y tu arte.\n\nEn el segundo apartado expresa cómo favoreces en el presente a esa visión ideal del mundo. Tu misión es el puente entre tu visión y tu realidad actual, la forma en que utilizas tus talentos y habilidades para hacer del mundo un lugar mejor.\n\nEn el tercer apartado, te impulsaremos a escribir cómo te imaginas tu vida personal y profesional dentro de 10 años. No te limites, conéctate con lo que ves, con lo que aparece en tu cabeza. Aquí, todo es posible. Esta visión te servirá como fuente de inspiración y motivación en tu camino como cantante holístico.\n\n**Punto clave:** No busques respuestas correctas; utiliza un lenguaje que resuene contigo y que capture la esencia de lo que quieres aportar a los demás."
                }
            ],
            field: "proposito_vida"
        },
        {
            id: "h5_step3",
            stage: "Plan de Acción y Cierre",
            instructions: "Definamos tus metas reales y una rutina que mantenga viva tu nueva libertad.",
            questions: [
                { id: "final_plan", text: "¿Cuáles son tus próximos pasos?", type: "action_plan" }
            ],
            field: "plan_accion"
        }
    ]
};
