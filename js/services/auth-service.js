import { state, updateState } from '../modules/state.js';
import { ELEMENTS } from '../modules/elements.js';

export const authActions = {
    async login() {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        if (!email || !password) {
            ELEMENTS.authError.style.color = "red";
            return ELEMENTS.authError.innerText = "Completa los campos.";
        }

        const loginBtn = document.getElementById('loginBtn');
        const signUpBtn = document.getElementById('signUpBtn');
        loginBtn.disabled = true;
        signUpBtn.disabled = true;
        loginBtn.innerText = "Entrando...";
        ELEMENTS.authError.innerText = "";

        try {
            const { error } = await state.supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error) {
            console.error("Error en login:", error);
            ELEMENTS.authError.style.color = "red";
            ELEMENTS.authError.innerText = "Error: " + error.message;
        } finally {
            loginBtn.disabled = false;
            signUpBtn.disabled = false;
            loginBtn.innerText = "Entrar";
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

                // Disparar email de bienvenida
                fetch('/api/send-verification-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: data.user.id,
                        email: email,
                        nombre: nombre
                    })
                }).catch(err => console.error("Error disparando bienvenida:", err));

                ELEMENTS.authError.style.color = "#2ecc71";
                ELEMENTS.authError.innerText = "¡Registro exitoso! Ya puedes iniciar sesión. Revisa tu bandeja de entrada para confirmar tu cuenta.";
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

    async logout() {
        await state.supabase.auth.signOut();
        location.reload();
    }
};

window.authActions = authActions; // Exponer para botones en HTML
