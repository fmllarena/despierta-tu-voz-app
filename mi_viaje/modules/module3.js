export default {
    id: 3,
    title: "El Personaje",
    icon: "🎭",
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
};
