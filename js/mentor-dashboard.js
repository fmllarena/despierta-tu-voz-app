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
    debugInfo: document.getElementById('debugInfo')
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
        await cargarListaAlumnos();
    } catch (e) {
        console.error("Error inicializando dashboard:", e);
        alert("❌ Error al conectar con el servidor: " + e.message);
    }
}

async function cargarListaAlumnos() {
    if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = "🔍 Cargando lista de alumnos...";

    try {
        // Simplificamos la consulta para evitar errores si no existe la columna de actividad
        const { data: alumnos, error } = await supabase
            .from('user_profiles')
            .select('nombre, email, user_id')
            .order('nombre', { ascending: true });

        if (error) {
            console.error("Error Supabase (Cargar lista):", error);
            if (ELEMENTS.searchStatus) {
                ELEMENTS.searchStatus.innerText = `❌ Error: ${error.message} (${error.code})`;
                ELEMENTS.searchStatus.style.color = "#e74c3c";
            }
            if (ELEMENTS.debugInfo) ELEMENTS.debugInfo.innerText += ` | DB Error: ${error.code}`;
            return;
        }

        if (!alumnos || alumnos.length === 0) {
            console.warn("Consulta exitosa pero lista vacía. Verifica RLS.");
            if (ELEMENTS.searchStatus) {
                ELEMENTS.searchStatus.innerHTML = "⚠️ <b>Lista vacía.</b> Necesitas activar el permiso SQL 'Mentor puede ver perfiles' en Supabase.";
                ELEMENTS.searchStatus.style.color = "#d35400";
            }
            return;
        }

        console.log("Alumnos encontrados:", alumnos.length);
        console.table(alumnos.map(a => ({ nombre: a.nombre, email: a.email })));

        alumnosMap = {}; // Limpiamos el mapa
        ELEMENTS.studentList.innerHTML = '';
        alumnos.forEach(alum => {
            if (!alum.email) return;
            alumnosMap[alum.email.toLowerCase()] = alum.user_id;

            const option = document.createElement('option');
            // El value es lo que se insertará al seleccionar (el email)
            option.value = alum.email;
            // El label/texto es lo que el mentor ve para elegir
            const label = alum.nombre ? `${alum.nombre} (${alum.email})` : alum.email;
            option.textContent = label;
            option.label = label;
            ELEMENTS.studentList.appendChild(option);
        });

        if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = `✅ ${alumnos.length} alumnos cargados.`;
        if (ELEMENTS.debugInfo) ELEMENTS.debugInfo.innerText += ` | Alumnos: ${alumnos.length}`;
        console.log(`Debug Dashboard: Cargados ${alumnos.length} alumnos.`, alumnos);
    } catch (e) {
        console.error("Error crítico lista alumnos:", e);
        if (ELEMENTS.searchStatus) ELEMENTS.searchStatus.innerText = "❌ Error inesperado cargando la lista.";
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

    try {
        // 1. Obtener el ID del usuario (desde el mapa o consulta simple)
        const emailLower = email.toLowerCase();
        let userId = alumnosMap[emailLower];

        if (!userId) {
            const { data: userData, error: userError } = await supabase
                .from('user_profiles')
                .select('user_id, mentor_notes')
                .eq('email', email)
                .single();
            if (userError || !userData) throw new Error("Alumno no encontrado. Asegúrate de que el email es correcto.");
            userId = userData.user_id;
            ELEMENTS.mentorNotes.value = userData.mentor_notes || '';
        } else {
            // Si ya tenemos el ID, solo traemos las notas actuales
            const { data: record } = await supabase
                .from('user_profiles')
                .select('mentor_notes')
                .eq('user_id', userId)
                .single();
            ELEMENTS.mentorNotes.value = record?.mentor_notes || '';
        }

        currentStudentId = userId;

        // 2. Llamar a la API de Briefing (La API ahora se encarga de buscar mensajes y coaching)
        const briefingResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'mentor_briefing',
                message: `Genera el informe para ${email}`,
                userId: currentStudentId,
                mentorPassword: pass
            })
        });

        const briefingData = await briefingResponse.json();
        if (briefingData.error) throw new Error(briefingData.error);

        ELEMENTS.reportContent.innerText = briefingData.text;
        ELEMENTS.reportContainer.style.display = 'block';

    } catch (e) {
        console.error("Error generando briefing:", e);
        alert("Error: " + e.message);
    } finally {
        ELEMENTS.generateBtn.disabled = false;
        ELEMENTS.loading.style.display = 'none';
    }
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
