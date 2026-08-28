const { createClient } = require('@supabase/supabase-js');
const { SYSTEM_PROMPTS } = require('./_lib/prompts');
const { sanitizeGeminiHistory } = require('./_lib/utils');

// --- CONFIGURACIÓN MISTRAL (primario — servidores UE, Francia) ---
const MISTRAL_MODEL = "mistral-small-latest";
const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

// --- CONFIGURACIÓN GEMINI ---
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Orquestador principal de la API de Chat
 */
module.exports = async function handler(req, res) {
    // SOPORTE CORS
    res.setHeader('Access-Control-Allow-Credentials', true).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT').setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method === "PATCH") {
        return await updateTeacherMessage(req, res);
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const { stream } = req.body;

    try {
        if (stream) {
            setupStreamHeaders(res);
            await processChat(req, res);
        } else {
            const result = await processChat(req);
            return res.status(200).json(result);
        }
    } catch (error) {
        handleError(error, res, stream);
    }
};

/**
 * Procesa la lógica de negocio del chat con fallback secuencial
 */
async function processChat(req, res = null) {
    const { intent, message, history = [], userId, userId2 = null, stream = false, vocal_scan = null, originPost = null, originCat = null, fileData = null } = req.body;

    if (intent === 'warmup') return { text: "OK" };

    // --- Compendio (sintetizar múltiples alumnos en uno) ---
    if (intent === 'compendio') {
        return await generarCompendio(req.body);
    }

    if (intent === 'analisis') {
        return await analizarAlumnos(req.body);
    }

    if (intent === 'teacher' || intent === 'teacher_review') {
        return await teacherChat(req.body, intent);
    }

    if (intent === 'persona_chat') {
        return await personaChat(req.body);
    }

    if (intent === 'add_teacher_tip') {
        return await addTeacherTip(req.body);
    }

    if (intent === 'get_teacher_tips') {
        return await getTeacherTips(req.body);
    }

    if (!intent || !SYSTEM_PROMPTS[intent]) throw new Error("Intento no válido");

    // 1. Construir Contexto del Alumno
    const ctx = await buildUserContext(userId, intent, originPost, originCat);
    let context = ctx.context;

    // 1b. Segundo alumno (modo comparación)
    if (userId2) {
        const ctx2 = await buildUserContext(userId2, intent, originPost, originCat);
        if (ctx2.context) {
            context += `\n\n--- SEGUNDO ALUMNO (COMPARACIÓN) ---\n`;
            context += ctx2.context;
            context += `\n\n[INSTRUCCIÓN: El usuario ha solicitado una comparación entre ambos alumnos. Analiza las diferencias y similitudes en su evolución, respuestas, niveles y anotaciones. Si hay datos de ambos, contrasta sus progresos y ofrece una visión comparativa útil para el mentor. Si solo hay datos de uno, indícalo y procede con la información disponible.]\n`;
        }
    }

    // Añadir etapa de conversación para roleplay
    if (intent === 'roleplay_chat') {
        const turnCount = Math.floor((history?.length || 0) / 2);
        const stage = turnCount <= 1 ? 'INICIO' : turnCount <= 4 ? 'EXPLORA' : turnCount <= 7 ? 'PROFUNDIZA' : 'CIERRE';
        context += `\n[Intercambio #${turnCount} — Etapa: ${stage}]\n`;
    }

    // Añadir Escaneo Vocal si existe
    if (vocal_scan) {
        context += `\n--- ESCANEO VOCAL EN TIEMPO REAL ---\n`;
        context += `- Volumen medio: ${vocal_scan.volumen} (0-1)\n`;
        context += `- Energía pico: ${vocal_scan.energia} (0-1)\n`;
        context += `- Estabilidad: ${vocal_scan.estabilidad} (0-1)\n`;
        context += `[SISTEMA: Comenta sutilmente este análisis solo si lo ves relevante para su estado emocional].\n`;
    }

    const finalPrompt = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;

    // --- CADENA DE REINTENTOS CON FALLBACK ---
    const errors = [];
    const hasMedia = fileData && ((fileData.mimeType && fileData.mimeType.startsWith('audio/')) || (fileData.data || (Array.isArray(fileData) && fileData.length > 0)));

    // Mistral (texto + imágenes)
    if (process.env.MISTRAL_API_KEY) {
        try {
            console.log("🚀 Intentando con Mistral...");
            const result = await callMistralAPI({ intent, prompt: finalPrompt, history, stream, res, fileData, resumenBoundary: ctx.resumenBoundary });
            if (stream && res) return;
            return result;
        } catch (e) {
            console.warn("⚠️ Mistral falló:", e.message);
            errors.push(`Mistral: ${e.message}`);
            if (stream && res && res.writableEnded) throw e;
        }
    }

    // Gemini eliminado temporalmente

    throw new Error(`Todos los modelos fallaron: ${errors.join(" | ")}`);
}

/**
 * Recupera datos de Supabase para alimentar el prompt
 */
