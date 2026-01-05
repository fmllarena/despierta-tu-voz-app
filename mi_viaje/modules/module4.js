export default {
    id: 4,
    title: "El Altar de las Palabras",
    icon: "🖋️",
    intro: {
        text: "Este es el corazón emocional de tu viaje. Pasamos de analizar el pasado a liberarlo activamente en un espacio sagrado e íntimo.",
        buttonText: "Entrar al Altar"
    },
    steps: [
        {
            id: "h4_step1",
            stage: "Carta a mi Yo del Pasado",
            instructions: "Imagina a ese niño o joven que un día decidió callar. Tienes la oportunidad de decirle lo que necesitaba escuchar.",
            questions: [
                {
                    id: "carta_yo_pasado",
                    text: "¿Qué palabras de aliento necesitaba ese niño/a? Dale permiso para fallar, para gritar y para ser escuchado.",
                    type: "pergamino"
                }
            ],
            field: "carta_yo_pasado"
        },
        {
            id: "h4_step2",
            stage: "Carta a los Padres",
            instructions: "Nuestros padres nos dieron la vida y también los silencios. Vamos a devolverles lo que es suyo.",
            questions: [
                {
                    id: "carta_padres",
                    text: "Expresa lo que no pudiste decirles. Diles qué necesitabas para sentir que tu voz era libre.",
                    type: "pergamino"
                }
            ],
            field: "carta_padres"
        },
        {
            id: "h4_step3",
            stage: "El Ritual de la Alquimia",
            instructions: "Lo que has escrito se ha transformado. Asienta esta nueva libertad en tu cuerpo.",
            questions: [
                {
                    id: "h4_ritual",
                    text: "Emite un sonido largo y sostenido (una vocal) mientras pulsas 'Sellar' para transmutar estas palabras.",
                    type: "ritual_closure"
                }
            ],
            field: "ritual_sanacion"
        }
    ]
};
