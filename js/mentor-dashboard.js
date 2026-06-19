import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

let supabase;
let currentStudentId = null;
let currentStudentName = null;

const ELEMENTS = {
    loginSection: document.getElementById('loginSection'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginBtn: document.getElementById('loginBtn'),
    loginError: document.getElementById('loginError'),
    dashboardSection: document.getElementById('dashboardSection'),
    dashUserEmail: document.getElementById('dashUserEmail'),
    logoutBtnDash: document.getElementById('logoutBtnDash'),
    studentEmail: document.getElementById('studentEmail'),
    studentList: document.getElementById('studentList'),
    searchStatus: document.getElementById('searchStatus'),
    reloadStudentsBtn: document.getElementById('reloadStudentsBtn'),
    selectStudentBtn: document.getElementById('selectStudentBtn'),
    studentInfo: document.getElementById('studentInfo'),
    studentInfoText: document.getElementById('studentInfoText'),
    changeStudentBtn: document.getElementById('changeStudentBtn'),
    loading: document.getElementById('loading'),
    reportContainer: document.getElementById('reportContainer'),
    reportContent: document.getElementById('reportContent'),
    reportStatus: document.getElementById('reportStatus'),
    generateBtn: document.getElementById('generateBtn'),
    advisorChatBox: document.getElementById('advisorChatBox'),
    advisorInput: document.getElementById('advisorInput'),
    sendAdvisorBtn: document.getElementById('sendAdvisorBtn'),
    mentorNotes: document.getElementById('mentorNotes'),
    saveNotesBtn: document.getElementById('saveNotesBtn'),
    customQuery: document.getElementById('customQuery'),
};

async function init() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        supabase = createClient(config.url, config.key);

        ELEMENTS.loginBtn.onclick = login;
        ELEMENTS.loginPassword.onkeypress = (e) => { if (e.key === 'Enter') login(); };

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email?.toLowerCase() === 'fernando@despiertatuvoz.com') {
            mostrarDashboard(session.user.email);
        }
    } catch (e) {
        console.error("Error inicializando:", e);
        ELEMENTS.loginError.innerText = "Error al conectar con el servidor.";
    }
}

async function login() {
    const email = ELEMENTS.loginEmail.value.trim();
    const password = ELEMENTS.loginPassword.value.trim();

    if (!email || !password) {
        ELEMENTS.loginError.innerText = "Introduce email y contraseña.";
        return;
    }

    ELEMENTS.loginBtn.disabled = true;
    ELEMENTS.loginBtn.innerText = "Entrando...";
    ELEMENTS.loginError.innerText = "";

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user?.email?.toLowerCase() !== 'fernando@despiertatuvoz.com') {
            await supabase.auth.signOut();
            throw new Error("Acceso denegado. Este panel es solo para el mentor.");
        }

        mostrarDashboard(data.user.email);
    } catch (e) {
        console.error("Error login:", e);
        ELEMENTS.loginError.innerText = e.message;
        ELEMENTS.loginBtn.disabled = false;
        ELEMENTS.loginBtn.innerText = "Entrar";
    }
}

async function mostrarDashboard(email) {
    ELEMENTS.loginSection.style.display = 'none';
    ELEMENTS.dashboardSection.style.display = 'block';
    ELEMENTS.dashUserEmail.innerText = `Sesión: ${email}`;

    ELEMENTS.logoutBtnDash.onclick = logout;
    ELEMENTS.reloadStudentsBtn.onclick = cargarListaAlumnos;
    ELEMENTS.selectStudentBtn.onclick = seleccionarAlumno;
    ELEMENTS.studentEmail.onkeypress = (e) => { if (e.key === 'Enter') seleccionarAlumno(); };
    ELEMENTS.generateBtn.onclick = generateBriefing;
    ELEMENTS.saveNotesBtn.onclick = saveNotes;
    ELEMENTS.sendAdvisorBtn.onclick = consultarAsesor;
    ELEMENTS.advisorInput.onkeypress = (e) => { if (e.key === 'Enter') consultarAsesor(); };
    ELEMENTS.changeStudentBtn.onclick = cambiarAlumno;

    await cargarListaAlumnos();
}

async function logout() {
    await supabase.auth.signOut();
    currentStudentId = null;
    ELEMENTS.dashboardSection.style.display = 'none';
    ELEMENTS.loginSection.style.display = 'block';
    ELEMENTS.loginBtn.disabled = false;
    ELEMENTS.loginBtn.innerText = "Entrar";
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
        console.error("Error lista alumnos:", e);
        if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = "❌ Error al cargar lista.";
    }
}

