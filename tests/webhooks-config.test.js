// Regresión: las funciones de webhook DEBEN exportar `config.api.bodyParser:false`.
//
// Si se pierde, Vercel parsea el cuerpo antes de llegar al handler, los bytes
// originales desaparecen y la firma HMAC/Stripe nunca puede validar → todos los
// webhooks responderían 401.
//
// Ocurrió al envolver los handlers con withMonitoring(): devolvía una función
// nueva y se dejaba atrás `.config`.
//
// Uso: node tests/webhooks-config.test.js

process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-fake';
process.env.SUPABASE_ANON_KEY = 'anon-fake';
process.env.CALCOM_WEBHOOK_SECRET = 'secreto-de-prueba';

const assert = require('assert');

let passed = 0, failed = 0;
function test(nombre, fn) {
    try { fn(); passed++; console.log(`  ✅ ${nombre}`); }
    catch (e) { failed++; console.error(`  ❌ ${nombre}\n     ${e.message}`); }
}

console.log('\n🔗 Configuración de los webhooks (bodyParser)\n');

const casos = [
    { nombre: 'api/webhook.js (Stripe)', ruta: '../api/webhook' },
    { nombre: 'api/calcom-webhook.js (Cal.com)', ruta: '../api/calcom-webhook' }
];

for (const caso of casos) {
    let modulo;
    let errorCarga = null;
    try {
        modulo = require(caso.ruta);
    } catch (e) {
        errorCarga = e;
    }

    test(`${caso.nombre} se puede cargar`, () => {
        assert.ok(!errorCarga, `falló al cargar: ${errorCarga?.message}`);
        assert.strictEqual(typeof modulo, 'function', 'debe exportar una función');
    });

    test(`${caso.nombre} exporta config.api.bodyParser = false`, () => {
        assert.ok(!errorCarga, `no se pudo cargar: ${errorCarga?.message}`);
        assert.ok(modulo.config, 'la función exportada NO tiene .config (Vercel no desactivará el bodyParser)');
        assert.ok(modulo.config.api, 'falta config.api');
        assert.strictEqual(
            modulo.config.api.bodyParser,
            false,
            'bodyParser debe ser false para conservar los bytes crudos'
        );
    });

    test(`${caso.nombre} conserva el envoltorio de monitorización`, () => {
        assert.ok(!errorCarga, `no se pudo cargar: ${errorCarga?.message}`);
        // El handler envuelto sigue siendo una función normal de (req, res).
        assert.strictEqual(modulo.length, 2, 'debe aceptar (req, res)');
    });
}

/* ── readRawBody: diagnóstico cuando el cuerpo no llega crudo ───────────── */
console.log('\n📦 Lectura del cuerpo crudo\n');

const { readRawBody } = require('../api/_lib/webhook-security');
function reqStream(body, extra = {}) {
    const { Readable } = require('stream');
    const s = Readable.from([Buffer.from(body)]);
    return Object.assign(s, extra);
}

(async () => {
    const esperar = async (nombre, fn) => {
        try { await fn(); passed++; console.log(`  ✅ ${nombre}`); }
        catch (e) { failed++; console.error(`  ❌ ${nombre}\n     ${e.message}`); }
    };

    await esperar('devuelve el Buffer tal cual si el runtime ya lo preparó', async () => {
        const buf = Buffer.from('{"a":1}');
        const raw = await readRawBody({ body: buf });
        assert.ok(Buffer.isBuffer(raw));
        assert.strictEqual(raw.toString(), '{"a":1}');
    });

    await esperar('devuelve el string convertido a Buffer', async () => {
        const raw = await readRawBody({ body: '{"b":2}' });
        assert.strictEqual(raw.toString(), '{"b":2}');
    });

    await esperar('lee el stream cuando no hay body', async () => {
        const raw = await readRawBody(reqStream('{"c":3}', { body: undefined }));
        assert.strictEqual(raw.toString(), '{"c":3}');
    });

    await esperar('cuerpo ya parseado → Buffer vacío (no lanza)', async () => {
        const raw = await readRawBody({ body: { parsed: true } });
        assert.ok(Buffer.isBuffer(raw));
        assert.strictEqual(raw.length, 0, 'debe devolver vacío para que la firma falle con motivo');
    });

    await esperar('stream ya consumido → Buffer vacío (no lanza)', async () => {
        // `readableEnded` es de solo lectura en un Readable real, así que se
        // simula el caso con un objeto que falla si se intenta consumir.
        const req = {
            body: undefined,
            readableEnded: true,
            [Symbol.asyncIterator]() {
                throw new Error('no debería intentar leer un stream ya consumido');
            }
        };
        const raw = await readRawBody(req);
        assert.ok(Buffer.isBuffer(raw));
        assert.strictEqual(raw.length, 0);
    });

    /* ── Diagnóstico del 401 (sin logs) ─────────────────────────────────── */
    console.log('\n🩺 Diagnóstico del 401 de Cal.com\n');

    function mockRes() {
        return {
            _status: null,
            _body: null,
            headersSent: false,
            setHeader() { return this; },
            status(c) { this._status = c; return this; },
            json(b) { this._body = b; return this; },
            send(b) { this._body = b; return this; },
            end() { return this; }
        };
    }

    function mockReq(headers = {}) {
        return {
            method: 'POST',
            headers,
            body: Buffer.from('{"triggerEvent":"BOOKING_CREATED","payload":{}}'),
            query: {},
            socket: { remoteAddress: '203.0.113.9' }
        };
    }

    const calcom = require('../api/calcom-webhook');

    await esperar('sin cabecera de firma → 401 con code "missing_signature"', async () => {
        const res = mockRes();
        await calcom(mockReq(), res);
        assert.strictEqual(res._status, 401, `status=${res._status}`);
        assert.strictEqual(res._body.code, 'missing_signature', `code=${res._body.code}`);
        assert.ok(res._body.hint, 'debería incluir una pista para el operador');
    });

    await esperar('sin secreto en el entorno → 401 con code "missing_secret"', async () => {
        const anterior = process.env.CALCOM_WEBHOOK_SECRET;
        delete process.env.CALCOM_WEBHOOK_SECRET;

        const res = mockRes();
        await calcom(mockReq({ 'x-cal-signature-256': 'deadbeef' }), res);

        process.env.CALCOM_WEBHOOK_SECRET = anterior;

        assert.strictEqual(res._status, 401);
        assert.strictEqual(res._body.code, 'missing_secret', `code=${res._body.code}`);
    });

    await esperar('secreto distinto → 401 con code "invalid_signature"', async () => {
        const res = mockRes();
        await calcom(mockReq({ 'x-cal-signature-256': 'a'.repeat(64) }), res);
        assert.strictEqual(res._status, 401);
        assert.strictEqual(res._body.code, 'invalid_signature', `code=${res._body.code}`);
    });

    await esperar('firma correcta → no devuelve 401', async () => {
        const crypto = require('crypto');
        const body = Buffer.from('{"triggerEvent":"BOOKING_CREATED","payload":{}}');
        const firma = crypto
            .createHmac('sha256', process.env.CALCOM_WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        const req = mockReq({ 'x-cal-signature-256': firma });
        req.body = body;

        const res = mockRes();
        await calcom(req, res);

        // Debe pasar la verificación: cualquier código salvo 401.
        assert.notStrictEqual(res._status, 401, `sigue rechazando: ${JSON.stringify(res._body)}`);
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
