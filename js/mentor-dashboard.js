import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

let supabase;
let alumnosMap = {}; // Mapa para guardar email -> user_id
let currentStudentId = null;
const MENTOR_EMAIL = 'fernando@despiertatuvoz.com';

const ELEMENTS = {
    studentEmail: document.getElementById('studentEmail'),
    studentList: document.getElementById('studentList'),
    searchStatus: document.getElementById('searchStatus'),
    reloadStudentsBtn: document.getElementById('reloadStudentsBtn'),
    mentorPass: document.getElementById('mentorPass'),
    generateBtn: document.getElementById('generateBtn'),
    loading: document.getElementById('loading'),
    reportContainer: document.getElementById('reportContainer'),
    reportContent: document.getElementById('reportContent'),
    mentorNotes: document.getElementById('mentorNotes'),
    saveNotesBtn: document.getElementById('saveNotesBtn'),
    customQuery: document.getElementById('customQuery'),
    debugInfo: document.getElementById('debugInfo'),
    // Elementos del nuevo Chat Consultivo
    advisorChatBox: document.getElementById('advisorChatBox'),
    advisorInput: document.getElementById('advisorInput'),
    sendAdvisorBtn: document.getElementById('sendAdvisorBtn')
};

async function init() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        supabase = createClient(config.url, config.key);

        const { data: { session } } = await supabase.auth.getSession();
        const currentEmail = session?.user?.email?.toLowerCase();
        console.log("Sesión activa:", currentEmail);

        if (ELEMENTS.debugInfo) {
            ELEMENTS.debugInfo.innerText = `Sesión: ${currentEmail || 'No iniciada'}`;
        }

        if (!session || currentEmail !== MENTOR_EMAIL.toLowerCase()) {
            if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = `⚠️ Acceso restringido: Debes ser ${MENTOR_EMAIL}.`;
            setTimeout(() => {
                if (!session) alert("No hay sesión activa. Por favor, logueate primero.");
                else alert(`Acceso denegado. Estás como: ${currentEmail}.`);
                window.location.href = 'index.html';
            }, 3000);
            return;
        }

        ELEMENTS.generateBtn.onclick = generateBriefing;
        ELEMENTS.saveNotesBtn.onclick = saveNotes;
        if (ELEMENTS.reloadStudentsBtn) ELEMENTS.reloadStudentsBtn.onclick = cargarListaAlumnos;

        // Listeners del Chat Consultivo
        ELEMENTS.sendAdvisorBtn.onclick = consultarAsesor;
        ELEMENTS.advisorInput.onkeypress = (e) => { if (e.key === 'Enter') consultarAsesor(); };

        await cargarListaAlumnos();
    } catch (e) {
        console.error("Error inicializando dashboard:", e);
        alert("❌ Error al conectar con el servidor: " + e.message);
    }
}

async function cargarListaAlumnos() {
    if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = "🔍 Cargando lista de alumnos...";
    if (ELEMENTS.studentList) ELEMENTS.studentList.innerHTML = "";

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('email, nombre')
            .not('email', 'is', null)
            .order('nombre', { ascending: true });

        if (error) throw error;

        if (ELEMENTS.studentList) {
            data.forEach(alumno => {
                const option = document.createElement('option');
                option.value = alumno.email;
                option.textContent = alumno.nombre ? `${alumno.nombre} (${alumno.email})` : alumno.email;
                ELEMENTS.studentList.appendChild(option);
            });
        }

        if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = `✅ ${data.length} alumnos cargados.`;
    } catch (e) {
        console.error("Error crítico lista alumnos:", e);
        if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = "❌ Error al cargar lista.";
    }
}

