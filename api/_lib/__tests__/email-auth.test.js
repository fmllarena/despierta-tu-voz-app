// Pruebas del handler de /api/email: comprueban que el endpoint dejó de ser
// un relay de correo abierto.
// Ejecutar con:  node api/_lib/__tests__/email-auth.test.js

process.env.ALLOW_UNVERIFIED_WEBHOOKS = 'false';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake';
process.env.SUPABASE_ANON_KEY = 'anon-fake';

const assert = require('assert');
const Module = require('module');

// ── Stubs ──────────────────────────────────────────────────────────────────
// Interceptamos @supabase/supabase-js y fetch para no tocar red real.
let authUserResult = { data: { user: null }, error: null };
let adminUserResult = { data: { user: null }, error: null };
let lastBrevoCall = null;

const fakeSupabase = {
    auth: {
        getUser: async () => authUserResult,
        admin: {
            getUserById: async () => adminUserResult
        }
    },
    from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ error: null }) })
    })
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (request === '@supabase/supabase-js') {
        return { createClient: () => fakeSupabase };
    }
    return originalLoad.apply(this, arguments);
};

// fetch: intercepta Brevo y la verificación de Supabase Auth.
global.fetch = async (url, opts) => {
    if (String(url).includes('api.brevo.com')) {
        lastBrevoCall = { url: String(url), body: JSON.parse(opts.body) };
        return { ok: true, status: 200, text: async () => '', json: async () => ({}) };
    }
    return { ok: true, status: 200, text: async () => '', json: async () => ({}) };
};

const emailHandler = require('../../email');

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (err) {
        failed++;
        console.error(`  ❌ ${name}\n     ${err.message}`);
    }
}

/** Doble de `res` que registra lo que el handler responde. */
function mockRes() {
    const res = {
        _status: null,
        _body: null,
        _headers: {},
        _redirect: null,
        headersSent: false,
        setHeader(k, v) { this._headers[k] = v; return this; },
        status(code) { this._status = code; return this; },
        json(body) { this._body = body; return this; },
        send(body) { this._body = body; return this; },
        end() { this.headersSent = true; return this; },
        redirect(url) { this._redirect = url; return this; }
    };
    return res;
}

function mockReq({ method = 'POST', body = {}, headers = {}, query = {} } = {}) {
    return {
        method,
        body: Buffer.from(JSON.stringify(body)),
        headers,
        query,
        socket: { remoteAddress: '203.0.113.' + Math.floor(Math.random() * 250) }
    };
}

(async () => {
    console.log('\n📧 /api/email — control de acceso');

    await test('POST sin sesión y sin email → 401', async () => {
        authUserResult = { data: { user: null }, error: null };
        adminUserResult = { data: { user: null }, error: null };
        lastBrevoCall = null;

        const res = mockRes();
        await emailHandler(mockReq({ body: { userId: 'victima-123', nombre: 'X' } }), res);

        assert.strictEqual(res._status, 401, `esperaba 401, obtuve ${res._status}`);
        assert.strictEqual(lastBrevoCall, null, 'NO debe haberse enviado email');
    });

    await test('POST sin sesión con email de otra cuenta → 401 y sin envío', async () => {
        authUserResult = { data: { user: null }, error: null };
        // La cuenta existe pero su email real es otro distinto del solicitado.
        adminUserResult = {
            data: { user: { id: 'victima-123', email: 'real@ejemplo.com', email_confirmed_at: null } },
            error: null
        };
        lastBrevoCall = null;

        const res = mockRes();
        await emailHandler(
            mockReq({ body: { userId: 'victima-123', email: 'atacante@malo.com', nombre: 'X' } }),
            res
        );

        assert.strictEqual(res._status, 401);
        assert.strictEqual(lastBrevoCall, null, 'no debe enviarse a un email no verificado');
    });

    await test('POST sin sesión pero cuenta no confirmada y email coincidente → permitido', async () => {
        authUserResult = { data: { user: null }, error: null };
        adminUserResult = {
            data: {
                user: { id: 'nuevo-1', email: 'nuevo@ejemplo.com', email_confirmed_at: null }
            },
            error: null
        };
        lastBrevoCall = null;

        const res = mockRes();
        await emailHandler(
            mockReq({ body: { userId: 'nuevo-1', email: 'nuevo@ejemplo.com', nombre: 'Nuevo' } }),
            res
        );

        assert.strictEqual(res._status, 200, `esperaba 200, obtuve ${res._status}`);
        assert.ok(lastBrevoCall, 'debe haberse llamado a Brevo');
        assert.strictEqual(lastBrevoCall.body.to[0].email, 'nuevo@ejemplo.com');
    });

    await test('cuenta ya confirmada en Auth → 401 (no se reenvía sin sesión)', async () => {
        authUserResult = { data: { user: null }, error: null };
        adminUserResult = {
            data: {
                user: { id: 'viejo-1', email: 'viejo@ejemplo.com', email_confirmed_at: '2024-01-01T00:00:00Z' }
            },
            error: null
        };
        lastBrevoCall = null;

        const res = mockRes();
        await emailHandler(
            mockReq({ body: { userId: 'viejo-1', email: 'viejo@ejemplo.com', nombre: 'V' } }),
            res
        );

        assert.strictEqual(res._status, 401);
        assert.strictEqual(lastBrevoCall, null);
    });

    await test('con sesión: el destinatario sale del token, no del body', async () => {
        authUserResult = {
            data: { user: { id: 'u-1', email: 'yo@ejemplo.com' } },
            error: null
        };
        lastBrevoCall = null;

        const res = mockRes();
        await emailHandler(
            mockReq({
                body: { userId: 'u-1', email: 'otro@malo.com', nombre: 'Yo' },
                headers: { authorization: 'Bearer token-valido' }
            }),
            res
        );

        assert.ok(lastBrevoCall, 'debe llamarse a Brevo');
        assert.strictEqual(
            lastBrevoCall.body.to[0].email,
            'yo@ejemplo.com',
            'el email del body debe ignorarse por completo'
        );
    });

    await test('con sesión de otro usuario → 403 y sin envío', async () => {
        authUserResult = {
            data: { user: { id: 'atacante', email: 'atacante@ejemplo.com' } },
            error: null
        };
        lastBrevoCall = null;

        const res = mockRes();
        await emailHandler(
            mockReq({
                body: { userId: 'victima-999', nombre: 'X' },
                headers: { authorization: 'Bearer token-valido' }
            }),
            res
        );

        assert.strictEqual(res._status, 403, `esperaba 403, obtuve ${res._status}`);
        assert.strictEqual(lastBrevoCall, null);
    });

    await test('GET sin token redirige sin consultar la base de datos', async () => {
        const res = mockRes();
        await emailHandler(
            mockReq({ method: 'GET', query: {}, headers: {} }),
            res
        );
        assert.ok(
            String(res._redirect).includes('missing_params'),
            `esperaba redirección a missing_params, obtuve ${res._redirect}`
        );
    });

    await test('método PUT → 405', async () => {
        const res = mockRes();
        await emailHandler(mockReq({ method: 'PUT', headers: {} }), res);
        assert.strictEqual(res._status, 405);
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
