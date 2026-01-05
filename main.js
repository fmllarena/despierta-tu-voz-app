// main.js - Lógica del cliente

// --- CONFIGURACIÓN DINÁMICA ---
let supabase;

async function inicializarSupabase() {
    try {
        // Obtenemos la configuración desde el servidor (para no tener llaves en el código)
        const response = await fetch('/api/config');
        const config = await response.json();

        if (window.supabase) {
            supabase = window.supabase.createClient(config.url, config.key);
            console.log("Supabase inicializado correctamente.");
            // Una vez inicializado, podemos saludar al usuario
            saludarUsuario();
        } else {
            console.error("Librería Supabase no encontrada en window.");
        }
    } catch (e) {
        console.error("Error cargando configuración de Supabase:", e);
    }
}

// Inicializamos al cargar el script
inicializarSupabase();

// --- DETECTAR REDIRECCIÓN DESDE LANDING ---
function revisarRedireccion() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'required' && authOverlay) {
        authOverlay.style.display = 'flex';
    }
}
window.addEventListener('load', revisarRedireccion);

// --- ELEMENTOS DEL DOM ---
const chatBox = document.getElementById('chatBox');
const chatMentoriaInput = document.getElementById('chatMentoriaInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const loginBtn = document.getElementById('loginBtn');
const signUpBtn = document.getElementById('signUpBtn');
const authOverlay = document.getElementById('authOverlay');
const authError = document.getElementById('authError');

// Ya no inicializamos Gemini aquí (se hace en el servidor)

// --- LÓGICA DE AUTENTICACIÓN Y SALUDO ---

const MENSAJE_BIENVENIDA = `
## Bienvenido/a a Despierta tu Voz

Hola, soy tu guía en **Despierta tu voz**.

Antes de que me cuentes cómo te encuentras, quiero invitarte a que hagas una pausa. Inhala profundamente y siente el aire en tu cuerpo.

Aquí no estamos buscando la nota perfecta, ni el aplauso de un jurado externo. Estamos aquí para transmutar tu esencia pura. Tu voz no es solo sonido; es un espejo de tu historia, de tus emociones y de los roles que has desempeñado en tu vida.

### ¿Qué puedes esperar de este viaje?

*   **Alquimia Vocal**: Aprenderás a ver tus bloqueos no como fallos, sino como mensajes de tu subconsciente que están listos para ser sanados.
*   **El Texto como Espejo**: Cada canción que elijas será una oportunidad para revisar tu trayectoria de vida y encontrar tu verdad en cada palabra.
*   **Un Espacio Seguro**: Aquí la vulnerabilidad no es debilidad, es tu mayor fuente de poder y autenticidad.

¿Estás listo para dejar de 'hacer' canto y empezar a 'ser' tu voz?

Cuéntame, para empezar nuestro camino... **¿Qué sientes que te impide hoy cantar con total libertad?**
`;

async function saludarUsuario() {
    if (!chatBox || !supabase) return;

    try {
        const { data, error } = await supabase.auth.getUser();
        const user = data?.user;

        // Limpiamos el chat para el mensaje de bienvenida
        chatBox.innerHTML = "";

        if (user) {
            // Verificamos si es la primera vez (si tiene perfil guardado)
            const { data: perfil } = await supabase
                .from('user_profiles')
                .select('ultimo_resumen')
                .eq('user_id', user.id)
                .single();

            const bienvenidaBtn = document.getElementById('bienvenidaBtn');
            const botiquinBtn = document.getElementById('botiquinBtn');
            if (bienvenidaBtn) bienvenidaBtn.style.display = 'block';
            if (botiquinBtn) botiquinBtn.style.display = 'block';

            if (!perfil || !perfil.ultimo_resumen) {
                // ES LA PRIMERA VEZ
                appendMessage(MENSAJE_BIENVENIDA, 'ia', 'msg-bienvenida');
            } else {
                // YA HA ENTRADO ANTES
                const email = user.email || "";
                const nombre = email.split('@')[0] || "viajero/a";
                const nombreCap = nombre.charAt(0).toUpperCase() + nombre.slice(1);
                appendMessage(`¡Hola, <strong>${nombreCap}</strong>! Qué alegría encontrarte de nuevo. Soy tu Mentor de voz, ¿cómo te sientes hoy?`, 'ia');
            }
        } else {
            const bienvenidaBtn = document.getElementById('bienvenidaBtn');
            const botiquinBtn = document.getElementById('botiquinBtn');
            if (bienvenidaBtn) bienvenidaBtn.style.display = 'none';
            if (botiquinBtn) botiquinBtn.style.display = 'none';
            appendMessage("<b>Bienvenido/a, soy tu Mentor Vocal privado. En este espacio sagrado, transformaremos tus inquietudes en el oro de tu auténtica voz. ¿Cómo te sientes hoy?</b>", 'ia');
        }
    } catch (e) {
        console.error("Error en saludarUsuario:", e);
    }
}

async function checkUser() {
    if (!supabase || !authOverlay) return;

    try {
        const { data, error } = await supabase.auth.getUser();
        const user = data?.user;

        if (user) {
            authOverlay.style.display = 'none';
            saludarUsuario();
            console.log("Sesión activa de:", user.email);
        } else {
            authOverlay.style.display = 'flex';
        }
    } catch (e) {
        console.error("Error en checkUser:", e);
        authOverlay.style.display = 'flex';
    }
}

// Ejecutar comprobación al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUser);
} else {
    checkUser();
}

