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
            stage: "El Inventario de Creencias",
            instructions: "Revisa los miedos que identificamos y dales la vuelta. Transmuta cada 'impureza' en una verdad brillante.",
            questions: [
                { id: "creencia_transmutada", text: "Escribe una creencia que te limitaba y cómo la transformas hoy en una verdad potenciadora.", type: "belief_transmuter" }
            ],
            field: "inventario_creencias"
        },
        {
            id: "h5_step2",
            stage: "Guía de Propósito",
            instructions: "Clarifica tu visión y el impacto que deseas generar con tu sonido único.",
            questions: [
                { id: "proposito_actos", text: "Completa los 3 actos de tu propósito vocal.", type: "purpose_guide" }
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
