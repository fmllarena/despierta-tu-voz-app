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
    const confirmDelete = confirm("¿Estás COMPLETAMENTE seguro de que quieres cerrar tu bitácora de forma definitiva? Esta acción es IRREVERSIBLE, se borrarán todos tus datos, tus progresos y tu cuenta para siempre. 🌿");

    if (confirmDelete) {
        showStatus('Procesando tu baja definitiva... Un momento, por favor.', 'success');
        ELEMENTS.deleteAccountBtn.disabled = true;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa");

            // Llamada a la Edge Function de eliminación real
            const { data, error } = await supabase.functions.invoke('delete-user-account', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;

            showStatus('Tu cuenta y tus datos han sido eliminados correctamente. Gracias por habernos permitido acompañarte en este tramo de tu viaje. Te deseamos lo mejor. ✨', 'success');

            // Cerrar sesión localmente y redirigir
            setTimeout(async () => {
                await supabase.auth.signOut();
                window.location.href = 'landing.html';
            }, 3000);

        } catch (e) {
            console.error("Error deleting account:", e);
            showStatus('No pudimos completar la eliminación automática. Por favor, contacta con nosotros en soporte@despiertatuvoz.com para que lo hagamos manualmente.', 'error');
            ELEMENTS.deleteAccountBtn.disabled = false;
        }
    }
}

ELEMENTS.saveBtn.addEventListener('click', savePreferences);
ELEMENTS.deleteAccountBtn.addEventListener('click', requestAccountDeletion);

init();
