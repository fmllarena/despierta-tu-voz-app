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
};
