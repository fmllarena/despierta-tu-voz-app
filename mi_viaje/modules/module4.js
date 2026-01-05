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
                    type: "pergamino",
                    help: "Este ejercicio busca fomentar la autocompasión y la comprensión de tu trayectoria personal. Escribe una carta a tu yo de niño, adolescente o joven adulto. Reflexiona sobre qué consejo te darías basándote en lo que has aprendido. Este ejercicio te ayuda a conectar con las diferentes etapas de tu vida y a reconocer cómo has evolucionado.\n\n**Punto clave:** Reconoce que en aquel momento hiciste lo mejor que pudiste con los recursos y la información que tenías. Ofrécete el perdón y el aliento que te hubiera gustado recibir entonces."
                }
            ],
            field: "carta_yo_pasado"
        },
        {
            id: "h4_step2",
            stage: "Carta a tus Padres",
            instructions: "Nuestros padres nos dieron la vida y también los silencios. Vamos a devolverles lo que es suyo.",
            questions: [
                {
                    id: "carta_padres",
                    text: "Expresa lo que no pudiste decirles. Diles qué necesitabas para sentir que tu voz era libre.",
                    type: "pergamino",
                    help: "El objetivo es explorar y sanar las dinámicas familiares, identificando cómo influyeron en tu expresión emocional actual. Si este espacio te parece corto, toma papel y boli y escribe. El objetivo es comunicar tus sentimientos de manera clara y respetuosa, y buscar una mayor comprensión. Explica cómo te afectaron sus acciones, comentarios o actitudes. Utiliza un lenguaje 'yo' para expresar tus sentimientos y experiencias desde tu perspectiva. Por ejemplo, 'Me sentí triste cuando...', en lugar de 'Tú me hiciste sentir triste'. Permítete expresar tanto las emociones positivas como las negativas.\n\n**Punto clave:** Expresa tus sentimientos de manera honesta pero compasiva. No se trata de juzgar, sino de ganar comprensión y trabajar hacia una relación más saludable contigo mismo."
                }
            ],
            field: "carta_padres"
        },
        {
            id: "h4_step3",
            stage: "Identificación de Heridas (Localización)",
            instructions: "Identifica los nudos que aún hoy limitan tu sonido.",
            questions: [
                {
                    id: "h4_wounds_id",
                    text: "¿Qué eventos específicos del pasado sientes que podrían limitar tu libertad hoy?",
                    type: "long_text",
                    help: "Identificar momentos clave, como críticas o experiencias de rechazo, ayuda a entender el origen de tus bloqueos actuales.\n\n**Punto clave:** Al validar estas experiencias sin juzgarlas, permites que dejen de ser un obstáculo invisible y comiencen a integrarse como parte de tu aprendizaje."
                }
            ],
            field: "sanacion_heridas"
        },
        {
            id: "h4_step4",
            stage: "El Perdón y la Liberación (Resolución)",
            instructions: "Suelta los pesos que no son tuyos para caminar más ligero.",
            questions: [
                {
                    id: "h4_forgiveness",
                    text: "¿Qué peso o expectativa familiar estás listo para soltar en este momento?",
                    type: "long_text",
                    help: "La sanación ocurre cuando decides dejar de cargar con creencias o roles que no te pertenecen.\n\n**Punto clave:** Al ofrecer perdón —a otros y a ti mismo— creas un espacio nuevo para vivir con mayor libertad y plenitud."
                }
            ],
            field: "sanacion_heridas"
        },
        {
            id: "h4_step5",
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
