// Monitorización de errores estilo Sentry para las funciones de /api.
//
// Diseño: sin dependencias externas. Si existe SENTRY_DSN se envían los
// eventos a Sentry mediante su API de ingesta (store endpoint); si no,
// los errores se registran estructurados en consola y se guardan en un
// buffer circular en memoria para poder inspeccionarlos vía
// `getRecentErrors()` (por ejemplo desde un health check o un log drain).
//
// Nunca lanza: la monitorización jamás debe tumbar la petición que la usa.

const os = require('os');

const MAX_BUFFER = 50;
const recentErrors = [];

const RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_VERSION || 'dev';
const ENVIRONMENT =
    process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

// ─── Parseo del DSN ────────────────────────────────────────────────────────
// Formato: https://<publicKey>@<host>/<projectId>
function parseDsn(dsn) {
    if (!dsn) return null;
    try {
        const url = new URL(dsn);
        const publicKey = url.username;
        const projectId = url.pathname.replace(/^\//, '');
        if (!publicKey || !projectId) return null;
        const scheme = url.protocol.replace(':', '') || 'https';
        return {
            publicKey,
            projectId,
            host: url.host,
            protocol: scheme,
            storeUrl: `${scheme}://${url.host}/api/${projectId}/store/`
        };
    } catch (_) {
        return null;
    }
}

const parsedDsn = parseDsn(process.env.SENTRY_DSN);
const monitoringEnabled = !!parsedDsn;

// ─── Normalización de errores ──────────────────────────────────────────────
function normalizeError(err) {
    if (!err) return { type: 'Error', value: 'Error desconocido', stack: null };
    if (typeof err === 'string') return { type: 'Error', value: err, stack: null };
    return {
        type: err.name || 'Error',
        value: err.message || String(err),
        stack: err.stack || null,
        code: err.code
    };
}

function scrub(value) {
    if (!value || typeof value !== 'object') return value;
    const SENSITIVE = /token|secret|key|password|authorization|cookie|apikey|api_key/i;
    const out = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value)) {
        if (SENSITIVE.test(k)) {
            out[k] = '[redactado]';
        } else if (v && typeof v === 'object') {
            out[k] = scrub(v);
        } else {
            out[k] = v;
        }
    }
    return out;
}

/**
 * Envía el evento a Sentry. Fire-and-forget: no se espera el resultado
 * para no añadir latencia a la respuesta.
 */
function sendToSentry(event) {
    if (!monitoringEnabled) return;
    const { publicKey, storeUrl } = parsedDsn;

    const authHeader = [
        'Sentry sentry_version=7',
        'sentry_client=dtv-api/1.0',
        `sentry_key=${publicKey}`
    ].join(', ');

    // El timeout evita que un Sentry lento retenga el proceso serverless.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    fetch(storeUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Sentry-Auth': authHeader
        },
        body: JSON.stringify(event),
        signal: controller.signal
    })
        .then(res => {
            if (!res.ok) {
                console.error(`[Monitoring] Sentry respondió ${res.status}`);
            }
        })
        .catch(() => {
            /* Silencioso a propósito: monitorizar no puede romper la petición. */
        })
        .finally(() => clearTimeout(timer));
}

function buildEvent(error, context = {}) {
    const norm = normalizeError(error);
    const {
        endpoint = 'unknown',
        method = 'unknown',
        userId = null,
        level = 'error',
        extra = {},
        tags = {}
    } = context;

    // Stack trace en el formato de "exception" de Sentry.
    const frames = (norm.stack || '')
        .split('\n')
        .slice(1)
        .map(line => {
            const m = line.match(/at\s+(.*?)\s+\(?(.*?):(\d+):(\d+)\)?$/);
            if (!m) return null;
            return {
                function: m[1],
                filename: m[2],
                lineno: Number(m[3]),
                colno: Number(m[4])
            };
        })
        .filter(Boolean)
        .reverse();

    return {
        event_id: require('crypto').randomBytes(16).toString('hex'),
        timestamp: new Date().toISOString(),
        platform: 'node',
        level,
        release: RELEASE,
        environment: ENVIRONMENT,
        logger: 'dtv-api',
        server_name: os.hostname(),
        tags: {
            endpoint,
            method,
            ...tags
        },
        user: userId ? { id: String(userId) } : undefined,
        extra: scrub({ ...extra, ...(norm.code ? { code: norm.code } : {}) }),
        exception: {
            values: [
                {
                    type: norm.type,
                    value: norm.value,
                    stacktrace: frames.length ? { frames } : undefined
                }
            ]
        },
        request: { method, url: endpoint }
    };
}

/**
 * Registra un error con contexto. Nunca lanza.
 *
 * @param {Error|string} error
 * @param {object} context  { endpoint, method, userId, level, extra, tags }
 */
function captureError(error, context = {}) {
    try {
        const event = buildEvent(error, context);

        // Buffer local (útil sin DSN y para depurar en caliente).
        recentErrors.push({
            at: event.timestamp,
            endpoint: event.tags.endpoint,
            method: event.tags.method,
            type: event.exception.values[0].type,
            value: event.exception.values[0].value,
            userId: event.user?.id || null,
            level: event.level
        });
        if (recentErrors.length > MAX_BUFFER) recentErrors.shift();

        console.error(
            `🔴 [Monitoring] ${event.tags.method} ${event.tags.endpoint} → ` +
            `${event.exception.values[0].type}: ${event.exception.values[0].value}`
        );

        sendToSentry(event);
        return event.event_id;
    } catch (e) {
        // Último cortafuegos: si la propia monitorización falla, no propagamos.
        console.error('[Monitoring] Fallo registrando el error:', e?.message || e);
        return null;
    }
}

/**
 * Envuelve un handler de /api para capturar cualquier excepción no
 * controlada y responder 500 de forma uniforme.
 */
function withMonitoring(endpoint, handler) {
    return async function monitored(req, res) {
        try {
            return await handler(req, res);
        } catch (error) {
            const userId = req.authUser?.id || req.user?.id || null;
            captureError(error, {
                endpoint,
                method: req.method,
                userId,
                extra: { query: req.query }
            });

            if (res.headersSent) {
                try { res.end(); } catch (_) { /* ya cerrada */ }
                return;
            }
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
}

/** Devuelve los últimos errores capturados (para health checks). */
function getRecentErrors() {
    return recentErrors.slice();
}

module.exports = {
    captureError,
    withMonitoring,
    getRecentErrors,
    monitoringEnabled
};
