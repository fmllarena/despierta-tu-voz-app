import { ELEMENTS } from './elements.js';
import { supabaseClient, userProfile, chatHistory } from './config.js';
import { alertCustom } from './utils.js';

export const AJUSTES = window.AJUSTES = {
    abrirModal: async () => {
        if (!userProfile) {
            console.log("Perfil no cargado, intentando recuperar...");
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                // cargarPerfil está en main.js, lo llamamos vía window
                if (window.cargarPerfil) await window.cargarPerfil(user);
            } else {
                alert("Debes iniciar sesión para ver los ajustes.");
                return;
            }
        }

        if (!userProfile) {
            alert("No se pudo cargar tu perfil. Por favor, recarga la página.");
            return;
        }

        ELEMENTS.settingsUserName.innerText = userProfile.nombre || "Usuario";

        const TIER_NAMES = {
            'free': 'Explora',
            'pro': 'Profundiza',
            'premium': 'Transforma'
        };
        const tier = userProfile.subscription_tier || 'free';
        ELEMENTS.settingsUserTier.innerText = `PLAN ${TIER_NAMES[tier] || tier.toUpperCase()}`;

        // Cargar valores actuales tal cual están en la DB
        ELEMENTS.focusSlider.value = userProfile.mentor_focus ?? 5;
        ELEMENTS.personalitySlider.value = userProfile.mentor_personality ?? 5;
        ELEMENTS.lengthSlider.value = userProfile.mentor_length ?? 5;

        ELEMENTS.languageSelect.value = userProfile.mentor_language || 'es';
        ELEMENTS.weeklyGoalInput.value = userProfile.weekly_goal || '';

        // Ocultar botón de mejora si ya es Premium (Transforma)
        if (ELEMENTS.upgradeSettingsBtn) {
            ELEMENTS.upgradeSettingsBtn.style.display = tier === 'premium' ? 'none' : 'block';
        }

        ELEMENTS.settingsModal.style.display = 'flex';
    },

    cerrarModal: () => {
        ELEMENTS.settingsModal.style.display = 'none';
    },

    guardarAjustes: async () => {
        const btn = ELEMENTS.saveSettingsBtn;
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión.");

            const updates = {
                mentor_focus: parseInt(ELEMENTS.focusSlider.value),
                mentor_personality: parseInt(ELEMENTS.personalitySlider.value),
                mentor_length: parseInt(ELEMENTS.lengthSlider.value),
                mentor_language: ELEMENTS.languageSelect.value,
                weekly_goal: ELEMENTS.weeklyGoalInput.value.trim()
            };

            const { data: updatedProfile, error } = await supabaseClient
                .from('user_profiles')
                .update(updates)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            // Actualizar perfil local obligatoriamente con la respuesta del servidor
            if (updatedProfile) {
                // Actualizamos vía window para asegurar sincronización con config.js y main.js
                window.userProfile = updatedProfile;
            }

            console.log("✅ Ajustes guardados y perfil local sincronizado:", updates);
            alertCustom("Ajustes guardados correctamente.");
            AJUSTES.cerrarModal();
        } catch (e) {
            console.error("Error guardando ajustes:", e);
            alertCustom("Error al guardar: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Guardar Cambios";
        }
    },

    borrarHistorial: async () => {
        if (!confirm("¿Estás seguro de que quieres borrar todo el historial de chat? Esta acción no se puede deshacer.")) return;

        const btn = ELEMENTS.clearHistoryBtn;
        btn.disabled = true;
        btn.innerText = "Borrando...";

        try {
            const { error } = await supabaseClient
                .from('mensajes')
                .delete()
                .eq('alumno', userProfile.user_id);

            if (error) throw error;

            // Limpiar historial global
            if (window.chatHistory) window.chatHistory.length = 0;

            ELEMENTS.chatBox.innerHTML = "";

            // saludarUsuario está en main.js
            if (window.saludarUsuario) {
                window.saludarUsuario({ id: userProfile.user_id, email: userProfile.email }, userProfile);
            }

            alert("Historial borrado correctamente.");
        } catch (e) {
            console.error("Error borrando historial:", e);
            alert("Error: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Borrar Historial de Chat";
        }
    },

    setup() {
        // Event Listeners Ajustes
        ELEMENTS.ajustesBtn?.addEventListener('click', () => this.abrirModal());
        ELEMENTS.closeSettings?.addEventListener('click', () => this.cerrarModal());
        ELEMENTS.saveSettingsBtn?.addEventListener('click', () => this.guardarAjustes());
        ELEMENTS.clearHistoryBtn?.addEventListener('click', () => this.borrarHistorial());
        ELEMENTS.upgradeSettingsBtn?.addEventListener('click', () => {
            this.cerrarModal();
            ELEMENTS.upgradeModal.style.display = 'flex';
        });
    }
};

