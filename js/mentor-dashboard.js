import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

let supabase;
let currentStudentId = null;
let currentStudentName = null;
let currentStudentId2 = null;
let currentStudentName2 = null;
let advisorHistory = [];
let advisorFile = null;

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
    comparisonToggleBtn: document.getElementById('comparisonToggleBtn'),
    secondStudentSection: document.getElementById('secondStudentSection'),
    studentEmail2: document.getElementById('studentEmail2'),
    studentList2: document.getElementById('studentList2'),
    selectStudentBtn2: document.getElementById('selectStudentBtn2'),
};

async function init() {
    aplicarModoOscuro();
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        supabase = createClient(config.url, config.key, {
            auth: { storageKey: 'sb-mentor-auth-token' }
        });

        ELEMENTS.loginBtn.onclick = login;
        ELEMENTS.loginPassword.onkeypress = (e) => { if (e.key === 'Enter') login(); };

        // Inicializar toggle de visibilidad de contraseñas
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const inputId = btn.getAttribute('data-target');
                const input = document.getElementById(inputId);
                const svg = btn.querySelector('svg');
                if (input.type === 'password') {
                    input.type = 'text';
                    svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24</path><line x1="1" y1="1" x2="23" y2="23"></line>`;
                } else {
                    input.type = 'password';
                    svg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
                }
            });
        });

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

    aplicarModoOscuro();
    ELEMENTS.toggleDarkMode = document.getElementById('toggleDarkMode');
    if (ELEMENTS.toggleDarkMode) ELEMENTS.toggleDarkMode.onclick = toggleDarkMode;

    ELEMENTS.logoutBtnDash.onclick = logout;
    ELEMENTS.reloadStudentsBtn.onclick = cargarListaAlumnos;
    ELEMENTS.selectStudentBtn.onclick = seleccionarAlumno;
    ELEMENTS.studentEmail.onkeypress = (e) => { if (e.key === 'Enter') seleccionarAlumno(); };
    ELEMENTS.generateBtn.onclick = generateBriefing;
    ELEMENTS.saveNotesBtn.onclick = saveNotes;
    ELEMENTS.sendAdvisorBtn.onclick = consultarAsesor;
    ELEMENTS.advisorInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); consultarAsesor(); } };
    ELEMENTS.advisorInput.oninput = autoResizeInput;
    ELEMENTS.changeStudentBtn.onclick = cambiarAlumno;
    ELEMENTS.comparisonToggleBtn.onclick = toggleModoComparacion;
    ELEMENTS.selectStudentBtn2.onclick = seleccionarAlumno2;
    ELEMENTS.studentEmail2.onkeypress = (e) => { if (e.key === 'Enter') seleccionarAlumno2(); };

    const copyConvBtn = document.getElementById('copyConversationBtn');
    if (copyConvBtn) {
        copyConvBtn.onclick = copiarConversacion;
    }

    const clearConvBtn = document.getElementById('clearConversationBtn');
    if (clearConvBtn) {
        clearConvBtn.onclick = limpiarConversacion;
    }

    initAdvisorUpload();
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
    if (ELEMENTS.studentList2) ELEMENTS.studentList2.innerHTML = "";

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('email, nombre')
            .not('email', 'is', null)
            .order('nombre', { ascending: true });

        if (error) throw error;

        const poblar = (listEl) => {
            if (!listEl) return;
            data.forEach(alumno => {
                const option = document.createElement('option');
                option.value = alumno.email;
                option.textContent = alumno.nombre ? `${alumno.nombre} (${alumno.email})` : alumno.email;
                listEl.appendChild(option);
            });
        };
        poblar(ELEMENTS.studentList);
        poblar(ELEMENTS.studentList2);

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
        advisorHistory = [];
        ELEMENTS.mentorNotes.value = userData.mentor_notes || '';
        ELEMENTS.studentInfoText.innerText = `👤 ${currentStudentName} (Nivel ${userData.nivel_alquimia || 1}/10)`;
        ELEMENTS.studentInfo.style.display = 'flex';
        ELEMENTS.reportContainer.style.display = 'block';
        ELEMENTS.reportContent.innerHTML = '<p class="report-placeholder">Alumno cargado. Puedes chatear o solicitar un informe.</p>';
        const compMsg = currentStudentId2 && currentStudentName2 ? ` / <strong>${currentStudentName2}</strong>` : '';
        ELEMENTS.advisorChatBox.innerHTML = `<div class="chat-msg ia">Alumno seleccionado: <strong>${currentStudentName}</strong>${compMsg}. ¿Qué quieres consultar?</div>`;

        // Si hay consulta específica escrita, enviarla automáticamente al chat asesor
        const queryText = ELEMENTS.customQuery.value.trim();
        if (queryText) {
            ELEMENTS.advisorInput.value = queryText;
            ELEMENTS.customQuery.value = '';
            consultarAsesor();
        }

        console.log(`Alumno seleccionado: ${currentStudentName} (${currentStudentId})`);
    } catch (e) {
        alert(e.message);
    }
}

function cambiarAlumno() {
    currentStudentId = null;
    currentStudentName = null;
    currentStudentId2 = null;
    currentStudentName2 = null;
    advisorHistory = [];
    ELEMENTS.studentInfo.style.display = 'none';
    ELEMENTS.studentEmail.value = '';
    ELEMENTS.studentEmail.focus();
    ELEMENTS.reportContainer.style.display = 'none';
    ELEMENTS.mentorNotes.value = '';
}

function toggleModoComparacion() {
    const section = ELEMENTS.secondStudentSection;
    const btn = ELEMENTS.comparisonToggleBtn;
    if (section.style.display === 'none') {
        section.style.display = 'block';
        btn.textContent = '✕ Modo comparación';
        btn.style.background = '#e74c3c';
        btn.style.boxShadow = '0 4px 15px rgba(231,76,60,0.3)';
    } else {
        section.style.display = 'none';
        btn.textContent = '➕ Modo comparación';
        btn.style.background = '#6c757d';
        btn.style.boxShadow = '0 4px 15px rgba(108,117,125,0.3)';
        currentStudentId2 = null;
        currentStudentName2 = null;
        ELEMENTS.studentEmail2.value = '';
        if (currentStudentName && ELEMENTS.studentInfoText) {
            ELEMENTS.studentInfoText.innerText = `👤 ${currentStudentName}`;
        }
    }
}

async function seleccionarAlumno2() {
    const email = ELEMENTS.studentEmail2.value.trim();
    if (!email) return alert("Introduce el email del segundo alumno.");

    try {
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('user_id, nombre')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (userError) throw userError;
        if (!userData) throw new Error("Alumno no encontrado.");

        currentStudentId2 = userData.user_id;
        currentStudentName2 = userData.nombre || email;
        const baseName = currentStudentName || '—';
        ELEMENTS.studentInfoText.innerText = `👤 ${baseName} | ${currentStudentName2} (Modo Comparación)`;
        ELEMENTS.advisorChatBox.innerHTML = `<div class="chat-msg ia">Alumno seleccionado: <strong>${baseName}</strong> / <strong>${currentStudentName2}</strong>. ¿Qué quieres consultar?</div>`;
    } catch (e) {
        alert(e.message);
    }
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
                userId: currentStudentId,
                userId2: currentStudentId2
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
    if (!query && !advisorFile) return;
    if (!currentStudentId) return alert("Primero selecciona un alumno.");

    const msgText = query || "Analiza esta imagen.";
    appendChatMessage('mentor', msgText);
    ELEMENTS.advisorInput.value = "";
    ELEMENTS.sendAdvisorBtn.disabled = true;

    const thinkingId = 'thinking-' + Date.now();
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = thinkingId;
    thinkingDiv.className = 'chat-msg ia';
    thinkingDiv.innerText = "Analizando historial...";
    ELEMENTS.advisorChatBox.appendChild(thinkingDiv);
    ELEMENTS.advisorChatBox.scrollTop = ELEMENTS.advisorChatBox.scrollHeight;

    let fileData = null;
    if (advisorFile) {
        fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ mimeType: advisorFile.type, data: reader.result.split(',')[1], name: advisorFile.name });
            reader.onerror = reject;
            reader.readAsDataURL(advisorFile);
        });
        advisorFile = null;
        const preview = document.getElementById('advisorFilePreview');
        if (preview) preview.style.display = 'none';
        const input = document.querySelector('input[type="file"][accept*="png"]');
        if (input) input.value = '';
    }

    try {
        const body = {
            intent: 'mentor_advisor',
            message: msgText,
            history: advisorHistory,
            userId: currentStudentId,
            userId2: currentStudentId2
        };
        if (fileData) body.fileData = fileData;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        document.getElementById(thinkingId)?.remove();

        if (data.error) throw new Error(data.error);

        console.log(`[Modelo IA] ${data.info || 'desconocido'}`);
        appendChatMessage('ia', data.text);
        const now = new Date().toISOString();
        advisorHistory.push({ role: 'user', parts: [{ text: msgText }], created_at: now });
        advisorHistory.push({ role: 'model', parts: [{ text: data.text }], created_at: now });

    } catch (e) {
        console.error("Error consulta asesor:", e);
        document.getElementById(thinkingId)?.remove();
        appendChatMessage('ia', "❌ Error: " + e.message);
    } finally {
        ELEMENTS.sendAdvisorBtn.disabled = false;
        ELEMENTS.advisorInput.focus();
    }
}

function aplicarModoOscuro() {
    const isDark = localStorage.getItem('mentorDarkMode') === 'true';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('toggleDarkMode');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

function toggleDarkMode() {
    const isDark = localStorage.getItem('mentorDarkMode') !== 'true';
    localStorage.setItem('mentorDarkMode', isDark);
    aplicarModoOscuro();
}

function autoResizeInput() {
    ELEMENTS.advisorInput.style.height = 'auto';
    ELEMENTS.advisorInput.style.height = Math.min(ELEMENTS.advisorInput.scrollHeight, 120) + 'px';
}

function appendChatMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role}`;

    if (role === 'ia' && window.marked) {
        msgDiv.innerHTML = window.marked.parse(text);
    } else {
        msgDiv.innerText = text;
    }

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-msg-btn';
    copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    copyBtn.title = 'Copiar mensaje';
    copyBtn.style.position = 'static';
    copyBtn.onclick = (e) => {
        e.stopPropagation();
        copiarConFormato(msgDiv, text, copyBtn);
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'copy-msg-btn';
    delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
    delBtn.title = 'Borrar mensaje';
    delBtn.style.position = 'static';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        msgDiv.remove();
    };

    msgDiv.style.position = 'relative';
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'position:absolute;bottom:4px;right:4px;display:flex;gap:2px;';
    btnContainer.appendChild(copyBtn);
    btnContainer.appendChild(delBtn);
    msgDiv.appendChild(btnContainer);

    ELEMENTS.advisorChatBox.appendChild(msgDiv);
    if (role === 'ia') {
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        ELEMENTS.advisorChatBox.scrollTop = ELEMENTS.advisorChatBox.scrollHeight;
    }
}

function initAdvisorUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png,.jpg,.jpeg,.webp';
    input.style.display = 'none';
    document.body.appendChild(input);

    const btn = document.getElementById('advisorUploadBtn');
    const preview = document.createElement('div');
    preview.id = 'advisorFilePreview';
    preview.style.cssText = 'display:none;padding:4px 15px;font-size:0.75rem;color:var(--color-acento);background:#f0ede8;border-top:1px solid #ddd;';

    const chatInputArea = document.querySelector('.chat-input-area');
    if (chatInputArea) chatInputArea.parentNode.insertBefore(preview, chatInputArea);

    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 3.5 * 1024 * 1024) { alert('Imagen demasiado grande (máx 3.5MB).'); return; }
            advisorFile = file;
            preview.style.display = 'block';
            preview.innerHTML = `<span>🖼️ ${file.name}</span> <button style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:0.75rem;margin-left:8px;">✕</button>`;
            preview.querySelector('button').onclick = () => { advisorFile = null; preview.style.display = 'none'; input.value = ''; };
        }
    });
}

