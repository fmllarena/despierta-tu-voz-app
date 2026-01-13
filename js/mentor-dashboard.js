import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

let supabase;
let currentStudentId = null;
const MENTOR_EMAIL = 'fernando@despiertatuvoz.com';

const ELEMENTS = {
    studentEmail: document.getElementById('studentEmail'),
    mentorPass: document.getElementById('mentorPass'),
    generateBtn: document.getElementById('generateBtn'),
    loading: document.getElementById('loading'),
    reportContainer: document.getElementById('reportContainer'),
    reportContent: document.getElementById('reportContent'),
    mentorNotes: document.getElementById('mentorNotes'),
    saveNotesBtn: document.getElementById('saveNotesBtn')
};

async function init() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        supabase = createClient(config.url, config.key);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.email !== MENTOR_EMAIL) {
            alert("Acceso denegado. Solo el mentor puede acceder a esta herramienta.");
            window.location.href = 'index.html';
            return;
        }

        ELEMENTS.generateBtn.onclick = generateBriefing;
        ELEMENTS.saveNotesBtn.onclick = saveNotes;
    } catch (e) {
        console.error("Error inicializando dashboard:", e);
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
        // 1. Buscar el ID del usuario por email
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('user_id, nombre, subscription_tier, last_hito_completed, mentor_notes')
            .eq('email', email)
            .single();

        if (userError || !userData) throw new Error("Alumno no encontrado.");
        currentStudentId = userData.user_id;
        ELEMENTS.mentorNotes.value = userData.mentor_notes || '';

        // 2. Obtener datos de coaching
        const { data: coachingData } = await supabase
            .from('user_coaching_data')
            .select('*')
            .eq('user_id', userData.user_id)
            .single();

        // 3. Obtener últimos mensajes
        const { data: messages } = await supabase
            .from('mensajes')
            .select('texto, emisor, created_at')
            .eq('alumno', userData.user_id)
            .order('created_at', { ascending: false })
            .limit(20);

        // 4. Preparar contexto para la IA
        const context = {
            alumno: userData.nombre,
            tier: userData.subscription_tier,
            last_hito: userData.last_hito_completed,
            coaching: coachingData || "Sin datos de viaje todavía.",
            mensajes_recientes: messages?.reverse().map(m => `${m.emisor}: ${m.texto}`).join('\n') || "Sin historial de chat."
        };

        // 5. Llamar a la API de Briefing
        const briefingResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'mentor_briefing',
                message: `Genera el informe para ${email}`,
                context: JSON.stringify(context),
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
