// Autenticación de las funciones de /api.
// Verifica el JWT de Supabase que envía el cliente y resuelve el rol
// de mentor sin confiar en comprobaciones hechas en el navegador.

const { createClient } = require('@supabase/supabase-js');

let authClient = null;
const userCache = new Map();

function getAuthClient() {
    if (authClient) return authClient;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.error('⛔ [Auth] Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
        return null;
    }
    authClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    return authClient;
}

function getBearerToken(req) {
    const header = req.headers.authorization || req.headers.Authorization || '';
    if (!String(header).startsWith('Bearer ')) return null;
    return String(header).slice(7).trim() || null;
}

/**
 * Devuelve el usuario autenticado o null.
 * Cachea el resultado 60 s para no llamar a Supabase Auth en cada petición.
 */
async function getAuthUser(req) {
    const token = getBearerToken(req);
    if (!token) return null;

    const cached = userCache.get(token);
    if (cached && cached.expiresAt > Date.now()) return cached.user;

    const client = getAuthClient();
    if (!client) return null;

    try {
        // La verificación no puede consumir el presupuesto de 60 s de Vercel:
        // si Supabase Auth no responde en 5 s, se rechaza la petición.
        let timer;
        const timeout = new Promise(resolve => {
            timer = setTimeout(() => resolve({ timedOut: true }), 5000);
        });
        const authPromise = client.auth.getUser(token)
            .then(({ data, error }) => ({ data, error }))
            .catch(error => ({ error }));

        let result;
        try {
            result = await Promise.race([authPromise, timeout]);
        } finally {
            clearTimeout(timer);
        }

        if (result.timedOut) {
            console.warn('⛔ [Auth] Tiempo de espera agotado verificando el token');
            return null;
        }
        if (result.error || !result.data?.user) return null;
        const user = result.data.user;
        userCache.set(token, { user, expiresAt: Date.now() + 60000 });
        if (userCache.size > 500) userCache.clear();
        return user;
    } catch (e) {
        console.error('⛔ [Auth] Error verificando token:', e?.message || e);
        return null;
    }
}

function mentorEmails() {
    return String(process.env.MENTOR_EMAILS || 'fernando@despiertatuvoz.com')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
}

function isMentor(user) {
    if (!user) return false;
    const email = String(user.email || '').toLowerCase();
    if (mentorEmails().includes(email)) return true;
    const role = user.app_metadata?.role || user.user_metadata?.role;
    return role === 'mentor' || role === 'admin';
}

function canAccessUser(user, userId) {
    if (!user) return false;
    if (isMentor(user)) return true;
    if (!userId) return false;
    return String(userId) === String(user.id);
}

async function requireUser(req, res) {
    const user = await getAuthUser(req);
    if (!user) {
        res.status(401).json({ error: 'No autenticado. Inicia sesión de nuevo.' });
        return null;
    }
    return user;
}

async function requireMentor(req, res) {
    const user = await requireUser(req, res);
    if (!user) return null;
    if (!isMentor(user)) {
        res.status(403).json({ error: 'Solo el mentor puede usar esta función.' });
        return null;
    }
    return user;
}

module.exports = { getAuthUser, isMentor, canAccessUser, requireUser, requireMentor };