function copiarConFormato(msgDiv, plainText, copyBtn) {
    const htmlContent = msgDiv.innerHTML;
    const fallback = () => {
        navigator.clipboard.writeText(plainText).then(() => {
            copyBtn.innerHTML = '<span style="font-size:11px">✓ Copiado</span>';
            setTimeout(() => {
                copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
            }, 2000);
        });
    };
    try {
        if (navigator.clipboard.write) {
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([htmlContent], { type: 'text/html;charset=utf-8' }),
                    'text/plain': new Blob([plainText], { type: 'text/plain;charset=utf-8' })
                })
            ]).then(() => {
                copyBtn.innerHTML = '<span style="font-size:11px">✓ Copiado</span>';
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                }, 2000);
            }).catch(fallback);
        } else {
            fallback();
        }
    } catch (e) {
        fallback();
    }
}

function copiarConversacion() {
    const msgs = ELEMENTS.advisorChatBox.querySelectorAll('.chat-msg');
    let textParts = [];
    let htmlParts = [];
    msgs.forEach(msg => {
        const isIA = msg.classList.contains('ia');
        const label = isIA ? 'Asesor IA' : 'Mentor';
        const plain = `${label}:\n${msg.innerText.trim()}`;
        const rich = `<p><strong>${label}:</strong></p>${msg.innerHTML}`;
        textParts.push(plain);
        htmlParts.push(rich);
    });
    const fullText = textParts.join('\n\n---\n\n');
    const fullHtml = htmlParts.join('\n<hr>\n');
    navigator.clipboard.write([
        new ClipboardItem({
            'text/html': new Blob([fullHtml], { type: 'text/html;charset=utf-8' }),
            'text/plain': new Blob([fullText], { type: 'text/plain;charset=utf-8' })
        })
    ]).catch(() => navigator.clipboard.writeText(fullText));
    const btn = document.getElementById('copyConversationBtn');
    if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copiado';
        setTimeout(() => { btn.textContent = orig; }, 2000);
    }
}

function limpiarConversacion() {
    if (!confirm('¿Borrar toda la conversación del chat?')) return;
    ELEMENTS.advisorChatBox.innerHTML = '';
    advisorHistory = [];
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