signUpBtn.addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    if (!email || !password) {
        authError.innerText = "Por favor, completa todos los campos.";
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            authError.innerText = "Error al registrar: " + error.message;
        } else {
            alert("¡Registro casi listo! Revisa tu email para confirmar tu cuenta.");
        }
    } catch (e) {
        authError.innerText = "Error inesperado: " + e.message;
    }
});

// --- LÓGICA DE ENTER EN AUTH ---
document.getElementById('authEmail')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});
document.getElementById('authPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    if (!email || !password) {
        authError.innerText = "Por favor, completa todos los campos.";
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            authError.innerText = "Error: " + error.message;
        } else {
            authOverlay.style.display = 'none';
            saludarUsuario();
            console.log("Bienvenido:", data.user?.email);
        }
    } catch (e) {
        authError.innerText = "Error inesperado al entrar: " + e.message;
    }
});

// --- LÓGICA DE CONTEXTO DEL ALUMNO (SUPABASE) ---

async function obtenerContextoAlumno() {
    if (!supabase) return "";
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return "";

        // 1. Obtener Perfil (Datos estáticos de sesión anterior)
        const { data: perfil } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // 2. Obtener Viaje (Datos de los 5 módulos)
        const { data: viaje } = await supabase
            .from('user_coaching_data')
            .select('*')
            .eq('user_id', user.id)
            .single();

        let contexto = `\n[CONTEXTO PRIVADO DEL ALUMNO]\n`;

        if (perfil) {
            contexto += `- Historia Vocal Previa: ${perfil.historia_vocal || 'N/A'}\n`;
            contexto += `- Creencias Identificadas en Chat: ${perfil.creencias || 'N/A'}\n`;
            contexto += `- Nivel de Alquimia: ${perfil.nivel_alquimia || 1}/10\n`;
        }

        if (viaje) {
            contexto += `\n[DATOS DEL VIAJE "MI VIAJE"]\n`;
            if (viaje.linea_vida_hitos) contexto += `- Módulo 1 (Pasado): ${JSON.stringify(viaje.linea_vida_hitos.respuestas)}\n`;
            if (viaje.herencia_raices) contexto += `- Módulo 2 (Herencia): ${JSON.stringify(viaje.herencia_raices.respuestas)}\n`;
            if (viaje.roles_familiares) contexto += `- Módulo 3 (Personaje): ${JSON.stringify(viaje.roles_familiares.respuestas)}\n`;
            if (viaje.carta_yo_pasado) contexto += `- Módulo 4 (Sanación - Yo Pasado): ${JSON.stringify(viaje.carta_yo_pasado.respuestas)}\n`;
            if (viaje.carta_padres) contexto += `- Módulo 4 (Sanación - Padres): ${JSON.stringify(viaje.carta_padres.respuestas)}\n`;
            if (viaje.proposito_vida) contexto += `- Módulo 5 (Propósito): ${JSON.stringify(viaje.proposito_vida.respuestas)}\n`;
            if (viaje.plan_accion) contexto += `- Módulo 5 (Plan de Acción): ${JSON.stringify(viaje.plan_accion.respuestas)}\n`;
        }

        contexto += `\n------------------------\n`;
        return contexto;
    } catch (e) {
        console.error("Error en obtenerContextoAlumno:", e);
        return "";
    }
}

