// Verifica que /api/config sigue devolviendo lo mismo tras absorber el
// diagnóstico que antes vivía en /api/health (límite de 12 funciones).
//
// Uso: node tests/config.test.js

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-fake';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-fake';
process.env.STRIPE_PUBLIC_KEY = 'pk_test_fake';

const assert = require('assert');
const handler = require('../api/config');

let passed = 0, failed = 0;

async function test(nombre, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${nombre}`);
    } catch (e) {
        failed++;
        console.error(`  ❌ ${nombre}\n     ${e.message}`);
    }
}

function mockRes() {
    const res = {
        _status: null,
        _body: null,
        _headers: {},
        setHeader(k, v) { this._headers[k] = v; return this; },
        status(c) { this._status = c; return this; },
        json(b) { this._body = b; return this; },
        end() { return this; }
    };
    return res;
}

function mockReq({ method = 'GET', query = {}, headers = {} } = {}) {
    return {
        method,
        query,
        headers,
        socket: { remoteAddress: '198.51.100.' + Math.floor(Math.random() * 250) }
    };
}

(async () => {
    console.log('\n⚙️  /api/config (config pública + diagnóstico)\n');

    await test('GET normal devuelve las claves públicas y nada más', async () => {
        const res = mockRes();
        await handler(mockReq(), res);

        assert.strictEqual(res._status, 200);
        assert.strictEqual(res._body.url, 'https://example.supabase.co');
        assert.strictEqual(res._body.key, 'anon-fake');
        assert.strictEqual(res._body.stripe_public_key, 'pk_test_fake');

        // No debe filtrar la service role key ni datos de diagnóstico.
        assert.ok(!('recentErrors' in res._body), 'no debe incluir errores');
        assert.ok(!JSON.stringify(res._body).includes('service-fake'),
            'NO debe exponer la service role key');
    });

    await test('?ping=1 responde una sonda mínima', async () => {
        const res = mockRes();
        await handler(mockReq({ query: { ping: '1' } }), res);
        assert.strictEqual(res._status, 200);
        assert.deepStrictEqual(res._body, { ok: true });
    });

    await test('?health=1 sin sesión devuelve 403', async () => {
        const res = mockRes();
        await handler(mockReq({ query: { health: '1' } }), res);
        assert.strictEqual(res._status, 403, `esperaba 403, obtuve ${res._status}`);
        assert.ok(!('recentErrors' in res._body), 'no debe filtrar errores a anónimos');
    });

    await test('?health=1 con token inválido devuelve 403', async () => {
        const res = mockRes();
        await handler(
            mockReq({
                query: { health: '1' },
                headers: { authorization: 'Bearer token-invalido' }
            }),
            res
        );
        assert.strictEqual(res._status, 403);
    });

    await test('POST sigue devolviendo 405', async () => {
        const res = mockRes();
        await handler(mockReq({ method: 'POST' }), res);
        assert.strictEqual(res._status, 405);
    });

    await test('el deployment no supera las 12 funciones de Vercel', async () => {
        const { spawnSync } = require('child_process');
        // stdio 'ignore': capturar salida con tuberías no funciona en todos
        // los entornos de ejecución; aquí solo importa el código de salida.
        const r = spawnSync(process.execPath, ['scripts/validate-vercel-limits.js'], {
            stdio: 'ignore'
        });
        assert.strictEqual(r.status, 0,
            `el validador de límites falló (exit ${r.status}); ejecuta "node scripts/validate-vercel-limits.js"`);
    });

    await test('?health=1 con mentor muestra qué variables llegan (solo booleanos)', async () => {
        const Module = require('module');
        const originalLoad = Module._load;

        // Se simula un mentor válido sin tocar Supabase.
        Module._load = function (request, parent) {
            if (request === './_lib/auth' && parent && /api[\\/]config\.js$/.test(parent.filename)) {
                return {
                    getAuthUser: async () => ({ id: 'mentor-1', email: 'fernando@despiertatuvoz.com' }),
                    isMentor: () => true
                };
            }
            return originalLoad.apply(this, arguments);
        };

        let handlerMentor;
        const ruta = require.resolve('../api/config');
        delete require.cache[ruta];
        try {
            handlerMentor = require('../api/config');
        } finally {
            Module._load = originalLoad;
        }

        const anterior = process.env.CALCOM_WEBHOOK_SECRET;
        process.env.CALCOM_WEBHOOK_SECRET = 'secreto-que-no-debe-filtrarse';

        const res = mockRes();
        await handlerMentor(mockReq({ query: { health: '1' } }), res);

        process.env.CALCOM_WEBHOOK_SECRET = anterior;
        delete require.cache[ruta];

        assert.strictEqual(res._status, 200, `status=${res._status}`);
        assert.ok(res._body.config, 'falta el bloque config');

        // Presencia de la variable, en booleanos.
        assert.strictEqual(res._body.config.calcomWebhookSecret, true);
        assert.strictEqual(typeof res._body.config.stripeWebhookSecret, 'boolean');

        // Nunca el valor del secreto.
        const serializado = JSON.stringify(res._body.config);
        assert.ok(!serializado.includes('secreto-que-no-debe-filtrarse'),
            'el diagnóstico está exponiendo el valor del secreto');
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
