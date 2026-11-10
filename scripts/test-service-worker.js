// Verifica la lógica del service worker sin navegador:
//   - instala y precachea el shell,
//   - NUNCA cachea /api/* (datos privados) ni mutaciones,
//   - navegación: network-first con caída a la página offline,
//   - estáticos: sirve de caché al instante,
//   - activación: borra cachés de versiones antiguas.
//
// Uso: node scripts/test-service-worker.js

const fs = require('fs');

const src = fs.readFileSync('service-worker.js', 'utf8');

/* ── Dobles de las APIs del service worker ───────────────────────────────── */
class FakeCache {
    constructor() { this.map = new Map(); }
    async addAll(urls) { urls.forEach(u => this.map.set(u, { url: u, body: 'precache:' + u })); }
    async put(req, res) { this.map.set(typeof req === 'string' ? req : req.url, res); }
    async match(req) {
        const key = typeof req === 'string' ? req : req.url;
        if (this.map.has(key)) return this.map.get(key);
        // match por pathname
        for (const [k, v] of this.map) {
            try { if (new URL(k, 'https://x.test').pathname === key) return v; } catch (_) { }
        }
        return undefined;
    }
}

function makeEnviroment() {
    const caches = new Map();
    const api = {
        async open(nombre) {
            if (!caches.has(nombre)) caches.set(nombre, new FakeCache());
            return caches.get(nombre);
        },
        async keys() { return [...caches.keys()]; },
        async delete(n) { return caches.delete(n); },
        async match(req) {
            for (const c of caches.values()) {
                const hit = await c.match(req);
                if (hit) return hit;
            }
            return undefined;
        }
    };

    const handlers = {};
    const self = {
        location: { origin: 'https://app.despiertatuvoz.com', href: 'https://app.despiertatuvoz.com/' },
        addEventListener: (t, h) => { handlers[t] = h; },
        skipWaiting: async () => { },
        clients: { claim: async () => { } }
    };

    return { caches: api, self, handlers, cacheMap: caches };
}

function makeResponse(body, status = 200, ok = true) {
    return { body, status, ok, type: 'basic', clone() { return makeResponse(body, status, ok); } };
}

function dispatchFetch(handlers, { url, mode = 'no-cors', method = 'GET' }, fetchImpl) {
    let respondida = null;
    const event = {
        request: { url, mode, method },
        respondWith(p) { respondida = p; }
    };
    handlers.fetch(event);
    return { get respondida() { return respondida; }, event };
}

let passed = 0, failed = 0;
function test(nombre, fn) {
    return Promise.resolve().then(fn)
        .then(() => { passed++; console.log(`  ✅ ${nombre}`); })
        .catch(e => { failed++; console.error(`  ❌ ${nombre}\n     ${e.message}`); });
}
function assert(c, m) { if (!c) throw new Error(m); }

async function run(env, fetchImpl = async () => makeResponse('net')) {
    const fn = new Function('self', 'caches', 'fetch', 'Response', 'URL', src);
    fn(env.self, env.caches, fetchImpl, function (body, opts) {
        return makeResponse(body, opts?.status ?? 200, (opts?.status ?? 200) < 400);
    }, URL);
    return env;
}

(async () => {
    console.log('\n⚙️  Service worker\n');

    await test('instala y precachea el shell', async () => {
        const env = makeEnviroment();
        await run(env);
        assert(env.handlers.install, 'no registra install');

        let promesa;
        env.handlers.install({ waitUntil(p) { promesa = p; } });
        await promesa;

        const shell = env.cacheMap.get('dtv-v1.0.0-shell');
        assert(!!shell, 'no crea la caché del shell');
        assert(shell.map.has('/offline.html'), 'no precachea offline.html');
        assert(shell.map.has('/manifest.json'), 'no precachea manifest.json');
    });

    await test('NO intercepta /api/* (datos privados)', async () => {
        const env = makeEnviroment();
        await run(env);
        const r = dispatchFetch(env.handlers, {
            url: 'https://app.despiertatuvoz.com/api/email',
            mode: 'cors'
        });
        assert(r.respondida === null, '/api/ NO debe pasar por el service worker');
    });

    await test('NO intercepta peticiones que no son GET', async () => {
        const env = makeEnviroment();
        await run(env);
        const r = dispatchFetch(env.handlers, {
            url: 'https://app.despiertatuvoz.com/index.html',
            mode: 'navigate',
            method: 'POST'
        });
        assert(r.respondida === null, 'POST no debe cachearse');
    });

    await test('NO intercepta Supabase ni CDNs de terceros', async () => {
        const env = makeEnviroment();
        await run(env);
        const sb = dispatchFetch(env.handlers, {
            url: 'https://xyz.supabase.co/rest/v1/mensajes',
            mode: 'cors'
        });
        assert(sb.respondida === null, 'Supabase no debe cachearse');

        const cdn = dispatchFetch(env.handlers, {
            url: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
            mode: 'no-cors'
        });
        assert(cdn.respondida === null, 'CDN no debe cachearse');
    });

    await test('estáticos del mismo origen se sirven desde caché', async () => {
        const env = makeEnviroment();
        let fetchLlamado = false;
        await run(env, async (req) => {
            fetchLlamado = true;
            return makeResponse('remoto');
        });

        // Primera petición: va a red.
        const r1 = dispatchFetch(env.handlers, {
            url: 'https://app.despiertatuvoz.com/css/style.css',
            mode: 'no-cors'
        });
        assert(r1.respondida, 'debería gestionar la petición');
        await r1.respondida;
        assert(fetchLlamado, 'la primera vez debe ir a red');

        // Segunda: ya está en caché.
        const r2 = dispatchFetch(env.handlers, {
            url: 'https://app.despiertatuvoz.com/css/style.css',
            mode: 'no-cors'
        });
        const res = await r2.respondida;
        assert(res && res.body === 'remoto', 'debería servir la versión cacheada');
    });

    await test('navegación sin red cae en la página offline', async () => {
        const env = makeEnviroment();

        // Primero instalamos para que exista offline.html en caché.
        await run(env);
        let p;
        env.handlers.install({ waitUntil(x) { p = x; } });
        await p;

        // Ahora falla la red.
        await run(env, async () => { throw new Error('sin red'); });

        const r = dispatchFetch(env.handlers, {
            url: 'https://app.despiertatuvoz.com/index.html',
            mode: 'navigate'
        });
        const res = await r.respondida;

        assert(res, 'debe responder algo');
        const cuerpo = typeof res === 'string' ? res : res.body || '';
        assert(String(cuerpo).includes('offline') || String(cuerpo).includes('precache:/offline.html'),
            `no sirvió la página offline (recibido: ${String(cuerpo).slice(0, 80)})`);
    });

    await test('activación borra cachés de versiones antiguas', async () => {
        const env = makeEnviroment();
        await run(env);
        await env.caches.open('dtv-v0.9.0-old');
        await env.caches.open('dtv-v1.0.0-shell');

        let p;
        env.handlers.activate({ waitUntil(x) { p = x; } });
        await p;

        const claves = await env.caches.keys();
        assert(!claves.includes('dtv-v0.9.0-old'), 'no borró la caché antigua');
        assert(claves.includes('dtv-v1.0.0-shell'), 'borró la caché actual por error');
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
