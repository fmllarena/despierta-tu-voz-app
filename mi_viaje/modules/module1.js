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
                {
                    id: "h1_child_mem",
                    text: "¿Cómo te recuerdas de niño/a? ¿Quién era la voz de autoridad?",
                    type: "long_text",
                    help: "Las experiencias vitales de esta etapa dejan huellas profundas que pueden manifestarse en la voz. Recuerdos generales y musicales de la infancia pueden influir en la confianza, la expresión emocional y la relación con la propia voz. Un comentario negativo o positivo puede afectar a la capacidad de cómo expresarse libremente. Tomar conciencia de estas vivencias permite resignificarlas y liberar la voz auténtica.\n\nIdentificar quién tomaba las decisiones y marcaba las reglas te ayuda a entender bajo qué mirada creciste. Observa si te sentías alguien libre y espontáneo o si sentías la necesidad de cumplir con expectativas ajenas para ser validado."
                },
                {
                    id: "h1_child_emo",
                    text: "¿Te gustaba estar con tu familia o sentías que te debías esconder?",
                    type: "text",
                    help: "Reflexiona sobre el clima de seguridad emocional en tu hogar. Analiza si el ambiente familiar te invitaba a mostrarte tal como eras o si, por el contrario, percibías que era más seguro pasar desapercibido para evitar conflictos o juicios."
                }
            ],
            field: "linea_vida_hitos"
        },
        {
            id: "step2",
            stage: "La Adolescencia (El Cierre o la Apertura)",
            instructions: "La época del cambio. Observa si hubo un juicio externo o interno.",
            questions: [
                {
                    id: "h1_adol_voice",
                    text: "Durante tu adolescencia, cuando el cuerpo cambia... ¿Hubo algún momento donde sentiste que 'perdiste' tu voz o dejaste de cantar por miedo al juicio?",
                    type: "long_text",
                    help: "La adolescencia es el momento en que empezamos a buscar nuestra identidad fuera del núcleo familiar. Piensa si en esta etapa te sentiste empoderado para explorar tus propios límites o si asumiste roles (como el mediador o el callado) para encajar en tus nuevos grupos sociales."
                }
            ],
            field: "linea_vida_hitos"
        },
        {
            id: "step3",
            stage: "El Presente (La Toma de Conciencia)",
            instructions: "Hoy, aquí y ahora. La verdad te hará libre.",
            questions: [
                {
                    id: "h1_pres_voice",
                    text: "Hoy, cuando cantas para otros... ¿cómo te sientes? Seguro que disfrutas haciéndolo, pero...¿cantas para expresar o cantas para intentar agradar al que te oye?",
                    type: "long_text",
                    help: "Observa si te permites ser vulnerable y auténtico con los demás o si mantienes 'máscaras' de protección que heredaste del pasado. Analiza si tus comportamientos actuales son una respuesta consciente a tus deseos o si sigues operando bajo antiguos patrones de defensa."
                }
            ],
            field: "linea_vida_hitos"
        }
    ]
};