export const PREFERENCIAS = window.PREFERENCIAS = {
    abrirModal: () => {
        if (!userProfile) return alert("Inicia sesión para gestionar tus preferencias.");

        // Cargar estado actual
        ELEMENTS.marketingToggle.checked = userProfile.consent_marketing !== false;
        ELEMENTS.lifecycleToggle.checked = userProfile.consent_lifecycle !== false;
        ELEMENTS.prefStatusMessage.style.display = 'none';

        ELEMENTS.preferencesModal.style.display = 'flex';
    },

    cerrarModal: () => {
        ELEMENTS.preferencesModal.style.display = 'none';
    },

    guardar: async () => {
        const btn = ELEMENTS.savePreferencesBtn;
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            const updates = {
                consent_marketing: ELEMENTS.marketingToggle.checked,
                consent_lifecycle: ELEMENTS.lifecycleToggle.checked,
                last_active_at: new Date().toISOString()
            };

            const { error } = await supabaseClient
                .from('user_profiles')
                .update(updates)
                .eq('user_id', userProfile.user_id);

            if (error) throw error;

            Object.assign(userProfile, updates);
            this.showStatus("Preferencias guardadas. ✨", "success");
            setTimeout(() => this.cerrarModal(), 1500);
        } catch (e) {
            console.error(e);
            this.showStatus("Error al guardar.", "error");
        } finally {
            btn.disabled = false;
            btn.innerText = "Guardar Preferencias";
        }
    },

    showStatus: (text, type) => {
        const msg = ELEMENTS.prefStatusMessage;
        msg.innerText = text;
        msg.className = type === 'success' ? 'status-success' : 'status-error';
        msg.style.display = 'block';
    },

    borrarCuenta: async () => {
        const confirmDelete = confirm("¿Estás COMPLETAMENTE seguro? Esta acción es IRREVERSIBLE, se borrarán todos tus datos y progreso para siempre. 🌿");
        if (!confirmDelete) return;

        ELEMENTS.deleteAccountBtn.disabled = true;
        this.showStatus("Procesando baja definitiva...", "success");

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const { error } = await supabaseClient.functions.invoke('delete-user-account', {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (error) throw error;

            this.showStatus("Cuenta eliminada. Te deseamos lo mejor. ✨", "success");
            setTimeout(async () => {
                await supabaseClient.auth.signOut();
                location.reload();
            }, 3000);
        } catch (e) {
            console.error(e);
            this.showStatus("Error en la eliminación. Contacta con soporte.", "error");
            ELEMENTS.deleteAccountBtn.disabled = false;
        }
    },

    setup() {
        // Event Listeners Preferencias
        ELEMENTS.openPreferencesBtn?.addEventListener('click', () => this.abrirModal());
        ELEMENTS.closePreferences?.addEventListener('click', () => this.cerrarModal());
        ELEMENTS.savePreferencesBtn?.addEventListener('click', () => this.guardar());
        ELEMENTS.deleteAccountBtn?.addEventListener('click', () => this.borrarCuenta());
    }
};

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AJUSTES.setup();
        PREFERENCIAS.setup();
    });
} else {
    AJUSTES.setup();
    PREFERENCIAS.setup();
}
