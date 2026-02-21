import { ELEMENTS } from './elements.js';
import { supabaseClient, userProfile } from './config.js';

export const LEGAL = window.LEGAL = {
    pendingPlan: null,

    abrirModal(planType) {
        this.pendingPlan = planType;
        if (ELEMENTS.legalModal) ELEMENTS.legalModal.style.display = 'flex';

        // Mostrar caja de promo solo si hay un código activo en la sesión
        if (ELEMENTS.promoTermsBox) {
            const activePromo = sessionStorage.getItem('dtv_promo_code');
            ELEMENTS.promoTermsBox.style.display = (activePromo === 'PROMO1MES') ? 'block' : 'none';
        }

        // Reset checkboxes
        if (ELEMENTS.checkTerms) ELEMENTS.checkTerms.checked = false;
        if (ELEMENTS.checkMedical) ELEMENTS.checkMedical.checked = false;
        if (ELEMENTS.confirmLegalBtn) ELEMENTS.confirmLegalBtn.disabled = true;
    },

    cerrarModal() {
        if (ELEMENTS.legalModal) ELEMENTS.legalModal.style.display = 'none';
        this.pendingPlan = null;
    },

    validarChecks() {
        const ok = ELEMENTS.checkTerms?.checked && ELEMENTS.checkMedical?.checked;
        if (ELEMENTS.confirmLegalBtn) ELEMENTS.confirmLegalBtn.disabled = !ok;
    },

    async confirmarYContinuar() {
        const btn = ELEMENTS.confirmLegalBtn;
        if (!btn) return;
        btn.disabled = true;
        btn.innerText = "Registrando...";

        try {
            const client = supabaseClient || window.supabaseClient;
            if (!client) throw new Error("Supabase client not initialized.");

            const { data: { user } } = await client.auth.getUser();
            if (!user) return;

            // Actualizar en base de datos (usando supabaseClient desde config.js o window)
            const { error } = await client
                .from('user_profiles')
                .update({ accepted_terms: true })
                .eq('user_id', user.id);

            if (error) throw error;

            // Actualizar perfil local
            if (userProfile) userProfile.accepted_terms = true;

            // Cerrar modal
            this.cerrarModal();

            // Continuar con el pago que quedó pendiente
            if (this.pendingPlan && window.ejecutarPagoPostLegal) {
                window.ejecutarPagoPostLegal(this.pendingPlan);
            }

        } catch (e) {
            console.error("Error al aceptar términos:", e);
            alert("Hubo un error al registrar tu aceptación. Inténtalo de nuevo.");
            btn.disabled = false;
            btn.innerText = "Confirmar y Continuar";
        }
    },

    // Getter para que stripe-checkout.js vea el estado actual
    getAcceptedTermsStatus() {
        return userProfile?.accepted_terms || (ELEMENTS.checkTerms?.checked && ELEMENTS.checkMedical?.checked);
    }
};

// Listeners
export function setupLegalListeners() {
    ELEMENTS.checkTerms?.addEventListener('change', () => LEGAL.validarChecks());
    ELEMENTS.checkMedical?.addEventListener('change', () => LEGAL.validarChecks());
    ELEMENTS.cancelLegalBtn?.addEventListener('click', () => LEGAL.cerrarModal());
    ELEMENTS.confirmLegalBtn?.addEventListener('click', () => LEGAL.confirmarYContinuar());
}

// Inicializar si el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLegalListeners);
} else {
    setupLegalListeners();
}

// Exponer a window para compatibilidad legacy
window.mostrarModalLegal = (planType) => LEGAL.abrirModal(planType);
window.getAcceptedTermsStatus = () => LEGAL.getAcceptedTermsStatus();
