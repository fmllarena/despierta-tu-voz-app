/* ============================================================================
   Despierta tu Voz — Service Worker
   ----------------------------------------------------------------------------
   Estrategias:
   - Navegación (documentos): network-first con caída a caché y, si tampoco
     hay, a /offline.html. Así la app abre aunque no haya red.
   - Estáticos (css/js/img/fuentes): stale-while-revalidate, que sirve rápido
     y actualiza en segundo plano.
   - /api/*: SIEMPRE red. Nunca se cachea (datos privados y mutaciones).
   - Supabase / Google APIs: se dejan pasar sin tocar.
   ========================================================================== */

const VERSION = 'dtv-v1.0.0';
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
    '/offline.html',
    '/manifest.json',
    '/logo-appDTV2.png',
    '/favicon.ico',
    '/assets/arriba.png',
    '/assets/abajo.png'
];

// Nunca cachear: peticiones autenticadas, mutaciones y APIs externas.
function shouldBypass(url, request) {
    if (request.method !== 'GET') return true;
    if (url.pathname.startsWith('/api/')) return true;
    if (/supabase\.(co|in)$/.test(url.hostname)) return true;
    if (/googleapis\.com|gstatic\.com|stripe\.com|cal\.com|jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.hostname)) {
        return true;
    }
    return false;
}

/* ── Instalación ─────────────────────────────────────────────────────────── */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then(cache => cache.addAll(PRECACHE).catch(err => {
                // Un recurso opcional que falte no debe impedir la instalación.
                console.warn('[SW] Precaché parcial:', err?.message || err);
            }))
            .then(() => self.skipWaiting())
    );
});

/* ── Activación ──────────────────────────────────────────────────────────── */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(k => !k.startsWith(VERSION))
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

/* ── Fetch ───────────────────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
    const { request } = event;
    let url;
    try {
        url = new URL(request.url);
    } catch (_) {
        return;
    }

    // Solo http(s) y mismo origen o CDNs de la allowlist.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (shouldBypass(url, request)) return;

    // Documentos → network-first.
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstDocument(request));
        return;
    }

    // Estáticos del mismo origen → stale-while-revalidate.
    if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(request));
    }
});

async function networkFirstDocument(request) {
    const cache = await caches.open(SHELL_CACHE);
    try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
            cache.put(request, fresh.clone());
        }
        return fresh;
    } catch (_) {
        const cached = await cache.match(request);
        if (cached) return cached;
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        return new Response(
            '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>' +
            '<p style="font-family:system-ui;padding:24px">Sin conexión. Vuelve a intentarlo cuando recuperes la red.</p>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);

    const network = fetch(request)
        .then(response => {
            // Solo cacheamos respuestas válidas y no opacas.
            if (response && response.ok && response.type === 'basic') {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cached || (await network) || new Response('', { status: 504 });
}

/* ── Mensajes desde la página ────────────────────────────────────────────── */
self.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (data.type === 'CLEAR_CACHES') {
        event.waitUntil(
            caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
        );
    }
});
