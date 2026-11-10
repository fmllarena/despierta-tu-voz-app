// api/health.js
// GET /api/health → estado del servicio y últimos errores monitorizados.
//
// Requiere autenticación de mentor: expone información interna
// (endpoints con fallo, ids de usuario) que no debe ser pública.
// Para sondas de disponibilidad sin credenciales existe `?ping=1`,
// que solo devuelve { ok: true } sin filtrar nada.

const { applyCors, handlePreflight, rateLimit } = require('./_lib/http');
const { getAuthUser, isMentor } = require('./_lib/auth');
const { getRecentErrors, monitoringEnabled } = require('./_lib/monitoring');

module.exports = async function handler(req, res) {
    applyCors(req, res);
    if (handlePreflight(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }
    if (!rateLimit(req, res, { key: 'health', limit: 30, windowMs: 60000 })) return;

    // Sonda mínima, sin datos sensibles.
    if (req.query?.ping === '1') {
        return res.status(200).json({ ok: true });
    }

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
};