async function guardarResumenSesion(resumenTexto) {
    if (!supabase) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    ultimo_resumen: resumenTexto
                });
            console.log("Resumen de sesión guardado.");
        }
    } catch (e) {
        console.error("Error al guardar resumen:", e);
    }
}


// --- LÓGICA DEL CHAT AI ---

// Los prompts del sistema ahora residen de forma segura en el servidor (api/chat.js)
// para proteger la propiedad intelectual del Mentor.


let chatHistory = []; // El historial comenzará con el primer mensaje del usuario

// Función centralizadora para llamar a la IA de forma segura (nuestro backend protege los prompts)
async function llamarGemini(message, history = [], intent = "mentor_chat", context = "") {
    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent, message, history, context })
        });

        if (!res.ok) {
            const errorData = await res.json();
            const fullError = errorData.details ? `${errorData.error} (${errorData.details})` : (errorData.error || "Error en la llamada a la API");
            throw new Error(fullError);
        }

        const data = await res.json();
        return data.text;
    } catch (e) {
        console.error("Error al llamar a Gemini:", e);
        throw e;
    }
}

async function sendMessage() {
    const text = chatMentoriaInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatMentoriaInput.value = '';
    chatMentoriaInput.disabled = true;
    sendBtn.disabled = true;

    try {
        // --- LIMPIEZA: Si hay mensajes especiales abiertos, los quitamos al enviar un mensaje normal ---
        const idsALimpiar = ['msg-botiquin', 'msg-bienvenida'];
        idsALimpiar.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // Obtenemos el contexto fresco del alumno antes de enviar
        const contexto = await obtenerContextoAlumno();

        // Llamada al backend con el mensaje, el historial y el contexto dinámico
        const respuestaGemini = await llamarGemini(text, chatHistory, "mentor_chat", contexto);

        appendMessage(respuestaGemini, 'ia');

        // Actualizamos el historial de la sesión
        chatHistory.push({ role: "user", parts: [{ text: text }] });
        chatHistory.push({ role: "model", parts: [{ text: respuestaGemini }] });

    } catch (error) {
        console.error("Error en sendMessage:", error);
        appendMessage(`Lo siento, hubo un problema al conectar: **${error.message}**. Por favor, inténtalo de nuevo.`, 'ia');
    } finally {
        chatMentoriaInput.disabled = false;
        sendBtn.disabled = false;
        chatMentoriaInput.focus();
    }
}