async function seleccionarAlumno() {
    const email = ELEMENTS.studentEmail.value.trim();
    if (!email) return alert("Introduce el email del alumno.");

    try {
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('user_id, nombre, nivel_alquimia, mentor_notes')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (userError) throw userError;
        if (!userData) throw new Error("Alumno no encontrado.");

        currentStudentId = userData.user_id;
        currentStudentName = userData.nombre || email;
        ELEMENTS.mentorNotes.value = userData.mentor_notes || '';
        ELEMENTS.studentInfoText.innerText = `👤 ${currentStudentName} (Nivel ${userData.nivel_alquimia || 1}/10)`;
        ELEMENTS.studentInfo.style.display = 'flex';
        ELEMENTS.reportContainer.style.display = 'block';
        ELEMENTS.reportContent.innerHTML = '<p class="report-placeholder">Alumno cargado. Puedes chatear o solicitar un informe.</p>';
        ELEMENTS.advisorChatBox.innerHTML = `<div class="chat-msg ia">Alumno seleccionado: <strong>${currentStudentName}</strong>. ¿Qué quieres consultar?</div>`;
        console.log(`Alumno seleccionado: ${currentStudentName} (${currentStudentId})`);
    } catch (e) {
        alert(e.message);
    }
}

function cambiarAlumno() {
    currentStudentId = null;
    currentStudentName = null;
    ELEMENTS.studentInfo.style.display = 'none';
    ELEMENTS.studentEmail.value = '';
    ELEMENTS.studentEmail.focus();
    ELEMENTS.reportContainer.style.display = 'none';
    ELEMENTS.mentorNotes.value = '';
}

async function generateBriefing() {
    if (!currentStudentId) return alert("Primero selecciona un alumno.");

    ELEMENTS.generateBtn.disabled = true;
    ELEMENTS.loading.style.display = 'block';
    ELEMENTS.reportContent.innerHTML = '<p class="report-placeholder">Generando informe...</p>';

    try {
        const customQ = ELEMENTS.customQuery.value.trim();
        const finalMessage = customQ
            ? `CONSULTA ESPECÍFICA: ${customQ}\n(Para el alumno ${ELEMENTS.studentEmail.value.trim()})`
            : `Genera el informe para ${ELEMENTS.studentEmail.value.trim()}`;

        const briefingResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'mentor_briefing',
                message: finalMessage,
                userId: currentStudentId
            })
        });

        const briefingData = await briefingResponse.json();

        if (briefingData.error) {
            if (briefingData.isTimeout) {
                throw new Error("El servidor ha tardado demasiado. Prueba de nuevo.");
            }
            throw new Error(briefingData.error);
        }

        if (window.marked) {
            ELEMENTS.reportContent.innerHTML = window.marked.parse(briefingData.text);
        } else {
            ELEMENTS.reportContent.innerText = briefingData.text;
        }
        if (ELEMENTS.reportStatus) {
            ELEMENTS.reportStatus.innerText = `✨ ${briefingData.info || 'IA'}`;
        }
    } catch (e) {
        console.error("Error generando informe:", e);
        alert("Error: " + e.message);
        ELEMENTS.loading.innerHTML = `<p style="color: #e74c3c;">❌ Error: ${e.message}</p>`;
    } finally {
        ELEMENTS.generateBtn.disabled = false;
        ELEMENTS.loading.style.display = 'none';
    }
}

async function consultarAsesor() {
    const query = ELEMENTS.advisorInput.value.trim();
    if (!query) return;
    if (!currentStudentId) return alert("Primero selecciona un alumno.");

    appendChatMessage('mentor', query);
    ELEMENTS.advisorInput.value = "";
    ELEMENTS.sendAdvisorBtn.disabled = true;

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
                userId: currentStudentId
            })
        });

        const data = await response.json();
        document.getElementById(thinkingId)?.remove();

        if (data.error) throw new Error(data.error);

        console.log(`[Modelo IA] ${data.info || 'desconocido'}`);
        appendChatMessage('ia', data.text);

    } catch (e) {
        console.error("Error consulta asesor:", e);
        document.getElementById(thinkingId)?.remove();
        appendChatMessage('ia', "❌ Error: " + e.message);
    } finally {
        ELEMENTS.sendAdvisorBtn.disabled = false;
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
    if (!currentStudentId) return alert("Primero selecciona un alumno.");

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
        alert("Anotaciones guardadas correctamente. ✨");

    } catch (e) {
        console.error("Error guardando notas:", e);
        alert("No se pudieron guardar las notas: " + e.message);
    } finally {
        ELEMENTS.saveNotesBtn.disabled = false;
        ELEMENTS.saveNotesBtn.innerText = "Guardar Anotaciones ✨";
    }
}

init();