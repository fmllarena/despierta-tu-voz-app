import { ELEMENTS } from './elements.js';
import { userProfile, supabaseClient } from './config.js';

export const EMAIL = window.EMAIL_VERIFICATION = {
    banner: null,
    resendBtn: null,
    closeBtn: null,

    init() {
        this.banner = document.getElementById('emailVerificationBanner');
        this.resendBtn = document.getElementById('resendVerificationBtn');
        this.closeBtn = document.getElementById('closeVerificationBanner');

        // Listeners
        this.resendBtn?.addEventListener('click', () => this.resendEmail());
        this.closeBtn?.addEventListener('click', () => this.closeBanner());

        // Verificar parámetros de URL (resultado de verificación)
        this.checkVerificationStatus();
    },

    async show(profile) {
        // Solo mostrar para usuarios FREE no verificados
        if (!profile) return;

        const isFree = profile.subscription_tier === 'free';
        const isVerified = !!profile.email_confirmado_at;
        const bannerDismissed = sessionStorage.getItem('email_banner_dismissed');

        this.banner = document.getElementById('emailVerificationBanner');
        if (isFree && !isVerified && !bannerDismissed && this.banner) {
            this.banner.style.display = 'block';
        }
    },

    closeBanner() {
        if (this.banner) {
            this.banner.style.display = 'none';
            sessionStorage.setItem('email_banner_dismissed', 'true');
        }
    },

    async resendEmail() {
        const profile = window.userProfile || userProfile;
        if (!profile) return;

        this.resendBtn.disabled = true;
        this.resendBtn.innerText = 'Enviando...';

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            const response = await fetch('/api/send-verification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    nombre: profile.nombre || user.email.split('@')[0]
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.resendBtn.innerText = '✓ Enviado';
                setTimeout(() => {
                    this.resendBtn.innerText = 'Reenviar email';
                    this.resendBtn.disabled = false;
                }, 3000);
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error reenviando email:', error);
            this.resendBtn.innerText = 'Error. Intenta de nuevo';
            setTimeout(() => {
                this.resendBtn.innerText = 'Reenviar email';
                this.resendBtn.disabled = false;
            }, 3000);
        }
    },

    checkVerificationStatus() {
        const params = new URLSearchParams(window.location.search);
        const verification = params.get('verification');

        if (verification) {
            let message = '';
            switch (verification) {
                case 'success':
                    message = '✅ ¡Email verificado con éxito! Ya tienes acceso completo.';
                    this.closeBanner();
                    break;
                case 'already_verified':
                    message = 'Tu email ya estaba verificado.';
                    this.closeBanner();
                    break;
                case 'expired':
                    message = '⚠️ El link de verificación ha expirado. Solicita uno nuevo.';
                    break;
                case 'invalid_token':
                    message = '❌ Link de verificación inválido.';
                    break;
                case 'error':
                    message = '❌ Error al verificar el email. Inténtalo de nuevo.';
                    break;
            }

            if (message && window.appendMessage) {
                setTimeout(() => {
                    window.appendMessage(message, 'ia');
                }, 1000);

                // Limpiar parámetro de URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
};

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EMAIL.init());
} else {
    EMAIL.init();
}