function appendMessage(text, type, id = null) {
    if (!chatBox) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    if (id) messageDiv.id = id;

    if (type === 'ia' || type === 'ia-botiquin') {
        // Renderizamos Markdown para el Mentor
        let htmlContent = "";
        try {
            if (window.marked && typeof window.marked.parse === 'function') {
                htmlContent = window.marked.parse(text);
            } else if (typeof window.marked === 'function') {
                htmlContent = window.marked(text);
            } else {
                htmlContent = text; // Fallback a texto plano
            }
        } catch (e) {
            console.error("Error al parear Markdown:", e);
            htmlContent = text;
        }
        messageDiv.innerHTML = htmlContent;

        /* --- BOTÓN DE VOZ (TTS) DESACTIVADO TEMPORALMENTE ---
        if (type === 'ia-botiquin') {
            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'tts-btn';
            voiceBtn.innerHTML = '🔊 Oír ejercicio';

            // Extraemos solo el ejercicio 1 para leerlo
            const matchEjercicio = text.match(/(?:1\.?|Ejercicio 1)[:.]?\s*([^]*?)(?=\n\s*\d\.?|(?:\n\s*---|\n\s*\d\.?)|$)/i);
            const textoALeer = matchEjercicio ? matchEjercicio[1].trim() : text;

            voiceBtn.onclick = () => hablarTexto(textoALeer, voiceBtn);
            messageDiv.appendChild(voiceBtn);
        }
        */
    } else {
        // Texto plano para el usuario (seguridad) y mantenemos espacios
        messageDiv.innerText = text;
        messageDiv.style.whiteSpace = "pre-wrap";
    }

    chatBox.appendChild(messageDiv);

    // Si es botiquín, hacemos scroll hacia arriba para empezar a leer desde el inicio del mensaje
    if (type === 'ia-botiquin') {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
async function generarYGuardarResumen() {
    if (!supabase) return;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || chatHistory.length < 2) return;

    try {
        // Pedimos a la IA que extraiga toda la información relevante en formato JSON
        const promptCierre = `Basado en esta conversación, genera un objeto JSON con esta estructura exacta:
                        {
                          "resumen": "una frase técnica de la sesión",
                          "creencias": "bloqueos o creencias limitantes identificadas (máximo 30 palabras)",
                          "historia_vocal": "datos relevantes de su pasado vocal (máximo 30 palabras)",
                          "nivel_alquimia": (un número del 1 al 10 que refleje su progreso hoy),
                          "creencias_transmutadas": "ideas o miedos que el alumno ha superado o transformado hoy"
                        }
                        Responde ÚNICAMENTE el JSON puro.`;

        const rawText = await llamarGemini(promptCierre, chatHistory);

        // Limpiamos la respuesta por si la IA añade markdown code blocks
        const jsonText = rawText.replace(/```json|```/g, "").trim();
        const data = JSON.parse(jsonText);

        await supabase
            .from('user_profiles')
            .upsert({
                user_id: currentUser.id,
                ultimo_resumen: data.resumen,
                creencias: data.creencias,
                historia_vocal: data.historia_vocal,
                nivel_alquimia: data.nivel_alquimia || 1,
                creencias_transmutadas: data.creencias_transmutadas || ""
            });

        console.log("Perfil actualizado en Supabase:", data);
    } catch (e) {
        console.error("Error al actualizar perfil:", e);
    }
}
// Event Listeners para el chat
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        logoutBtn.innerText = "Guardando..."; // Feedback visual
        await generarYGuardarResumen();
        await supabase.auth.signOut();
        location.reload();
    });
}
if (sendBtn) sendBtn.addEventListener('click', sendMessage);