async function buildUserContext(userId, intent, originPost = null, originCat = null) {
    if (!userId && !originPost) return { context: "", resumenBoundary: null };

    const needsContext = ['mentor_chat', 'mentor_briefing', 'alchemy_analysis', 'mentor_advisor', 'inspiracion_dia', 'roleplay_chat'].includes(intent);
    if (!needsContext) return { context: "", resumenBoundary: null };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    let context = "";

    if (originPost) {
        context += `\n--- ARTÍCULO LEÍDO (Contexto de Origen) ---\n`;
        context += `- Título: ${originPost}\n`;
        if (originCat) context += `- Categoría: ${originCat}\n`;
        context += `[SISTEMA: El alumno viene de leer este artículo. Salúdale mencionando que te alegra que lo haya leído y pregúntale qué le ha parecido o cómo resuena con su situación actual].\n`;
    }

    const { data: perfil } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (!perfil) return context;

    context += `\n--- SITUACIÓN ACTUAL ---\n- Nombre: ${perfil.nombre}\n- Último Estado: ${perfil.ultimo_resumen || 'Iniciando'}\n`;

    // No aplicar las preferencias personalizadas de Ajustes cuando la intención sea 'inspiracion_dia'
    // para evitar que la frase pierda su tono inspirador o sea demasiado técnica/robótica.
    if (intent !== 'inspiracion_dia') {
        if (perfil.mentor_trato_preferido) {
            context += `- Trato Preferido: ${perfil.mentor_trato_preferido}\n`;
        }

        context += `\n--- PREFERENCIAS DE MENTORÍA ---\n`;
        if (perfil.mentor_focus !== undefined && perfil.mentor_focus !== null) {
            context += `- Nivel de Enfoque (1 Técnico, 10 Emocional): ${perfil.mentor_focus}/10\n`;
        }
        if (perfil.mentor_personality !== undefined && perfil.mentor_personality !== null) {
            context += `- Personalidad (1 Neutral, 10 Motivador): ${perfil.mentor_personality}/10\n`;
        }
        if (perfil.mentor_length !== undefined && perfil.mentor_length !== null) {
            context += `- Longitud de Respuesta (1 Breve, 10 Detallada): ${perfil.mentor_length}/10\n`;
        }

        context += `- Historia: ${perfil.historia_vocal}\n- Nivel: ${perfil.nivel_alquimia}/10\n`;
        context += `- Transmutaciones (Logros): ${perfil.creencias_transmutadas || 'Ninguna registrada'}\n`;

        if ((intent === 'mentor_briefing' || intent === 'mentor_advisor' || intent === 'roleplay_chat') && perfil.mentor_notes) {
            context += `\n--- ANOTACIONES DEL MENTOR ---\n${perfil.mentor_notes}\n`;
        }
    }

    const userTier = perfil.subscription_tier || 'free';
    if ((userTier === 'pro' || userTier === 'premium') && intent !== 'inspiracion_dia' && intent !== 'roleplay_chat') {
        const { data: cronicas } = await supabase.from('mensajes')
            .select('texto, created_at')
            .eq('alumno', userId)
            .eq('emisor', 'resumen_diario')
            .order('created_at', { ascending: false })
            .limit(7);

        if (cronicas?.length > 0) {
            context += `\n--- MEMORIA RECIENTE (Crónicas de Alquimia) ---\n`;
            cronicas.reverse().forEach(c => {
                context += `[${new Date(c.created_at).toLocaleDateString()}] ${c.texto}\n`;
            });
            context += `\n[SISTEMA: Usa estos datos para demostrar que recuerdas su evolución y no pedirle repetirse].\n`;
        }
    }

    // Obtener la fecha del último resumen_diario para la frontera de sesión
    let resumenBoundary = null;
    if (userId) {
        const { data: lastResumen } = await supabase.from('mensajes')
            .select('created_at')
            .eq('alumno', userId)
            .eq('emisor', 'resumen_diario')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (lastResumen?.created_at) {
            resumenBoundary = lastResumen.created_at;
        }
    }

    return { context, resumenBoundary };
}

/**
 * Ejecuta la llamada REST a Gemini (mantenido como fallback opcional)
 */
async function callGeminiAPI({ intent, prompt, history, stream, res, fileData }) {
    if (!process.env.GEMINI_API_KEY) throw new Error("Falta API Key de Gemini");

    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const modelToUse = GEMINI_MODEL;
    const url = `${GEMINI_BASE_URL}/${modelToUse}:${endpoint}?key=${process.env.GEMINI_API_KEY}${stream ? '&alt=sse' : ''}`;

    const contents = [
        ...sanitizeGeminiHistory(history),
        { role: "user", parts: [{ text: prompt }] }
    ];

    if (fileData) {
        const lastContent = contents[contents.length - 1];
        const files = Array.isArray(fileData) ? fileData : [fileData];
        for (const file of files) {
            lastContent.parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                }
            });
        }
    }

    const requestBody = {
        contents: contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[intent] }] }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
    }

    if (stream && res) {
        return handleStreamResponse(response, res);
    } else {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return { text: text, info: modelToUse };
    }
}

/**
 * Maneja el flujo de datos SSE para streaming
 */
async function handleStreamResponse(response, res) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        }
                    } catch (e) { /* chunk incompleto */ }
                }
            }
        }
    } finally {
        res.end();
    }
}

/**
 * Ejecuta la llamada a Mistral AI (primario — servidores UE)
 */
