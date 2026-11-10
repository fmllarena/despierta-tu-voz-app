// api/config.js
// GET /api/config              → claves públicas (Supabase anon + Stripe)
// GET /api/config?health=1     → estado y errores recientes (solo mentor)
// GET /api/config?ping=1       → sonda mínima para uptime checks
//
// NOTA: el diagnóstico vivía en api/health.js, pero el plan Hobby de Vercel
// limita a 12 Serverless Functions por deployment y el proyecto ya estaba en
// 12. Se ha integrado aquí para no añadir una función número 13.

const { rateLimit } = require('./_lib/http');
const { getAuthUser, isMentor } = require('./_lib/auth');
const { getRecentErrors, monitoringEnabled } = require('./_lib/monitoring');

module.exports = async function handler(req, res) {
    // Solo permitimos GET para esta configuración
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // ── Sonda mínima (sin datos sensibles) ─────────────────────────────────
    if (req.query?.ping === '1') {
        return res.status(200).json({ ok: true });
    }

    // ── Diagnóstico: requiere ser mentor ───────────────────────────────────
    if (req.query?.health === '1' || req.query?.health === 'true') {
        if (!rateLimit(req, res, { key: 'health', limit: 30, windowMs: 60000 })) return;

        const user = await getAuthUser(req);
        if (!isMentor(user)) {
            return res.status(403).json({ error: 'Solo el mentor puede consultar el estado' });
        }

        const errors = getRecentErrors();

        return res.status(200).json({
            ok: true,
            timestamp: new Date().toISOString(),
            environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
            release: process.env.VERCEL_GIT_COMMIT_SHA || null,
            monitoring: {
                // Si es false, los errores solo van a consola y al buffer local.
                sentryConfigured: monitoringEnabled,
                bufferedErrors: errors.length
            },
            recentErrors: errors.slice(-20).reverse()
        });
    }

    // ── Configuración pública de la app ────────────────────────────────────
    // Devolvemos las llaves de Supabase (que son públicas/anon autorizadas)
    // Las guardamos en Vercel para que no estén en el código
    return res.status(200).json({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY,
        stripe_public_key: process.env.STRIPE_PUBLIC_KEY
    });
};
