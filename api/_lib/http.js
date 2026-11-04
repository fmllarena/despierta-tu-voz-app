// Utilidades HTTP compartidas por las funciones de /api:
// CORS restringido a los dominios de la app, cabeceras de seguridad
// y un rate limit básico en memoria por IP.

const DEFAULT_ORIGINS = [
    'https://app.despiertatuvoz.com',
    'https://www.despiertatuvoz.com',
    'https://despiertatuvoz.com',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

function allowedOrigins() {
    const extra = String(process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    return DEFAULT_ORIGINS.concat(extra);
}

function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (allowedOrigins().includes(origin)) return true;
    // Previews de Vercel del proyecto
    return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

function applyCors(req, res) {
    const origin = req.headers.origin;
    if (isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
}

function handlePreflight(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return true;
    }
    return false;
}

const buckets = new Map();

/**
 * Rate limit en memoria por IP + endpoint.
 * En serverless cada instancia tiene su propio mapa: frena ráfagas,
 * no sustituye a un límite distribuido.
 */
function rateLimit(req, res, { key = 'api', limit = 60, windowMs = 60000 } = {}) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.socket?.remoteAddress || 'unknown';
    const id = `${key}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(id);
    if (!bucket || now >= bucket.reset) {
        bucket = { count: 0, reset: now + windowMs };
        buckets.set(id, bucket);
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));

    if (bucket.count > limit) {
        res.setHeader('Retry-After', String(Math.ceil((bucket.reset - now) / 1000)));
        res.status(429).json({ error: 'Demasiadas peticiones. Espera un momento y vuelve a intentarlo.' });
        return false;
    }

    if (buckets.size > 5000) {
        for (const [k, v] of buckets) {
            if (now >= v.reset) buckets.delete(k);
        }
    }
    return true;
}

module.exports = { applyCors, handlePreflight, rateLimit, isAllowedOrigin };
