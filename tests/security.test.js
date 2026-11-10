// Pruebas de las defensas de seguridad añadidas a /api.
// Ejecutar con:  node api/_lib/__tests__/security.test.js
//
// No hay framework de test en el proyecto, así que se usa el runner de Node.

const assert = require('assert');
const crypto = require('crypto');
const { Readable } = require('stream');

process.env.ALLOW_UNVERIFIED_WEBHOOKS = 'false';

const {
    verifyCalcomSignature,
    verifyHmacSignature,
    readRawBody,
    safeEqual,
    hmacSha256
} = require('../api/_lib/webhook-security');

const { captureError, getRecentErrors, withMonitoring } = require('../api/_lib/monitoring');

let passed = 0;
let failed = 0;

function test(name, fn) {
    return Promise.resolve()
        .then(fn)
        .then(() => {
            passed++;
            console.log(`  ✅ ${name}`);
        })
        .catch(err => {
            failed++;
            console.error(`  ❌ ${name}\n     ${err.message}`);
        });
}

function reqFromBuffer(buf, headers = {}) {
    const stream = Readable.from([buf]);
    stream.headers = headers;
    return stream;
}

(async () => {
    console.log('\n🔐 webhook-security');

    await test('firma Cal.com válida en hex es aceptada', () => {
        const body = Buffer.from(JSON.stringify({ triggerEvent: 'BOOKING_CREATED' }));
        const secret = 'secreto-de-prueba';
        const sig = hmacSha256(body, secret, 'hex');
        const r = verifyCalcomSignature(body, { 'x-cal-signature-256': sig }, secret);
        assert.strictEqual(r.ok, true);
    });

    await test('firma Cal.com válida en base64 es aceptada', () => {
        const body = Buffer.from('{"a":1}');
        const secret = 's3cr3t';
        const sig = hmacSha256(body, secret, 'base64');
        const r = verifyCalcomSignature(body, { 'x-cal-signature-256': sig }, secret);
        assert.strictEqual(r.ok, true);
    });

    await test('cuerpo manipulado invalida la firma', () => {
        const secret = 'secreto';
        const original = Buffer.from('{"amount":10}');
        const sig = hmacSha256(original, secret, 'hex');
        const tampered = Buffer.from('{"amount":9999}');
        const r = verifyCalcomSignature(tampered, { 'x-cal-signature-256': sig }, secret);
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.reason, 'invalid_signature');
    });

    await test('firma ausente es rechazada', () => {
        const r = verifyCalcomSignature(Buffer.from('{}'), {}, 'secreto');
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.reason, 'missing_signature');
    });

    await test('secreto ausente en producción es rechazado (no fail-open)', () => {
        const prev = process.env.VERCEL_ENV;
        process.env.VERCEL_ENV = 'production';
        const r = verifyCalcomSignature(Buffer.from('{}'), { 'x-cal-signature-256': 'x' }, undefined);
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.reason, 'missing_secret');
        process.env.VERCEL_ENV = prev;
    });

    await test('secreto ausente en local solo se salta con la flag explícita', () => {
        const prevEnv = process.env.VERCEL_ENV;
        process.env.VERCEL_ENV = 'development';
        const r1 = verifyCalcomSignature(Buffer.from('{}'), {}, undefined);
        assert.strictEqual(r1.ok, false, 'sin flag debe rechazar');

        process.env.ALLOW_UNVERIFIED_WEBHOOKS = 'true';
        const r2 = verifyCalcomSignature(Buffer.from('{}'), {}, undefined);
        assert.strictEqual(r2.ok, true);
        assert.strictEqual(r2.skipped, true);
        process.env.ALLOW_UNVERIFIED_WEBHOOKS = 'false';
        process.env.VERCEL_ENV = prevEnv;
    });

    await test('prefijo "sha256=" en la cabecera es tolerado', () => {
        const body = Buffer.from('{"b":2}');
        const secret = 'kk';
        const sig = 'sha256=' + hmacSha256(body, secret, 'hex');
        const r = verifyCalcomSignature(body, { 'x-cal-signature-256': sig }, secret);
        assert.strictEqual(r.ok, true);
    });

    await test('Cal.com sin secreto ("no-secret-provided") se detecta aparte', () => {
        const body = Buffer.from('{"a":1}');
        const r = verifyCalcomSignature(
            body,
            { 'x-cal-signature-256': 'no-secret-provided' },
            'un-secreto-cualquiera'
        );
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.reason, 'calcom_without_secret');
    });

    await test('un secreto con espacios o salto de línea final sigue validando', () => {
        const body = Buffer.from('{"c":3}');
        const secret = 'miSecreto123';
        const sig = hmacSha256(body, secret, 'hex');

        // Al pegarlo en Vercel es habitual arrastrar espacios/salto de línea.
        const r = verifyCalcomSignature(
            body,
            { 'x-cal-signature-256': sig },
            `  ${secret}\n`
        );
        assert.strictEqual(r.ok, true, 'el secreto debería recortarse antes de comparar');
    });

    await test('safeEqual compara longitudes distintas sin lanzar', () => {
        assert.strictEqual(safeEqual('abc', 'abcd'), false);
        assert.strictEqual(safeEqual('abc', 'abc'), true);
    });

    await test('readRawBody preserva los bytes exactos', async () => {
        const body = Buffer.from('{"emoji":"🎙️"}');
        const raw = await readRawBody(reqFromBuffer(body));
        assert.ok(Buffer.isBuffer(raw));
        assert.strictEqual(raw.toString('utf8'), body.toString('utf8'));
    });

    await test('verifyHmacSignature con encoding base64', () => {
        const body = Buffer.from('payload');
        const sig = crypto.createHmac('sha256', 'zz').update(body).digest('base64');
        const r = verifyHmacSignature(body, { 'x-signature': sig }, {
            secret: 'zz',
            header: 'x-signature',
            encoding: 'base64'
        });
        assert.strictEqual(r.ok, true);
    });

    console.log('\n📊 monitoring');

    await test('captureError registra el evento en el buffer', () => {
        const before = getRecentErrors().length;
        captureError(new Error('fallo de prueba'), {
            endpoint: '/api/test',
            method: 'POST',
            userId: 'user-1'
        });
        const errors = getRecentErrors();
        assert.strictEqual(errors.length, before + 1);
        const last = errors[errors.length - 1];
        assert.strictEqual(last.endpoint, '/api/test');
        assert.strictEqual(last.value, 'fallo de prueba');
        assert.strictEqual(last.userId, 'user-1');
    });

    await test('captureError no lanza con entradas raras', () => {
        captureError(null);
        captureError(undefined);
        captureError('solo un string');
        captureError({ weird: true });
        assert.ok(getRecentErrors().length > 0);
    });

    await test('withMonitoring captura excepciones y responde 500', async () => {
        const boom = async () => { throw new Error('explotó'); };
        const wrapped = withMonitoring('/api/boom', boom);

        let statusCode = null;
        let payload = null;
        const res = {
            headersSent: false,
            status(code) { statusCode = code; return this; },
            json(body) { payload = body; return this; },
            end() {}
        };

        await wrapped({ method: 'GET', headers: {}, query: {} }, res);
        assert.strictEqual(statusCode, 500);
        assert.deepStrictEqual(payload, { error: 'Error interno del servidor' });
        assert.ok(
            getRecentErrors().some(e => e.endpoint === '/api/boom'),
            'el error debe quedar registrado'
        );
    });

    await test('withMonitoring no interfiere cuando el handler va bien', async () => {
        const ok = async (req, res) => res.status(200).json({ fine: true });
        const wrapped = withMonitoring('/api/ok', ok);
        let statusCode = null;
        let payload = null;
        const res = {
            headersSent: false,
            status(code) { statusCode = code; return this; },
            json(body) { payload = body; return this; },
            end() {}
        };
        await wrapped({ method: 'POST', headers: {}, query: {} }, res);
        assert.strictEqual(statusCode, 200);
        assert.deepStrictEqual(payload, { fine: true });
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