// Lógica de Botiquín
const botiquinBtn = document.getElementById('botiquinBtn');
if (botiquinBtn) {
    botiquinBtn.addEventListener('click', async () => {
        // --- MUTUAL EXCLUSIVITY: Si está abierta la bienvenida, la quitamos ---
        const oldBienvenida = document.getElementById('msg-bienvenida');
        if (oldBienvenida) oldBienvenida.remove();

        // --- TOGGLE: Si ya existe el mensaje del botiquín, lo cerramos y salimos ---
        const existingMsg = document.getElementById('msg-botiquin');
        if (existingMsg) {
            existingMsg.remove();
            return;
        }

        botiquinBtn.disabled = true;
        botiquinBtn.innerText = "⏳"; // Icono de carga breve

        try {
            const contexto = await obtenerContextoAlumno();
            const promptUrgente = `
            ${contexto}
            [MODO DE EMERGENCIA ACTIVADO]
            Tengo una audición/presentación inminente y necesito ayuda. 
            Basándote en mi perfil vocal y mis creencias limitantes mencionadas arriba, por favor dame:
            1. Un ejercicio de respiración o relajación de 2 minutos específico para mi bloqueo.
            2. Un consejo técnico rápido para mi voz.
            3. Una frase de poder o anclaje emocional que me ayude a entrar en mi eje.
            4. Una recomendación de música o frecuencia específica (proporcióname un LINK de YouTube completo) que me ayude a entrar en mi eje.
            Sé directo, cálido y efectivo.
            `;

            const responseText = await llamarGemini(promptUrgente, []);

            // Si la respuesta es exitosa, la mostramos
            if (responseText) {
                appendMessage(responseText, 'ia-botiquin', 'msg-botiquin');
            } else {
                throw new Error("No se recibió respuesta de la IA");
            }

        } catch (e) {
            console.error("Error botiquín:", e);
            appendMessage("No he podido abrir el botiquín, pero respira profundo... estoy contigo.", 'ia-botiquin', 'msg-botiquin');
        } finally {
            botiquinBtn.disabled = false;
            botiquinBtn.innerText = "Emergencia";
        }
    });
}

const bienvenidaBtn = document.getElementById('bienvenidaBtn');
if (bienvenidaBtn) {
    bienvenidaBtn.addEventListener('click', () => {
        // --- MUTUAL EXCLUSIVITY ---
        const idsCerrar = ['msg-botiquin', 'diarioModal'];
        idsCerrar.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'diarioModal') el.style.display = 'none';
                else el.remove();
            }
        });

        const msg = document.getElementById('msg-bienvenida');
        if (msg) {
            msg.remove(); // Si ya existe, lo quitamos (toggle off)
        } else {
            appendMessage(MENSAJE_BIENVENIDA, 'ia', 'msg-bienvenida'); // Si no existe, lo ponemos (toggle on)
        }
    });
}

// Lógica de Diario de Alquimia (Progreso)
const progresoBtn = document.getElementById('progresoBtn');
const diarioModal = document.getElementById('diarioModal');
const closeDiario = document.querySelector('.close-modal');

if (progresoBtn) {
    progresoBtn.addEventListener('click', async () => {
        // --- MUTUAL EXCLUSIVITY: Cerramos Bienvenida y Emergencia ---
        ['msg-botiquin', 'msg-bienvenida'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        if (diarioModal.style.display === 'flex') {
            diarioModal.style.display = 'none';
        } else {
            mostrarDiario();
        }
    });
}

if (closeDiario) {
    closeDiario.addEventListener('click', () => {
        diarioModal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target == diarioModal) {
        diarioModal.style.display = 'none';
    }
});

async function mostrarDiario() {
    if (!diarioModal || !supabase) return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    try {
        const { data: perfil, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        const content = document.getElementById('diarioContent');
        if (!perfil) {
            content.innerHTML = "<p>Aún no he recopilado suficiente información. Sigue charlando conmigo para que podamos registrar tu camino.</p>";
        } else {
            const nivel = perfil.nivel_alquimia || 1;
            const porcentaje = nivel * 10;

            content.innerHTML = `
                <div class="diario-seccion">
                    <h4>Nivel de Alquimia Vocal</h4>
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: ${porcentaje}%"></div>
                    </div>
                    <p style="text-align: right; font-size: 0.8em; margin-top: 5px;">Grado ${nivel} de 10</p>
                </div>
                <div class="diario-seccion">
                    <h4>Última Alquimia</h4>
                    <p>${perfil.ultimo_resumen || "Iniciando camino..."}</p>
                </div>
                <div class="diario-seccion">
                    <h4>Creencias Transmutadas (Logros) ✨</h4>
                    <p>${perfil.creencias_transmutadas || "Tus victorias aparecerán aquí pronto."}</p>
                </div>
                <div class="diario-seccion">
                    <h4>Creencias Activas</h4>
                    <p>${perfil.creencias || "Aún no hemos explorado suficientes miedos para transmutar."}</p>
                </div>
                <div class="diario-seccion">
                    <h4>Tu Historia Vocal</h4>
                    <p>${perfil.historia_vocal || "Tu voz está lista para ser escrita."}</p>
                </div>
            `;
        }
        diarioModal.style.display = 'flex';
    } catch (e) {
        console.error("Error al cargar el diario:", e);
    }
}
if (chatMentoriaInput) {
    chatMentoriaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita comportamientos por defecto del navegador
            sendMessage();
        }
    });
}

