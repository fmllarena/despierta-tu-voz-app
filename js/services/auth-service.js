import { state, updateState } from '../modules/state.js';
import { ELEMENTS } from '../modules/elements.js';
import { inicializarSupabase } from './config-service.js';

export const authActions = {
    async login() {
        console.log("🔑 Intentando login...");
        const email = document.getElementById('authEmail')?.value;
        const password = document.getElementById('authPassword')?.value;
        const loginBtn = document.getElementById('loginBtn');
        const signUpBtn = document.getElementById('signUpBtn');

        if (!email || !password) {
            ELEMENTS.authError.style.color = "red";
            return ELEMENTS.authError.innerText = "Completa los campos.";
        }

        if (!state.supabase) {
            console.log("⚠️ Supabase no detectado en state, intentando inicializar...");
            await inicializarSupabase();
        }

        if (!state.supabase) {
            console.error("❌ No se pudo inicializar Supabase.");
            ELEMENTS.authError.innerText = "Error de conexión. Por favor, recarga.";
            return;
        }

        loginBtn.disabled = true;
        signUpBtn.disabled = true;
        loginBtn.innerText = "Entrando...";
        ELEMENTS.authError.innerText = "";

        try {
            const { error } = await state.supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message && (error.message.includes("Email not confirmed") || error.status === 400)) {
                    // Si el error es falta de confirmación, damos un mensaje constructivo
                    ELEMENTS.authError.style.color = "#e67e22";
                    return ELEMENTS.authError.innerText = "Por favor, confirma tu email para entrar. Revisa tu bandeja de entrada o carpeta de Spam.";
                }
                throw error;
            }
            console.log("✅ Supabase respondió sin error.");
        } catch (error) {
            console.error("❌ Error en login:", error);
            ELEMENTS.authError.style.color = "red";
            ELEMENTS.authError.innerText = "Error: " + (error.message || "Credenciales incorrectas o problema de red.");
        } finally {
            console.log("🔄 Reset de botones auth.");
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerText = "Entrar";
            }
            if (signUpBtn) signUpBtn.disabled = false;
        }
    },

    async signUp() {
        const nombre = document.getElementById('authName').value;
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        if (!email || !password || !nombre) {
            ELEMENTS.authError.style.color = "red";
            return ELEMENTS.authError.innerText = "Completa todos los campos.";
        }

        const signUpBtn = document.getElementById('signUpBtn');
        const loginBtn = document.getElementById('loginBtn');
        signUpBtn.disabled = true;
        loginBtn.disabled = true;
        signUpBtn.innerText = "Registrando...";
        ELEMENTS.authError.innerText = "";

        try {
            const { data, error } = await state.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nombre: nombre },
                    emailRedirectTo: window.location.origin + '/index.html'
                }
            });

            if (error) throw error;

            if (data?.user) {
                if (data.user.identities && data.user.identities.length === 0) {
                    throw new Error("Este correo ya está registrado. Por favor, inicia sesión.");
                }

                console.log("✅ Registro exitoso. Disparando bienvenida...");

                // Disparar email de bienvenida/verificación de forma asíncrona
                fetch('/api/send-verification-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: data.user.id,
                        email: email,
                        nombre: nombre
                    })
                }).catch(err => console.error("❌ Error disparando bienvenida:", err));

                ELEMENTS.authError.style.color = "#2ecc71";
                ELEMENTS.authError.innerText = "¡Registro exitoso! Por favor, REVISA TU EMAIL para confirmar tu cuenta antes de entrar.";
            }
        } catch (error) {
            console.error("Error en registro:", error);
            ELEMENTS.authError.style.color = "red";
            ELEMENTS.authError.innerText = "Error: " + error.message;
        } finally {
            signUpBtn.disabled = false;
            loginBtn.disabled = false;
            signUpBtn.innerText = "Registrarme";
        }
    },

    async resetPassword() {
        const email = document.getElementById('authEmail').value;
        if (!email) return ELEMENTS.authError.innerText = "Introduce tu email primero.";

        const { error } = await state.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/index.html'
        });
        if (error) ELEMENTS.authError.innerText = "Error: " + error.message;
        else alert("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    },

    async updatePassword() {
        const newPassword = document.getElementById('newPassword').value;
        if (!newPassword) return alert("Introduce la nueva contraseña.");

        const { error } = await state.supabase.auth.updateUser({ password: newPassword });
        if (error) alert("Error actualizando: " + error.message);
        else {
            alert("Contraseña actualizada con éxito.");
            updateState({ isRecoveringPassword: false });
            location.reload();
        }
    },

    async loginWithOAuth(provider) {
        try {
            if (!state.supabase) await inicializarSupabase();

            // Capurar el plan pendiente de cualquier posible origen (Window global de Stripe o SessionStorage)
            const pendingPlan = window.pendingPlan || window.LEGAL?.pendingPlan || sessionStorage.getItem('pendingPlan');
            if (pendingPlan) {
                console.log("💾 Persistiendo plan pendiente antes de redirect:", pendingPlan);
                sessionStorage.setItem('pendingPlan', pendingPlan);
            }

            const currentPath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
            const { error } = await state.supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin + currentPath
                }
            });

            if (error) throw error;
        } catch (error) {
            console.error(`❌ Error en login con ${provider}:`, error);
            alert(`No se pudo iniciar sesión con ${provider}. Inténtalo con otro método.`);
        }
    },

    async logout() {
        await state.supabase.auth.signOut();
        location.reload();
    }
};

window.authActions = authActions; // Exponer para botones en HTML
