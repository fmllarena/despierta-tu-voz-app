export default {
    id: 1,
    title: "El Espejo del Pasado",
    icon: "🪞",
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
};
