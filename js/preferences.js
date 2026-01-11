import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

let supabase;
let userId = null;

const ELEMENTS = {
    marketingToggle: document.getElementById('marketingToggle'),
    lifecycleToggle: document.getElementById('lifecycleToggle'),
    transactionalToggle: document.getElementById('transactionalToggle'),
    saveBtn: document.getElementById('saveBtn'),
    statusMessage: document.getElementById('statusMessage'),
    deleteAccountBtn: document.getElementById('deleteAccountBtn')
};

async function init() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        supabase = createClient(config.url, config.key);

        // Check for User ID in URL
        const params = new URLSearchParams(window.location.search);
        userId = params.get('id');

        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        const loggedUser = session?.user;

        if (loggedUser) {
            userId = loggedUser.id;
        }

        if (userId) {
            loadPreferences(userId);
        } else {
            showStatus('Por favor, inicia sesión para gestionar tus preferencias.', 'error');
            ELEMENTS.saveBtn.disabled = true;
        }
    } catch (e) {
        console.error("Error initializing:", e);
        showStatus('Error al conectar con el servidor.', 'error');
    }
}

async function loadPreferences(id) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('consent_marketing, consent_lifecycle, email')
            .eq('user_id', id)
            .single();

        if (error) throw error;

        if (data) {
            ELEMENTS.marketingToggle.checked = data.consent_marketing !== false;
            ELEMENTS.lifecycleToggle.checked = data.consent_lifecycle !== false;
        }
    } catch (e) {
        console.error("Error loading preferences:", e);
        showStatus('No hemos podido encontrar tu bitácora. Asegúrate de haber iniciado sesión.', 'error');
    }
}

async function savePreferences() {
    if (!userId) return;

    ELEMENTS.saveBtn.disabled = true;
    ELEMENTS.saveBtn.innerText = "Guardando...";
    ELEMENTS.statusMessage.className = '';
    ELEMENTS.statusMessage.style.display = 'none';

    try {
        const updates = {
            consent_marketing: ELEMENTS.marketingToggle.checked,
            consent_lifecycle: ELEMENTS.lifecycleToggle.checked,
            last_active_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', userId);

        if (error) throw error;

        showStatus('Preferencias guardadas. Seguiremos acompañándote de la forma que mejor te sienta hoy. ✨', 'success');

        // El trigger de Supabase debería disparar el brevo-sync automáticamente
        // si está configurado para escuchar cambios en user_profiles.

    } catch (e) {
        console.error("Error saving preferences:", e);
        showStatus('Hubo un problema al guardar tus cambios. Por favor, inténtalo de nuevo.', 'error');
    } finally {
        ELEMENTS.saveBtn.disabled = false;
        ELEMENTS.saveBtn.innerText = "Guardar Preferencias";
    }
}

function showStatus(text, type) {
    ELEMENTS.statusMessage.innerText = text;
    ELEMENTS.statusMessage.className = type === 'success' ? 'status-success' : 'status-error';
    ELEMENTS.statusMessage.style.display = 'block';
}

async function requestAccountDeletion() {
    const confirmDelete = confirm("¿Estás completamente seguro de que quieres cerrar tu bitácora? Esta acción no se puede deshacer y borrará todo tu progreso y la memoria de tu Mentor.");

    if (confirmDelete) {
        showStatus('Solicitud recibida. Procesaremos la eliminación de tus datos en las próximas 48 horas. Sentimos verte partir, pero respetamos tu viaje. 🌿', 'success');

        // Aquí se podría enviar un email a administración o marcar un flag en la DB
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const email = user?.email || "Email desconocido";

            // Simulación de notificación a administración o registro de baja
            console.log(`Solicitud de baja definitiva para: ${email} (${userId})`);

            // Podríamos añadir una tabla 'deletion_requests' o enviar un webhook
            await supabase.from('user_profiles').update({
                deletion_requested_at: new Date().toISOString(),
                consent_marketing: false,
                consent_lifecycle: false
            }).eq('user_id', userId);

        } catch (e) {
            console.error("Error requesting deletion:", e);
        }
    }
}

ELEMENTS.saveBtn.addEventListener('click', savePreferences);
ELEMENTS.deleteAccountBtn.addEventListener('click', requestAccountDeletion);

init();