async function callMistralAPI({ intent, prompt, history, stream, res, fileData, resumenBoundary }) {
    const keys = [process.env.MISTRAL_API_KEY, process.env.MISTRAL_API_KEY_2].filter(Boolean);
    if (!keys.length) throw new Error("Falta API Key de Mistral");

    let lastErr;
    for (const key of keys) {
        try {
            return await _mistralCall({ intent, prompt, history, stream, res, fileData, resumenBoundary, apiKey: key });
        } catch (e) {
            lastErr = e;
            const isRetryable = e.message.includes('429') || e.message.includes('503') || e.message.includes('Too Many Requests') || e.message.includes('401');
            if (!isRetryable) break;
        }
    }
    throw lastErr;
}

async function _mistralCall({ intent, prompt, history, stream, res, fileData, resumenBoundary, apiKey }) {
    if (!apiKey) throw new Error("Falta API Key de Mistral");

    function buildUserContent(msg, file) {
        if (!file || file.mimeType?.startsWith('audio/')) return msg;
        const parts = [{ type: 'text', text: msg }];
        if (Array.isArray(file)) {
            file.forEach(p => {
                if (p.data) parts.push({ type: 'image_url', image_url: `data:${p.mimeType || 'image/jpeg'};base64,${p.data}` });
            });
        } else if (file.data && file.mimeType?.startsWith('image/')) {
            parts.push({ type: 'image_url', image_url: `data:${file.mimeType};base64,${file.data}` });
        }
        return parts;
    }

    const boundaryDate = resumenBoundary ? new Date(resumenBoundary) : null;
    const filteredHistory = history.filter(h => {
        if (!h?.parts?.[0]?.text) return false;
        if (h.role === 'user') return true;
        if (h.role === 'model') {
            if (!boundaryDate) return true;
            const msgDate = h.created_at ? new Date(h.created_at) : null;
            return msgDate && msgDate > boundaryDate;
        }
        return false;
    });

    const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const fmtFecha = (iso) => {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const messages = [
        { role: "system", content: `${SYSTEM_PROMPTS[intent]}\n\nFECHA ACTUAL: Hoy es ${hoy}. Ten siempre presente la fecha de hoy y la fecha de cada mensaje anterior para no confundir hechos pasados con el presente.` },
        ...filteredHistory.map(h => {
            const fecha = fmtFecha(h.created_at);
            const texto = h.parts?.[0]?.text || '';
            return {
                role: h.role === 'model' ? 'assistant' : 'user',
                content: fecha ? `[${fecha}] ${texto}` : texto
            };
        }),
        { role: "user", content: buildUserContent(prompt, fileData) }
    ];

    const requestBody = {
        model: MISTRAL_MODEL,
        messages,
        temperature: 0.85,
        presence_penalty: 0.7,
        max_tokens: 4096,
        stream: !!stream
    };

    const keyLabel = apiKey === process.env.MISTRAL_API_KEY ? 'MISTRAL_API_KEY' : 'MISTRAL_API_KEY_2';
    console.log(`→ Usando ${keyLabel}`);

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const MAX_RETRIES = 2;
    let response;
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            if (response.ok) break;
            const errData = await response.json().catch(() => ({}));
            lastErr = new Error(`Mistral Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
            const retryable = response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504;
            if (retryable && attempt < MAX_RETRIES) {
                console.warn(`⚠️ Mistral ${response.status} (intento ${attempt}/${MAX_RETRIES}), reintentando...`);
                await sleep(Math.min(800 * attempt, 3000));
                continue;
            }
            throw lastErr;
        } catch (e) {
            lastErr = e;
            const retryable = /503|502|504|429|Failed to fetch|network/i.test(e.message);
            if (retryable && attempt < MAX_RETRIES) {
                console.warn(`⚠️ Mistral error de red (intento ${attempt}/${MAX_RETRIES}), reintentando...`);
                await sleep(Math.min(800 * attempt, 3000));
                continue;
            }
            throw e;
        }
    }
    if (!response || !response.ok) throw lastErr;

    if (stream && res) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const text = data.choices?.[0]?.delta?.content;
                            if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        } catch (e) { /* chunk incompleto */ }
                    }
                }
            }
        } finally {
            res.end();
        }
        return;
    } else {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        return { text, info: `${MISTRAL_MODEL} (UE)` };
    }
}

async function generarCompendio(body) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { user_ids, instrucciones, nombre_personalizado } = body;
    if (!user_ids?.length) throw new Error("Se requiere al menos un user_id");

    // Cargar perfiles
    const { data: perfiles } = await supabase.from('user_profiles').select('*').in('user_id', user_ids);
    if (!perfiles?.length) throw new Error("No se encontraron perfiles");

    // Armar prompt
    let perfilesTexto = perfiles.map((p, i) =>
        `ALUMNO ${i + 1}:\n- Nombre: ${p.nombre}\n- Historia Vocal: ${p.historia_vocal || 'N/A'}\n- Nivel Alquimia: ${p.nivel_alquimia || 'N/A'}/10\n- Creencias Transmutadas: ${p.creencias_transmutadas || 'Ninguna'}\n- Último Resumen: ${p.ultimo_resumen || 'N/A'}\n- Notas del Mentor: ${p.mentor_notes || 'N/A'}\n- Trato Preferido: ${p.mentor_trato_preferido || 'N/A'}`
    ).join('\n\n');

    const systemPrompt = `Eres un analista de perfiles vocales. Tu tarea es fusionar los siguientes perfiles de alumnos en UN SOLO perfil compuesto. Debes crear un personaje coherente que combine las historias, traumas, niveles y personalidades de todos ellos.

Responde ÚNICAMENTE con un JSON válido, sin explicaciones ni markdown. El JSON debe seguir esta estructura exacta:
{
  "nombre": "Nombre compuesto sugerido",
  "historia_vocal": "Historia combinada (2-4 párrafos)",
  "creencias_transmutadas": "Creencias combinadas (formato: antigua → nueva)",
  "ultimo_resumen": "Resumen del estado actual del compendio",
  "nivel_alquimia": "Nivel promedio (1-10)",
  "mentor_notes": "Notas compuestas para el mentor",
  "mentor_trato_preferido": "Trato preferido combinado",
  "mentor_focus": 0.5,
  "mentor_personality": 0.5,
  "mentor_length": 0.5
}`;

    const userPrompt = `Fusiona estos perfiles en uno solo:\n\n${perfilesTexto}${instrucciones ? `\n\nInstrucciones adicionales del mentor: ${instrucciones}` : ''}`;

    if (!process.env.MISTRAL_API_KEY) throw new Error("Falta API Key de Mistral");

    const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MISTRAL_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2048
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Mistral Error ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const texto = data.choices?.[0]?.message?.content || '';
    let perfilCompuesto;
    try {
        perfilCompuesto = JSON.parse(texto.replace(/```(json)?/g, '').trim());
    } catch {
        throw new Error("Mistral no devolvió JSON válido: " + texto.slice(0, 300));
    }

    // Insertar nuevo perfil en BD
    const nuevoId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
    const { data: insertado, error: insertError } = await supabase.from('user_profiles').insert({
        user_id: nuevoId,
        email: `${(nombre_personalizado || perfilCompuesto.nombre || 'compendio').toLowerCase().replace(/[^a-z0-9]/g, '')}@test.com`,
        nombre: nombre_personalizado || perfilCompuesto.nombre || 'Compendio',
        subscription_tier: 'free',
        historia_vocal: perfilCompuesto.historia_vocal || '',
        creencias_transmutadas: perfilCompuesto.creencias_transmutadas || '',
        ultimo_resumen: perfilCompuesto.ultimo_resumen || '',
        nivel_alquimia: perfilCompuesto.nivel_alquimia || '5',
        mentor_notes: perfilCompuesto.mentor_notes || '',
        mentor_trato_preferido: perfilCompuesto.mentor_trato_preferido || '',
        mentor_focus: perfilCompuesto.mentor_focus ?? 0.5,
        mentor_personality: perfilCompuesto.mentor_personality ?? 0.5,
        mentor_length: perfilCompuesto.mentor_length ?? 0.5,
    }).select('*').single();

    if (insertError) throw new Error("Error al guardar compendio: " + insertError.message);

    return { success: true, perfil: insertado };
}

