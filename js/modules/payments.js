import { ELEMENTS } from './elements.js';

/**
 * Módulo de Pagos In-App (Stripe Elements)
 * Gestiona la creación de intents y el procesamiento de pagos sin redirecciones externas.
 */
export const PAYMENTS = window.PAYMENTS = {
    stripe: null,
    elements: null,
    clientSecret: null,

    /**
     * Comprueba si venimos de un proceso de pago exitoso (Stripe Redirect o In-App)
     */
    checkStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        const plan = urlParams.get('plan');

        if (paymentStatus === 'success') {
            console.log("✅ Pago detectado como EXITOSO en URL");
            if (window.showCustomAlert) {
                window.showCustomAlert("¡Pago realizado con éxito!", "Tu suscripción o sesión extra ha sido activada correctamente.");
            }

            // Si era una sesión extra, abrir el calendario directamente
            if (plan?.includes('extra')) {
                const duracion = plan.includes('30') ? 'normal30' : 'normal60';
                setTimeout(() => {
                    if (window.SESIONES) window.SESIONES.reservar(duracion);
                }, 1000);
            }

            // Limpiar la URL sin recargar
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (paymentStatus === 'cancel') {
            if (window.showCustomAlert) {
                window.showCustomAlert("Pago cancelado", "No se ha realizado ningún cargo.");
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },

    async init() {
        try {
            const response = await fetch('/api/config');
            const { stripe_public_key } = await response.json();

            if (!stripe_public_key) {
                console.error("❌ STRIPE_PUBLIC_KEY no encontrada en la configuración.");
                return;
            }

            this.stripe = window.Stripe(stripe_public_key);
            console.log("✅ Stripe inicializado con éxito.");
        } catch (e) {
            console.error("Error inicializando Stripe:", e);
        }

        // Listeners básicos
        ELEMENTS.closePayment?.addEventListener('click', () => {
            ELEMENTS.paymentModal.style.display = 'none';
        });

        ELEMENTS.paymentForm?.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    /**
     * Inicia el flujo de pago In-App para un plan o sesión extra
     */
    async iniciarPagoInApp(planKey) {
        console.log("💰 Iniciando flujo In-App para:", planKey);

        if (!this.stripe) {
            this.showMessage("Stripe no ha sido inicializado correctamente. Verifica la configuración.");
            return;
        }

        this.setLoading(true);
        ELEMENTS.paymentModal.style.display = 'block';
        ELEMENTS.paymentMessage.classList.add('hidden');

        try {
            // 1. Crear el Payment Intent en el servidor
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planType: planKey,
                    userId: window.userProfile.user_id,
                    userEmail: window.userProfile.email
                })
            });

            const { clientSecret, error } = await response.json();
            if (error) throw new Error(error);

            this.clientSecret = clientSecret;

            // 2. Configurar Stripe Elements
            const appearance = {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#3a506b',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                },
            };

            this.elements = this.stripe.elements({ appearance, clientSecret });

            const paymentElementOptions = {
                layout: "tabs",
            };

            const paymentElement = this.elements.create("payment", paymentElementOptions);
            paymentElement.mount("#payment-element");

            this.setLoading(false);

        } catch (e) {
            console.error("Error al preparar el pago:", e);
            this.showMessage(e.message || "No se pudo conectar con la pasarela de pago.");
            this.setLoading(false);
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        this.setLoading(true);

        const { error } = await this.stripe.confirmPayment({
            elements: this.elements,
            confirmParams: {
                // Redirigir de vuelta a la app con éxito
                return_url: `${window.location.origin}/index.html?payment=success`,
            },
            // IMPORTANTE: Si queremos que NO haya redirección (solo para algunos métodos como tarjeta)
            // se puede usar redirect: 'if_required'
            redirect: 'if_required'
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                this.showMessage(error.message);
            } else {
                this.showMessage("Ocurrió un error inesperado.");
            }
        } else {
            // El pago se procesó SIN redirección (pago instantáneo)
            console.log("✅ Pago completado con éxito!");
            this.handlePaymentSuccess();
        }

        this.setLoading(false);
    },

    handlePaymentSuccess() {
        ELEMENTS.paymentModal.style.display = 'none';

        // Disparar automáticamente el modal de Cal.com si era una sesión extra
        // o mostrar mensaje de éxito general
        const profile = window.userProfile;

        // Pequeña notificación visual
        if (window.showCustomAlert) {
            window.showCustomAlert("¡Pago realizado!", "Tu sesión ha sido confirmada. Ahora puedes elegir el horario en el calendario.");
        }

        // Si el plan era una sesión extra, abrir el calendario
        if (window.pendingPlan?.includes('extra')) {
            const duracion = window.pendingPlan.includes('30') ? 'normal30' : 'normal60';
            setTimeout(() => {
                if (window.SESIONES) window.SESIONES.reservar(duracion);
            }, 500);
        }
    },

    setLoading(isLoading) {
        if (isLoading) {
            ELEMENTS.submitPayment.disabled = true;
            ELEMENTS.paymentSpinner.classList.remove('hidden');
            ELEMENTS.buttonText.classList.add('hidden');
        } else {
            ELEMENTS.submitPayment.disabled = false;
            ELEMENTS.paymentSpinner.classList.add('hidden');
            ELEMENTS.buttonText.classList.remove('hidden');
        }
    },

    showMessage(messageText) {
        ELEMENTS.paymentMessage.classList.remove('hidden');
        ELEMENTS.paymentMessage.textContent = messageText;
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PAYMENTS.init());
} else {
    PAYMENTS.init();
}
