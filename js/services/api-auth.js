// Adjunta automáticamente el access_token de Supabase a las llamadas /api/*
// para que el servidor pueda verificar quién hace la petición.
// Se carga como script clásico, antes que el resto de la app.
(function () {
    if (window.__dtvApiAuthInstalled) return;
    window.__dtvApiAuthInstalled = true;

    const originalFetch = window.fetch.bind(window);

    function getClient() {
        return window.state?.supabase || window.__supabase || window.sb || null;
    }

    function isProtectedApi(url) {
        return /\/api\//.test(url) &&
            !/\/api\/(config|webhook|calcom-webhook)(\?|$)/.test(url);
    }

    window.fetch = async function (input, init = {}) {
        let url = '';
        try {
            url = typeof input === 'string' ? input : (input && input.url) || '';
        } catch (_) {
            url = '';
        }

        if (!url || !isProtectedApi(url)) {
            return originalFetch(input, init);
        }

        try {
            const client = getClient();
            if (client) {
                const { data } = await client.auth.getSession();
                const token = data?.session?.access_token;
                if (token) {
                    const baseHeaders = init.headers ||
                        (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined);
                    const headers = new Headers(baseHeaders || {});
                    if (!headers.has('Authorization')) {
                        headers.set('Authorization', `Bearer ${token}`);
                    }
                    init = { ...init, headers };
                }
            }
        } catch (e) {
            console.warn('[api-auth] No se pudo adjuntar la sesión:', e?.message || e);
        }

        return originalFetch(input, init);
    };
})();