// --- LÓGICA DE RECONOCIMIENTO DE VOZ ---

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;

    micBtn.addEventListener('click', () => {
        try {
            recognition.start();
            micBtn.style.backgroundColor = "#ffcccc";
        } catch (e) {
            console.error("Error iniciando reconocimiento:", e);
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatMentoriaInput.value = transcript;
        micBtn.style.backgroundColor = "";
        sendMessage();
    };

    recognition.onerror = () => {
        micBtn.style.backgroundColor = "";
        alert("No he podido escucharte, ¿me das permiso para usar el micro?");
    };

    recognition.onend = () => {
        micBtn.style.backgroundColor = "";
    };
} else {
    if (micBtn) micBtn.style.display = 'none';
    console.log("Tu navegador no soporta reconocimiento de voz o falta el botón.");
}

// --- LÓGICA DE TEXT TO SPEECH (TTS) PREMIUM ---
let audioActual = null;

async function hablarTexto(texto, btn) {
    // Si ya está sonando, lo paramos
    if (audioActual && !audioActual.paused) {
        audioActual.pause();
        audioActual = null;
        btn.innerHTML = '🔊 Oír ejercicio';
        return;
    }

    btn.innerHTML = '⏳ Generando...';
    btn.disabled = true;

    // Limpiamos el texto de markdown
    const textoLimpio = texto.replace(/#|\*|_|\[|\]|\(|\)/g, "").trim();
    const voiceName = 'es-ES-Chirp3-HD-Aoede'; // Identidad fija del Mentor

    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textoLimpio, voiceName })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // El audio viene en base64
        const audioBlob = b64toBlob(data.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);

        audioActual = new Audio(audioUrl);

        audioActual.onplay = () => {
            btn.innerHTML = '⏸ Detener';
            btn.disabled = false;
        };

        audioActual.onended = () => {
            btn.innerHTML = '🔊 Oír ejercicio';
            URL.revokeObjectURL(audioUrl);
            audioActual = null;
        };

        audioActual.play();

    } catch (error) {
        console.error("Error TTS Premium:", error);
        btn.innerHTML = '🔊 Oír ejercicio';
        btn.disabled = false;
        alert("No he podido generar la voz premium. Verifica que la API Key esté configurada.");
    }
}

// Utilidad para convertir base64 a Blob
function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
}
// --- MI VIAJE INTEGRATION ---
document.getElementById('viajeBtn').addEventListener('click', async () => {
    if (!supabase) return;

    // Verificar usuario
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
        alert("Por favor, inicia sesión para acceder a tu viaje.");
        document.getElementById('authOverlay').style.display = 'flex';
        return;
    }

    // Abrir modal
    document.getElementById('viajeModal').style.display = 'flex';

    // Cargar módulo dinámicamente con cache-bust para evitar versiones antiguas
    try {
        const { initJourney } = await import(`./mi_viaje/main.js?v=${Date.now()}`);
        initJourney(supabase, data.user);
    } catch (e) {
        console.error("Error cargando Mi Viaje:", e);
    }
});
