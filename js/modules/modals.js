import { ELEMENTS } from './elements.js';
import { state } from './state.js';
import { alertCustom } from './utils.js';
import { TIER_NAMES } from './config.js';

export const MODALS = {
    links: {
        normal30: "https://cal.com/fernando-martinez-drmyul/30min",
        normal60: "https://cal.com/fernando-martinez-drmyul/sesion-de-1-h"
    },

    setup() {
        // Settings Modal
        ELEMENTS.ajustesBtn?.addEventListener('click', () => this.abrirAjustes());
        ELEMENTS.closeSettings?.addEventListener('click', () => this.cerrarAjustes());
        ELEMENTS.saveSettingsBtn?.addEventListener('click', () => this.guardarAjustes());

        // Sesión Modal
        ELEMENTS.sesionBtn?.addEventListener('click', () => this.abrirSesion());
        ELEMENTS.closeSesion?.addEventListener('click', () => this.cerrarSesion());
        ELEMENTS.book30Btn?.addEventListener('click', () => this.reservarSesion('normal30'));
        ELEMENTS.book60Btn?.addEventListener('click', () => this.reservarSesion('normal60'));
        ELEMENTS.buyExtra30Btn?.addEventListener('click', () => this.comprarExtra('30'));
        ELEMENTS.buyExtra60Btn?.addEventListener('click', () => this.comprarExtra('60'));

        // Upgrade Modal
        ELEMENTS.upgradeBtn?.addEventListener('click', () => this.abrirUpgrade());
        ELEMENTS.closeUpgrade?.addEventListener('click', () => this.cerrarUpgrade());

        // Preferences Modal
        ELEMENTS.savePreferencesBtn?.addEventListener('click', () => this.guardarPreferences());

        // Legal Modal
        const toggleLegal = () => {
            ELEMENTS.confirmLegalBtn.disabled = !(ELEMENTS.checkTerms.checked && ELEMENTS.checkMedical.checked);
        };
        ELEMENTS.checkTerms?.addEventListener('change', toggleLegal);
        ELEMENTS.checkMedical?.addEventListener('change', toggleLegal);
        ELEMENTS.cancelLegalBtn?.addEventListener('click', () => this.cerrarLegal());
        ELEMENTS.confirmLegalBtn?.addEventListener('click', () => {
            this.cerrarLegal();
            authActions.signUp();
        });

        // Global click to close modals
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    },

    // --- AJUSTES ---
    abrirAjustes() {
        if (!state.userProfile) return;
        ELEMENTS.settingsUserName.innerText = state.userProfile.nombre || "Usuario";
        const tier = state.userProfile.subscription_tier || 'free';
        ELEMENTS.settingsUserTier.innerText = `PLAN ${TIER_NAMES[tier] || tier.toUpperCase()}`;

        ELEMENTS.focusSlider.value = state.userProfile.mentor_focus ?? 5;
        ELEMENTS.personalitySlider.value = state.userProfile.mentor_personality ?? 5;
        ELEMENTS.lengthSlider.value = state.userProfile.mentor_length ?? 5;
        ELEMENTS.languageSelect.value = state.userProfile.mentor_language || 'es';
        ELEMENTS.weeklyGoalInput.value = state.userProfile.weekly_goal || '';

        ELEMENTS.settingsModal.style.display = 'flex';
    },
    cerrarAjustes() { ELEMENTS.settingsModal.style.display = 'none'; },
    async guardarAjustes() {
        const btn = ELEMENTS.saveSettingsBtn;
        btn.disabled = true;
        btn.innerText = "Guardando...";
        try {
            const updates = {
                mentor_focus: parseInt(ELEMENTS.focusSlider.value),
                mentor_personality: parseInt(ELEMENTS.personalitySlider.value),
                mentor_length: parseInt(ELEMENTS.lengthSlider.value),
                mentor_language: ELEMENTS.languageSelect.value,
                weekly_goal: ELEMENTS.weeklyGoalInput.value.trim()
            };
            const { error } = await state.supabase.from('user_profiles').update(updates).eq('user_id', state.userProfile.user_id);
            if (error) throw error;
            state.userProfile = { ...state.userProfile, ...updates };
            alertCustom("Ajustes guardados.");
            this.cerrarAjustes();
        } catch (e) {
            alertCustom("Error: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Guardar Cambios";
        }
    },

    // --- SESIONES 1/1 ---
    abrirSesion() {
        ELEMENTS.sesionModal.style.display = 'flex';
        this.actualizarCuotaSesiones();
    },
    cerrarSesion() { ELEMENTS.sesionModal.style.display = 'none'; },

    actualizarCuotaSesiones() {
        const consumed = state.userProfile?.sessions_minutes_consumed || 0;
        const tier = state.userProfile?.subscription_tier || 'free';
        const remaining = (tier === 'premium' || tier === 'transforma') ? Math.max(0, 60 - consumed) : 0;

        if (tier === 'premium' || tier === 'transforma') {
            ELEMENTS.sessionQuotaInfo.innerHTML = `
                <div class="quota-badge">
                    <span class="quota-label">Tu tiempo incluido restante:</span>
                    <span class="quota-value">${remaining} min</span>
                </div>
            `;
            ELEMENTS.book30Btn.disabled = remaining < 30;
            ELEMENTS.book60Btn.disabled = remaining < 60;
        } else {
            ELEMENTS.sessionQuotaInfo.innerHTML = `<p>Tu plan no incluye sesiones individuales mensuales.</p>`;
            ELEMENTS.book30Btn.disabled = true;
            ELEMENTS.book60Btn.disabled = true;
        }
    },

    reservarSesion(tipo) {
        const url = this.links[tipo];
        if (url) {
            const finalUrl = `${url}?email=${encodeURIComponent(state.userProfile.email)}&name=${encodeURIComponent(state.userProfile.nombre || "")}`;
            window.open(finalUrl, '_blank');
        }
    },

    comprarExtra(duracion) {
        const tier = state.userProfile?.subscription_tier || 'free';
        if (tier === 'free') {
            alertCustom("Mejora tu plan para acceder a sesiones extra.");
            this.abrirUpgrade();
            return;
        }
        if (window.iniciarPago) {
            window.iniciarPago(`extra_${duracion}_${tier}`);
        }
    },

    // --- UPGRADE ---
    abrirUpgrade() { ELEMENTS.upgradeModal.style.display = 'flex'; },
    cerrarUpgrade() { ELEMENTS.upgradeModal.style.display = 'none'; },

    // --- PREFERENCIAS ---
    abrirPreferencias() {
        ELEMENTS.marketingToggle.checked = state.userProfile.consent_marketing !== false;
        ELEMENTS.lifecycleToggle.checked = state.userProfile.consent_lifecycle !== false;
        ELEMENTS.preferencesModal.style.display = 'flex';
    },
    async guardarPreferencias() {
        const btn = ELEMENTS.savePreferencesBtn;
        btn.disabled = true;
        try {
            const updates = {
                consent_marketing: ELEMENTS.marketingToggle.checked,
                consent_lifecycle: ELEMENTS.lifecycleToggle.checked
            };
            await state.supabase.from('user_profiles').update(updates).eq('user_id', state.userProfile.user_id);
            state.userProfile = { ...state.userProfile, ...updates };
            alertCustom("Preferencias guardadas.");
            this.cerrarPreferencias();
        } catch (e) {
            alertCustom("Error guardando.");
        } finally {
            btn.disabled = false;
        }
    },

    // --- LEGAL ---
    abrirLegal() {
        ELEMENTS.legalModal.style.display = 'flex';
    },
    cerrarLegal() {
        ELEMENTS.legalModal.style.display = 'none';
    }
};
