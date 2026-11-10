// Verificación de firmas para los webhooks entrantes.
//
// Estrategia por proveedor:
//  - Stripe: usa la librería oficial (constructEvent) → ya validaba firma.
//  - Cal.com: HMAC-SHA256 del cuerpo crudo con cabecera x-cal-signature-256.
//  - Genérico: HMAC-SHA256 en hex o base64 (cabecera configurable).
//
// Regla de seguridad: si hay un secreto configurado, la firma es
// OBLIGATORIA. Solo se permite el modo "sin verificar" cuando no hay
// secreto Y explícitamente se activa ALLOW_UNVERIFIED_WEBHOOKS=true
// (pensado para desarrollo local, nunca para producción).

const crypto = require('crypto');

/**
 * Lee el cuerpo crudo de la petición.
 * Necesario porque la firma se calcula sobre los bytes exactos recibidos:
 * cualquier reserialización del JSON invalidaría el HMAC.
 */
async function readRawBody(req) {
    // 1. Lo ideal: el runtime nos da los bytes tal cual.
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);

    // 2. Aunque el cuerpo venga parseado, se intenta el stream: en algunos
    //    runtimes sigue disponible y así se recuperan los bytes exactos.
    if (!req.readableEnded) {
        try {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            if (chunks.length > 0) {
                const crudo = Buffer.concat(chunks);
                if (crudo.length > 0) return crudo;
            }
        } catch (_) {
            // Stream ya consumido: se continúa al diagnóstico de abajo.
        }
    }

    // 3. Diagnóstico: si ya venía parseado a objeto, los bytes originales se
    //    perdieron (bodyParser activo) y la firma NO se puede verificar.
    //    Sin este aviso el síntoma sería un 401 incomprensible.
    if (req.body && typeof req.body === 'object') {
        console.error(
            '⛔ [Webhook] El cuerpo llegó ya parseado: no se puede verificar la firma. ' +
            'Falta que Vercel desactive el bodyParser para esta función: ' +
            '`module.exports.config = { api: { bodyParser: false } }` (literal).'
        );
        return Buffer.from('');
    }

    // 4. Stream ya consumido por el runtime (mismo problema que el punto 3).
    if (req.readableEnded) {
        console.error(
            '⛔ [Webhook] El stream ya estaba consumido antes de leerlo: ' +
            'la verificación de firma fallará aunque el secreto sea correcto.'
        );
        return Buffer.from('');
    }

    return Buffer.from('');
}

/** Comparación en tiempo constante para evitar timing attacks. */
function safeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/** Calcula HMAC-SHA256 del cuerpo con el secreto dado. */
function hmacSha256(rawBody, secret, encoding = 'hex') {
    return crypto.createHmac('sha256', secret).update(rawBody).digest(encoding);
}

function isProduction() {
    return (process.env.VERCEL_ENV || process.env.NODE_ENV) === 'production';
}

function unverifiedAllowed() {
    return String(process.env.ALLOW_UNVERIFIED_WEBHOOKS || '').toLowerCase() === 'true';
}

/** Extrae la firma de las cabeceras habituales de Cal.com. */
function extractCalSignature(headers = {}) {
    return (
        headers['x-cal-signature-256'] ||
        headers['x-cal-signature'] ||
        headers['X-Cal-Signature-256'] ||
        null
    );
}

/**
 * Verifica un webhook de Cal.com (HMAC-SHA256 hex del cuerpo crudo).
 *
 * @returns {{ok: boolean, reason?: string, skipped?: boolean}}
 */
function verifyCalcomSignature(rawBody, headers, secret) {
    // Se recorta el secreto: al pegarlo en Vercel es habitual arrastrar un
    // salto de línea o espacios, y eso invalida el HMAC sin dar ninguna pista.
    const limpio = secret == null ? '' : String(secret).trim();

    if (!limpio) {
        if (unverifiedAllowed() && !isProduction()) {
            console.warn('⚠️ [Webhook] CALCOM_WEBHOOK_SECRET ausente: firma no verificada (solo desarrollo)');
            return { ok: true, skipped: true };
        }
        console.error('⛔ [Webhook] CALCOM_WEBHOOK_SECRET no configurado: se rechaza el webhook');
        return { ok: false, reason: 'missing_secret' };
    }

    const signature = extractCalSignature(headers);
    if (!signature) return { ok: false, reason: 'missing_signature' };

    const recibida = String(signature).trim();

    // Cal.com envía este literal cuando el webhook no tiene secreto configurado.
    if (recibida.toLowerCase() === 'no-secret-provided') {
        console.error(
            '⛔ [Webhook] Cal.com envía "no-secret-provided": el webhook NO tiene Secret configurado. ' +
            'El valor de CALCOM_WEBHOOK_SECRET en Vercel no se está usando.'
        );
        return { ok: false, reason: 'calcom_without_secret' };
    }

    const expected = hmacSha256(rawBody, limpio, 'hex');

    // Cal.com puede enviar la firma en hex o en base64 según versión.
    const candidates = [expected, hmacSha256(rawBody, limpio, 'base64')];
    const normalized = recibida.replace(/^sha256=/i, '');

    const match = candidates.some(c => safeEqual(c, normalized));

    if (!match) {
        // Diagnóstico seguro: prefijos de 8 caracteres y longitudes no permiten
        // falsificar nada, pero distinguen las dos causas habituales.
        const prefijo = s => String(s).slice(0, 8) + '…';
        console.warn(
            '[Webhook] La firma no coincide. ' +
            `cuerpo=${rawBody.length}B | ` +
            `recibida=${prefijo(recibida)} (${recibida.length} car.) | ` +
            `esperada=${prefijo(expected)} (${expected.length} car.) | ` +
            `secreto=${limpio.length} car.`
        );

        if (rawBody.length === 0) {
            console.error(
                '⛔ [Webhook] El cuerpo llegó VACÍO: la firma se calcula sobre los bytes crudos. ' +
                'Comprueba que el deployment incluye `config.api.bodyParser = false`.'
            );
        } else if (recibida.length !== expected.length) {
            console.error(
                '⛔ [Webhook] La firma recibida no tiene la longitud esperada (64 hex). ' +
                'Puede que Cal.com esté usando otro algoritmo o que el secreto esté desincronizado.'
            );
        } else {
            console.error(
                '⛔ [Webhook] Longitudes correctas pero contenido distinto: ' +
                'el secreto de Vercel NO coincide con el de Cal.com.'
            );
        }
    }

    return match ? { ok: true } : { ok: false, reason: 'invalid_signature' };
}

/**
 * Verificación genérica por HMAC-SHA256 para cualquier proveedor.
 *
 * @param {Buffer} rawBody
 * @param {object} headers
 * @param {object} opts { secret, header, encoding: 'hex'|'base64' }
 */
function verifyHmacSignature(rawBody, headers, { secret, header, encoding = 'hex' } = {}) {
    if (!secret) {
        if (unverifiedAllowed() && !isProduction()) {
            return { ok: true, skipped: true };
        }
        return { ok: false, reason: 'missing_secret' };
    }

    const signature = headers[String(header || '').toLowerCase()];
    if (!signature) return { ok: false, reason: 'missing_signature' };

    const expected = hmacSha256(rawBody, secret, encoding);
    const normalized = String(signature).trim().replace(/^sha256=/i, '');
    return safeEqual(expected, normalized)
        ? { ok: true }
        : { ok: false, reason: 'invalid_signature' };
}

module.exports = {
    readRawBody,
    safeEqual,
    hmacSha256,
    verifyCalcomSignature,
    verifyHmacSignature,
    unverifiedAllowed,
    isProduction
};