async function generateBriefing() {
    const email = ELEMENTS.studentEmail.value.trim();
    const pass = ELEMENTS.mentorPass.value.trim();

    if (!email) return alert("Por favor, introduce el email del alumno.");
    if (!pass) return alert("Por favor, introduce tu clave de mentor.");

    ELEMENTS.generateBtn.disabled = true;
    ELEMENTS.loading.style.display = 'block';
    ELEMENTS.reportContainer.style.display = 'none';

    // Resetear info previa si existe
    if (ELEMENTS.reportContent) ELEMENTS.reportContent.innerText = "";

    try {
        // 1. PASO 1: Búsqueda rápida (Reducimos variables para evitar timeout)
        const emailLower = email.toLowerCase();

        // Buscamos solo lo esencial primero
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('user_id, nombre, nivel_alquimia, mentor_notes')
            .eq('email', emailLower)
            .maybeSingle();

        if (userError) throw userError;
        if (!userData) throw new Error("Alumno no encontrado. Revisa si el email es correcto.");

        currentStudentId = userData.user_id;
        ELEMENTS.mentorNotes.value = userData.mentor_notes || '';

        // Actualizar UI con información rápida
        ELEMENTS.loading.innerHTML = `<p>✅ Alumno encontrado: <strong>${userData.nombre || 'Sin nombre'}</strong> (Nivel ${userData.nivel_alquimia || 1}/10)</p>
                                    <p>🔮 Generando ahora el informe estratégico... Esto puede tardar unos segundos.</p>`;

        // 2. PASO 2: Llamada a la API de Briefing (Este es el proceso pesado)
        const customQ = ELEMENTS.customQuery.value.trim();
        const finalMessage = customQ
            ? `CONSULTA ESPECÍFICA: ${customQ}\n(Para el alumno ${email})`
            : `Genera el informe para ${email}`;

        const briefingResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'mentor_briefing',
                message: finalMessage,
                userId: currentStudentId,
                mentorPassword: pass
            })
        });

        const briefingData = await briefingResponse.json();

        if (briefingData.error) {
            if (briefingData.isTimeout) {
                throw new Error("El servidor ha tardado demasiado en recopilar toda la historia vocal. Prueba de nuevo en unos segundos, ¡a veces el Mentor necesita un segundo resuello!");
            }
            throw new Error(briefingData.error);
        }

        if (window.marked) {
            ELEMENTS.reportContent.innerHTML = window.marked.parse(briefingData.text);
        } else {
            ELEMENTS.reportContent.innerText = briefingData.text;
        }
        ELEMENTS.reportContainer.style.display = 'block';

    } catch (e) {
        console.error("Error en el proceso:", e);
        alert("Aviso: " + e.message);
        ELEMENTS.loading.innerHTML = `<p style="color: #e74c3c;">❌ Error: ${e.message}</p>`;
    } finally {
        ELEMENTS.generateBtn.disabled = false;
        if (ELEMENTS.reportContainer.style.display === 'block' || ELEMENTS.loading.innerHTML.includes('❌')) {
            ELEMENTS.loading.style.display = 'none';
        }
        setTimeout(() => {
            if (ELEMENTS.loading.style.display === 'none') {
                ELEMENTS.loading.innerHTML = '<p>🔮 Conectando con la sabiduría del Mentor... Analizando historial...</p>';
            }
        }, 3000);
    }
}

async function consultarAsesor() {
    const query = ELEMENTS.advisorInput.value.trim();
    const pass = ELEMENTS.mentorPass.value.trim();

    if (!query) return;
    if (!currentStudentId) return alert("Primero debes generar el informe de un alumno para tener contexto.");
    if (!pass) return alert("Introduce tu clave de mentor para consultar al asesor.");

    // Añadir mensaje del mentor a la UI
    appendChatMessage('mentor', query);
    ELEMENTS.advisorInput.value = "";
    ELEMENTS.advisorInput.disabled = true;

    // Indicador de "pensando" en el chat
    const thinkingId = 'thinking-' + Date.now();
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = thinkingId;
    thinkingDiv.className = 'chat-msg ia';
    thinkingDiv.innerText = "Analizando historial...";
    ELEMENTS.advisorChatBox.appendChild(thinkingDiv);
    ELEMENTS.advisorChatBox.scrollTop = ELEMENTS.advisorChatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'mentor_advisor',
                message: query,
                userId: currentStudentId,
                mentorPassword: pass
            })
        });

        const data = await response.json();
        document.getElementById(thinkingId)?.remove();

        if (data.error) throw new Error(data.error);

        appendChatMessage('ia', data.text);

    } catch (e) {
        console.error("Error consulta asesor:", e);
        document.getElementById(thinkingId)?.remove();
        appendChatMessage('ia', "❌ Error: " + e.message);
    } finally {
        ELEMENTS.advisorInput.disabled = false;
        ELEMENTS.advisorInput.focus();
    }
}

function appendChatMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role}`;

    if (role === 'ia' && window.marked) {
        msgDiv.innerHTML = window.marked.parse(text);
    } else {
        msgDiv.innerText = text;
    }

    ELEMENTS.advisorChatBox.appendChild(msgDiv);
    ELEMENTS.advisorChatBox.scrollTop = ELEMENTS.advisorChatBox.scrollHeight;
}

async function saveNotes() {
    if (!currentStudentId) return alert("Primero debes generar el informe de un alumno.");

    ELEMENTS.saveNotesBtn.disabled = true;
    ELEMENTS.saveNotesBtn.innerText = "Guardando...";

    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                mentor_notes: ELEMENTS.mentorNotes.value.trim(),
                last_active_at: new Date().toISOString()
            })
            .eq('user_id', currentStudentId);

        if (error) throw error;
        alert("Anotaciones guardadas correctamente. La IA las tendrá en cuenta en el próximo encuentro. ✨");

    } catch (e) {
        console.error("Error guardando notas:", e);
        alert("No se pudieron guardar las notas: " + e.message);
    } finally {
        ELEMENTS.saveNotesBtn.disabled = false;
        ELEMENTS.saveNotesBtn.innerText = "Guardar Anotaciones ✨";
    }
}

init();