/**
 * Analiza los datos de todos los alumnos para responder preguntas del mentor
 */
async function analizarAlumnos(body) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { pregunta } = body;
    if (!pregunta) throw new Error("Se requiere una pregunta");

    const { data: perfiles } = await supabase.from('user_profiles')
        .select('user_id, nombre, nivel_alquimia, historia_vocal, creencias_transmutadas, ultimo_resumen, mentor_notes, mentor_trato_preferido')
        .not('email', 'ilike', '%@test.com')
        .order('nombre');

    const alumnosData = [];
    for (const p of (perfiles || [])) {
        const { data: msgs } = await supabase.from('mensajes')
            .select('created_at, emisor')
            .eq('alumno', p.user_id);

        const total = msgs?.length || 0;
        const delAlumno = msgs?.filter(m => m.emisor === 'usuario' || m.emisor === 'user').length || 0;
        const delIA = msgs?.filter(m => m.emisor === 'ia' || m.emisor === 'model' || m.emisor === 'assistant').length || 0;
        const ultima = msgs?.length > 0 ? new Date(msgs[msgs.length - 1].created_at).toLocaleDateString('es-ES') : 'Nunca';

        alumnosData.push({
            nombre: p.nombre,
            nivel: p.nivel_alquimia || '?',
            historia: (p.historia_vocal || '').substring(0, 250),
            creencias: (p.creencias_transmutadas || '').substring(0, 250),
            resumen: (p.ultimo_resumen || '').substring(0, 350),
            notas: (p.mentor_notes || '').substring(0, 250),
            trato: p.mentor_trato_preferido || '',
            totalMsgs: total,
            msgsAlumno: delAlumno,
            msgsIA: delIA,
            ultimaAct: ultima
        });
    }

    let context = `DATOS DE ALUMNOS (${alumnosData.length} alumnos):\n\n`;
    alumnosData.forEach((a, i) => {
        context += `--- ALUMNO ${i + 1}: ${a.nombre} ---\n`;
        context += `Nivel: ${a.nivel}/10\n`;
        context += `Historia: ${a.historia || 'N/A'}\n`;
        context += `Creencias: ${a.creencias || 'N/A'}\n`;
        context += `Resumen: ${a.resumen || 'N/A'}\n`;
        context += `Notas Mentor: ${a.notas || 'N/A'}\n`;
        context += `Trato: ${a.trato || 'N/A'}\n`;
        context += `Mensajes: ${a.totalMsgs} total (${a.msgsAlumno} alumno, ${a.msgsIA} IA)\n`;
        context += `Última actividad: ${a.ultimaAct}\n\n`;
    });

    const systemPrompt = `Eres un analista pedagógico experto en coaching de vida. Tu tarea es analizar los datos de los alumnos de un mentor de vida y responder sus preguntas con insights accionables.
Los datos incluyen: nombre, nivel, historia vocal, creencias transmutadas, resumen de estado, notas del mentor, cantidad de mensajes y última actividad.

Responde de forma clara, directa y útil. Si no hay suficientes datos para responder algo, indícalo honestamente. Si preguntan por técnicas específicas (respiración, impostación, etc.) y no hay datos en los resúmenes, indícalo y sugiere al mentor que añada notas al respecto.`;

    const userPrompt = `${context}\n\nPREGUNTA DEL MENTOR:\n${pregunta}\n\nProporciona un análisis detallado basado en los datos anteriores. Si un alumno no tiene datos relevantes, menciónalo.`;

    const keys = [process.env.MISTRAL_API_KEY, process.env.MISTRAL_API_KEY_2].filter(Boolean);
    if (!keys.length) throw new Error("Falta API Key de Mistral");

    let lastErr;
    for (const key of keys) {
        try {
            const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MISTRAL_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(`Mistral Error ${response.status}: ${err.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const texto = data.choices?.[0]?.message?.content || '';
            return { success: true, analisis: texto };
        } catch (e) {
            lastErr = e;
            const isRetryable = e.message.includes('429') || e.message.includes('503') || e.message.includes('Too Many Requests') || e.message.includes('401');
            if (!isRetryable) break;
        }
    }
    throw lastErr;
}

/**
 * Chat con el profesor de inglés IA
 */
/**
 * Extrae tips de conversaciones del día y los guarda como tips_diarios
 */
/**
 * Parsea una línea de tip en { original, correct }. Devuelve null si no es un tip válido.
 * Solo acepta líneas con estructura "original → corrección" que contengan 🎯 o "Tip:".
 */
function parseTipLine(line) {
    const l = (line || '').trim();
    if (!l.includes('→')) return null;
    if (!l.includes('🎯') && !/Tip:/i.test(l)) return null;
    // Quitar prefijo hasta "Tip:" incluido (si existe)
    const body = l.replace(/^.*?Tip:\s*/i, '');
    const idx = body.indexOf('→');
    if (idx === -1) return null;
    const clean = s => s.replace(/["""*🎯]/g, '').trim();
    const original = clean(body.slice(0, idx));
    const correct = clean(body.slice(idx + 1));
    if (!original || !correct) return null;
    if (original.length > 200 || correct.length > 200) return null;
    return { original, correct };
}

/** Normaliza una frase para usarla como clave de comparación */
function normalizeTipKey(s) {
    return (s || '').replace(/["""]/g, '').trim().toLowerCase();
}

/** Devuelve el segmento entre comillas de un texto (dobles primero; comillas simples solo si la apertura no sigue a una letra) */
function extractPhrase(text) {
    const m = text.match(/[""“”]([^""“”]{1,200})[""“”]/);
    if (m) return m[1].trim();
    const s = text.match(/(^|[^a-zA-Z0-9])['’]([^'’]{1,200})['’]/);
    return s ? s[2].trim() : null;
}

/** Limpia el texto antes de →: quita marcadores, numeración, comillas, asteriscos y conectores */
function cleanTipText(s) {
    return s
        .replace(/^.*?Tip:?\s*/i, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/[“”""''*✅❌]/g, '')
        .replace(/^(Also|And|So|But|Finally|Then|However|Earlier,)[,\s]+\s*/i, '')
        .replace(/^[\s#*-]+/, '')
        .replace(/\s*\(.*\)\s*$/, '')
        .trim()
        .replace(/\s+/g, ' ');
}

function isGoodTip(original, correct) {
    if (!(original && correct)) return false;
    if (original.length < 2 || correct.length < 2) return false;
    if (original.length > 200 || correct.length > 200) return false;
    // Descartar cadenas tipo "Grip → Flow → ..." (no son correcciones)
    if (correct.includes('→')) return false;
    // Descartar cuando original y corrección son iguales
    if (normalizeTipKey(original) === normalizeTipKey(correct)) return false;
    return true;
}

/**
 * Extrae tips de un mensaje del profesor soportando los distintos formatos:
 *  - "🎯 Tip: X → Y" (una línea)
 *  - "1. *X* → *Y* (more natural...)" (listas de correcciones)
 *  - "Instead of X, say: Y" (Y en la misma línea o en las siguientes)
 * Filtra las conexiones temáticas que la IA también escribe con → (no son correcciones).
 */
function extractTipsFromContent(content) {
    const tips = [];
    const lines = (content || '').split('\n').map(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // A) "X → Y" en una sola línea
        if (line.includes('→')) {
            // Rechazar conexiones temáticas ("Now: ...", "→ ties to", "→ matches", "→ like")
            if (/Now:/.test(line) || /→\s*(ties to|matches|like)\b/i.test(line)) continue;
            const idx = line.indexOf('→');
            // Descartar si la → va entre comillas (texto explicativo, ej: "→")
            const prevCh = line[idx - 1];
            const nextCh = line[idx + 1];
            if (prevCh !== '"' && prevCh !== '“' && prevCh !== "'"
                && nextCh !== '"' && nextCh !== '“' && nextCh !== "'") {
                // Sin marcador 🎯/Tip:, exigir que la explicación indique corrección
                const hasMarker = line.includes('🎯') || /Tip:/i.test(line);
                const isCorrection = /(more natural|correct|spelling|grammar|singular|plural|pronoun|preposition|tense|refined|misspell|word choice|verb form|idiomatic)/i.test(line.slice(idx + 1));
                if (hasMarker || isCorrection) {
                    const original = stripMd(extractPhrase(line.slice(0, idx)) || cleanTipText(line.slice(0, idx)));
                    const correct = stripMd(extractPhrase(line.slice(idx + 1)) || cleanTipText(line.slice(idx + 1)));
                    if (isGoodTip(original, correct)) {
                        tips.push({ original, correct });
                        continue;
                    }
                }
            }
        }

        // B) "Instead of X, say: Y" — requiere "say:" cerca (si no, es prosa)
        if (/Instead of/i.test(line)) {
            const sayIdx = line.toLowerCase().lastIndexOf('say:');
            if (sayIdx !== -1) {
                const afterInstead = line.replace(/^.*?Instead of\s*/i, '');
                const original = stripMd(extractPhrase(afterInstead));
                if (original) {
                    let correct = extractPhrase(line.slice(sayIdx + 4));
                    if (!correct) {
                        for (let j = i + 1; j < lines.length && j < i + 4; j++) {
                            const nl = lines[j];
                            if (!nl) continue;
                            correct = extractPhrase(nl);
                            if (correct) break;
                        }
                    }
                    correct = stripMd(correct);
                    if (isGoodTip(original, correct)) tips.push({ original, correct });
                }
            }
        }
    }
    return tips;
}

/** Quita restos de markdown (asteriscos, tildes) de una frase extraída */
function stripMd(s) {
    return s ? s.replace(/[*~]/g, '').trim() : s;
}

function tipsToLines(tips) {
    return tips.map(t => `🎯 Tip: ${t.original} → ${t.correct}`);
}

async function extractDailyTips(supabase, userId) {
    const { data: messages } = await supabase.from('teacher')
        .select('content')
        .eq('user_id', userId)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(100);

    if (!messages?.length) return [];

    const unique = new Set();
    for (const m of messages) {
        for (const t of extractTipsFromContent(m.content)) {
            unique.add(`🎯 Tip: ${t.original} → ${t.correct}`);
        }
    }
    const result = [...unique];
    if (!result.length) return [];

    const combined = result.join('\n');

    // No insertar si ya existe exactamente ese mismo conjunto de tips
    const { data: existing } = await supabase.from('teacher')
        .select('content')
        .eq('user_id', userId)
        .eq('role', 'tips_diarios');

    if (existing?.some(t => t.content === combined)) return result;

    await supabase.from('teacher').insert({
        user_id: userId,
        role: 'tips_diarios',
        content: combined
    });

    return result;
}

/**
 * Guarda un tip escrito manualmente por el usuario
 */
async function addTeacherTip(body) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { userId, tip } = body;
    if (!userId || !tip) throw new Error("Se requiere userId y tip");

    await supabase.from('teacher').insert({
        user_id: userId,
        role: 'tips_diarios',
        content: tip
    });

    return { success: true };
}

async function getTeacherTips(body) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { userId } = body;
    if (!userId) throw new Error("Se requiere userId");

    // Extraer tips no procesados aún
    await extractDailyTips(supabase, userId);

    const { data: tips } = await supabase.from('teacher')
        .select('content, created_at')
        .eq('user_id', userId)
        .eq('role', 'tips_diarios')
        .order('created_at', { ascending: true });

    // Si no hay tips_diarios, extraer directamente de assistant messages
    if (!tips?.length) {
        const { data: allMessages } = await supabase.from('teacher')
            .select('content')
            .eq('user_id', userId)
            .eq('role', 'assistant')
            .order('created_at', { ascending: false })
            .limit(100);

        const allTips = [];
        for (const m of (allMessages || [])) {
            allTips.push(...tipsToLines(extractTipsFromContent(m.content)));
        }

        if (allTips.length > 0) {
            return { tips: [{ day: 'Directly from conversations', content: allTips.join('\n') }] };
        }
        return { tips: [] };
    }

    const formatted = tips.map((t, i) => ({
        day: `Day ${i + 1} - ${new Date(t.created_at).toLocaleDateString()}`,
        content: t.content
    }));

    return { tips: formatted };
}

async function teacherChat(body, intent = 'teacher') {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { message, history = [], userId, pureChat = false } = body;
    if (!message) throw new Error("Se requiere un mensaje");
    if (!userId) throw new Error("Se requiere userId");

    let newTips = [], allTips = [], flatTips = [], reviewAnswered = false;

    // Guardar mensaje del usuario (solo en modo conversación)
    if (intent !== 'teacher_review') {
        const tabla = pureChat ? 'teacher_pure_chat' : 'teacher';
        await supabase.from(tabla).insert({
            user_id: userId,
            role: 'user',
            content: message
        }).maybeSingle();
    }

    // Construir contexto
    let context = '';

    if (intent === 'teacher_review') {
        // 1. Obtener tips guardados de días anteriores (más reciente primero)
        const { data: savedTips } = await supabase.from('teacher')
            .select('content, created_at')
            .eq('user_id', userId)
            .eq('role', 'tips_diarios')
            .order('created_at', { ascending: false });

        // 2. Extraer tips de la conversación de hoy
        newTips = await extractDailyTips(supabase, userId);

        // 3. Construir pool: solo tips parseables, dedup por frase original normalizada
        //    Primero los de hoy (newTips), luego los guardados de más reciente a más antiguo
        const candidateLines = [];
        (newTips || []).forEach(l => candidateLines.push(l));
        (savedTips || []).forEach(t => t.content.split('\n').forEach(l => candidateLines.push(l)));

        const byKey = new Map();
        for (const line of candidateLines) {
            const parsed = parseTipLine(line);
            if (!parsed) continue;
            const key = normalizeTipKey(parsed.original);
            if (key && !byKey.has(key)) {
                byKey.set(key, { ...parsed, key, raw: line.trim() });
            }
        }

        // 4. Detectar modo: start, skip, o respuesta
        const isStart = /^Start the review\.?$/i.test(message.trim());
        const isSkip = !isStart && /^(next|next tip|skip|continue|siguiente|siguiente tip)$/i.test(message.trim());

        if (isStart) {
            // Empezar de cero: borrar registros antiguos y usar todos los tips
            await supabase.from('teacher_review')
                .delete()
                .eq('user_id', userId);
            flatTips = [...byKey.values()];
        } else {
            // Excluir tips ya completados (compat: keys nuevas normalizadas y textos crudos antiguos)
            const { data: completed } = await supabase.from('teacher_review')
                .select('tip_key')
                .eq('user_id', userId);
            const completedSet = new Set();
            (completed || []).forEach(c => {
                completedSet.add(c.tip_key);
                completedSet.add(normalizeTipKey(c.tip_key));
                const p = parseTipLine(c.tip_key);
                if (p) completedSet.add(normalizeTipKey(p.original));
            });
            flatTips = [...byKey.values()].filter(t => !completedSet.has(t.key) && !completedSet.has(t.raw));
        }
        allTips = { length: flatTips.length };

        // 5. Skip: marcar el actual como completado y pasar al siguiente
        if (isSkip && flatTips.length > 0) {
            // "next tip" = saltar el tip actual sin responderlo
            try {
                await supabase.from('teacher_review').insert({
                    user_id: userId,
                    tip_key: flatTips[0].key
                });
            } catch (_) {}
            flatTips = flatTips.slice(1);
        }

        if (flatTips.length === 0) {
            reviewAnswered = true;
            context = (savedTips?.length || newTips?.length)
                ? '--- ALL TIPS COMPLETED ---'
                : '--- NO TIPS YET ---';
        } else if (isStart || isSkip) {
            context = `The student said an incorrect phrase: "${flatTips[0].original}"\n\nAsk the student to correct it.`;
        } else {
            reviewAnswered = true;
            const current = flatTips[0];
            const next = flatTips[1];
            const nextPhrase = next ? `If correct, respond "✅ Correct!" then present this next phrase: "${next.original}".` : `If correct, respond "✅ Correct! This was the last tip — 🎉 All tips completed! Great job!"`;
            context = `The student said: "${current.original}"\nThe correction is: "${current.correct}"\nThe student answers: "${message}"\n\nValidate. ${nextPhrase}\nIf wrong, respond "❌ Almost! The correct form is: ${current.correct}. Try again." and wait for the student to try once more. Do NOT present a new tip until they get it right.`;
        }
    } else if (pureChat) {
        // Modo "Solo conversar": memoria desde la tabla teacher_pure_chat
        const { data: recentMessages } = await supabase.from('teacher_pure_chat')
            .select('role, content, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (recentMessages?.length > 0) {
            const historial = recentMessages.reverse().map(m =>
                `[${m.role === 'user' ? 'Person' : 'AI'}] ${m.content}`
            ).join('\n');
            context = `--- CONVERSATION HISTORY (free chat) ---\n${historial}\n\nUse this history as your memory of what was talked about. Reference it naturally if relevant, but do NOT recap everything.\n`;
        }
    } else {
        // Modo conversación normal: pasar historial reciente
        const { data: recentMessages } = await supabase.from('teacher')
            .select('role, content, created_at')
            .eq('user_id', userId)
            .neq('role', 'tips_diarios')
            .order('created_at', { ascending: false })
            .limit(50);

        if (recentMessages?.length > 0) {
            const historial = recentMessages.reverse().map(m =>
                `[${m.role === 'user' ? 'Student' : 'Teacher'}] ${m.content}`
            ).join('\n');
            context = `--- CONVERSATION HISTORY (English class) ---\n${historial}\n\nUse this history to review past concepts naturally. Refer to specific phrases the student said before.\n`;
        }
    }

    const finalPrompt = intent === 'teacher_review'
        ? (context || 'Begin the review.')
        : (context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message);

    // Llamar a Mistral con retry
    const keys = [process.env.MISTRAL_API_KEY, process.env.MISTRAL_API_KEY_2].filter(Boolean);
    if (!keys.length) throw new Error("Falta API Key de Mistral");

    const promptKey = pureChat && intent === 'teacher' ? 'teacher_pure' : intent;
    const sysPrompt = SYSTEM_PROMPTS[promptKey];
    let lastErr;
    for (const key of keys) {
        try {
            const messages = [
                { role: "system", content: sysPrompt },
                ...(history || []).map(h => ({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.parts?.[0]?.text || ''
                })),
                { role: "user", content: finalPrompt }
            ];

            const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MISTRAL_MODEL,
                    messages,
                    temperature: intent === 'teacher_review' ? 0.3 : 0.8,
                    max_tokens: 2048
                })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(`Mistral Error ${response.status}: ${err.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const texto = data.choices?.[0]?.message?.content || '';

            // Tras validación del quiz: marcar como completado solo si acertó
            if (intent === 'teacher_review' && texto && reviewAnswered && flatTips.length > 0) {
                if (texto.includes('✅')) {
                    try {
                        await supabase.from('teacher_review').insert({
                            user_id: userId,
                            tip_key: flatTips[0].key
                        });
                    } catch (_) {}
                }
            }

            // Guardar respuesta de la IA (solo en modo conversación)
            if (intent !== 'teacher_review') {
                const tabla = pureChat ? 'teacher_pure_chat' : 'teacher';
                await supabase.from(tabla).insert({
                    user_id: userId,
                    role: 'assistant',
                    content: texto
                }).maybeSingle();
            }

            return { text: texto, newTips, totalDays: allTips?.length || 0 };
        } catch (e) {
            lastErr = e;
            const isRetryable = e.message.includes('429') || e.message.includes('503') || e.message.includes('Too Many Requests') || e.message.includes('401');
            if (!isRetryable) break;
        }
    }
    throw lastErr;
}

function setupStreamHeaders(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
}

function handleError(error, res, stream) {
    console.error("⛔ [Backend Chat Error]:", error);
    if (res.writableEnded) return;

    const msg = error.message.includes("Gemini Error") || error.message.includes("Mistral Error")
        ? "El Mentor está meditando profundamente... Prueba de nuevo."
        : "Error técnico temporal.";

    if (stream) {
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
    } else {
        res.status(500).json({ error: msg, details: error.message });
    }
}

/**
 * Chat de rol/personaje configurable (página persona.html).
 * Sin persistencia: conversación efímera por sesión (solo el historial en memoria del cliente).
 */
async function personaChat(body) {
    const { message, history = [], persona = '' } = body;
    if (!message) throw new Error("Se requiere un mensaje");

    // Contexto con la persona actual y el historial enviado por el cliente
    let context = '';
    if (persona) {
        context += `--- PERSONA ACTUAL ---\n${persona}\n\n`;
    }
    if (history?.length > 0) {
        const historial = history.map(h =>
            `[${h.role === 'model' ? 'Persona' : 'Usuario'}] ${h.parts?.[0]?.text || ''}`
        ).join('\n');
        context += `--- HISTORIAL DE CONVERSACIÓN ---\n${historial}\n\nUsa este historial como memoria de lo hablado. Referencia temas previos con naturalidad, no lo recapitules todo.\n`;
    }

    const finalPrompt = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;
    const sysPrompt = SYSTEM_PROMPTS['persona_chat'];

    const keys = [process.env.MISTRAL_API_KEY, process.env.MISTRAL_API_KEY_2].filter(Boolean);
    if (!keys.length) throw new Error("Falta API Key de Mistral");

    let lastErr;
    for (const key of keys) {
        try {
            const messages = [
                { role: "system", content: sysPrompt },
                ...(history || []).map(h => ({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.parts?.[0]?.text || ''
                })),
                { role: "user", content: finalPrompt }
            ];

            const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MISTRAL_MODEL,
                    messages,
                    temperature: 0.85,
                    max_tokens: 2048
                })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(`Mistral Error ${response.status}: ${err.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const texto = data.choices?.[0]?.message?.content || '';

            return { text: texto };
        } catch (e) {
            lastErr = e;
            const isRetryable = e.message.includes('429') || e.message.includes('503') || e.message.includes('Too Many Requests') || e.message.includes('401');
            if (!isRetryable) break;
        }
    }
    throw lastErr;
}

/**
 * Actualiza el contenido de un mensaje de la tabla teacher (edición de correcciones IA).
 */
async function updateTeacherMessage(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { userId, messageId, content } = req.body || {};

    if (!userId || !messageId) return res.status(400).json({ error: "Se requiere userId y messageId" });
    if (typeof content !== 'string') return res.status(400).json({ error: "Se requiere content" });

    try {
        const { data, error } = await supabase
            .from('teacher')
            .update({ content })
            .eq('id', messageId)
            .eq('user_id', userId)
            .select('id')
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Mensaje no encontrado o sin permisos" });

        return res.status(200).json({ success: true, id: data.id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
