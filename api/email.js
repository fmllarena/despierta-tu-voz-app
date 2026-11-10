// api/email.js
// POST /api/email  → envía email de verificación al usuario (requiere sesión)
// GET  /api/email  → verifica el token del email y redirige (público: viene del email)
//
// SEGURIDAD:
//  - POST exige JWT válido de Supabase y que el userId del cuerpo coincida
//    con el usuario autenticado (o que quien llama sea mentor). Sin esto,
//    cualquiera podía disparar emails vía Brevo y sobrescribir el token de
//    verificación de otra persona.
//  - El email de destino se toma SIEMPRE del usuario autenticado, nunca del
//    cuerpo de la petición, para que no se pueda usar como relay de spam.
//  - Rate limit agresivo: es un endpoint que envía correo real.

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { applyCors, handlePreflight, rateLimit } = require('./_lib/http');
const { getAuthUser, isMentor, canAccessUser } = require('./_lib/auth');
const { captureError, withMonitoring } = require('./_lib/monitoring');
const { readRawBody, hmacSha256, safeEqual } = require('./_lib/webhook-security');

const TOKEN_TTL_DAYS = 7;
// Freno anti-abuso: un reenvío cada 60 s por usuario y 5 por hora.
const RESEND_COOLDOWN_MS = 60 * 1000;

function serviceClient() {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

/** Token opaco de verificación (32 bytes aleatorios en hex). */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Identificador estable para el token: se guarda el hash, no el token en claro,
 * de modo que un volcado de la tabla no permita verificar cuentas ajenas.
 */
function hashToken(token) {
    return hmacSha256(Buffer.from(String(token)), process.env.EMAIL_TOKEN_SECRET || 'dtv-email-verify', 'hex');
}

/**
 * Comprueba que el userId corresponde a una cuenta real de Supabase Auth,
 * que su email coincide con el solicitado y que aún no está confirmada.
 * Es lo que permite el reenvío justo después del registro, cuando todavía
 * no existe sesión, sin abrir la puerta a enviar correo a terceros.
 */
async function isUnverifiedSignup(userId, requestedEmail) {
    try {
        const supabase = serviceClient();
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (error || !data?.user) return false;
        const authEmail = String(data.user.email || '').trim().toLowerCase();
        if (!authEmail || authEmail !== requestedEmail) return false;
        // Ya confirmada en Auth → no hay nada que verificar aquí.
        if (data.user.email_confirmed_at) return false;
        return true;
    } catch (e) {
        console.error('⛔ [email] Error comprobando registro sin sesión:', e?.message || e);
        return false;
    }
}

const handler = async function (req, res) {
    applyCors(req, res);
    if (handlePreflight(req, res)) return;

    // ── POST: enviar email de verificación ──────────────────────────────────
    if (req.method === 'POST') {
        // Límite estricto: 5 envíos por hora e IP.
        if (!rateLimit(req, res, { key: 'email-send', limit: 5, windowMs: 3600000 })) return;

        // 1. Autenticación. Hay dos vías legítimas:
        //    a) El usuario tiene sesión (reenvío desde la app) → se exige que
        //       el userId coincida con el suyo, o que sea mentor.
        //    b) Viene de registrarse: con la confirmación de email activada en
        //       Supabase, signUp() NO devuelve sesión, así que aún no hay JWT.
        //       En ese caso se acepta solo si el email indicado pertenece a esa
        //       cuenta recién creada (se comprueba contra Auth). Así el
        //       endpoint deja de ser un relay de spam abierto.
        const authUser = await getAuthUser(req);

        let body;
        try {
            body = Buffer.isBuffer(req.body) ? JSON.parse((await readRawBody(req)).toString('utf8')) : (req.body || {});
        } catch (_) {
            return res.status(400).json({ error: 'JSON mal formado' });
        }

        const { userId, nombre } = body;

        if (!userId) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos' });
        }

        if (authUser) {
            // Vía (a): sesión válida.
            if (!canAccessUser(authUser, userId)) {
                // No revelamos si el userId existe o no.
                return res.status(403).json({ error: 'Sin acceso a este usuario' });
            }
        } else {
            // Vía (b): sin sesión, solo vale para una cuenta sin verificar y
            // únicamente si el email del cuerpo es el de esa misma cuenta.
            const requested = String(body.email || '').trim().toLowerCase();
            if (!requested) {
                return res.status(401).json({ error: 'No autenticado. Inicia sesión de nuevo.' });
            }
            if (!(await isUnverifiedSignup(userId, requested))) {
                return res.status(401).json({ error: 'No autenticado. Inicia sesión de nuevo.' });
            }
            console.log(`ℹ️ [email] Reenvío de verificación sin sesión para ${requested}`);
        }

        // 3. El destinatario lo decide el servidor, nunca el cuerpo de la
        //    petición: así el endpoint no sirve como relay de spam.
        let targetEmail;
        if (authUser && isMentor(authUser) && String(userId) !== String(authUser.id)) {
            // Un mentor puede reenviar la verificación a otro usuario: se usa
            // el email de su perfil, no el que venga en el body.
            const supabase = serviceClient();
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('email')
                .eq('user_id', userId)
                .maybeSingle();
            if (!profile?.email) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            targetEmail = profile.email;
        } else if (authUser) {
            targetEmail = authUser.email;
        } else {
            // Vía (b): ya validado contra Auth, usamos el email comprobado.
            targetEmail = String(body.email).trim();
        }

        if (!targetEmail) {
            return res.status(400).json({ error: 'No se pudo determinar el destinatario' });
        }

        try {
            const supabase = serviceClient();

            // 4. Anti-abuso: no reenviar si se hizo hace menos de 60 s.
            const { data: current } = await supabase
                .from('user_profiles')
                .select('email_verification_sent_at, email_confirmado_at')
                .eq('user_id', userId)
                .maybeSingle();

            if (current?.email_confirmado_at) {
                return res.status(200).json({
                    success: true,
                    alreadyVerified: true,
                    message: 'El email ya estaba verificado'
                });
            }

            if (current?.email_verification_sent_at) {
                const elapsed = Date.now() - new Date(current.email_verification_sent_at).getTime();
                if (elapsed >= 0 && elapsed < RESEND_COOLDOWN_MS) {
                    res.setHeader('Retry-After', String(Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)));
                    return res.status(429).json({
                        error: 'Espera un momento antes de pedir otro email de verificación'
                    });
                }
            }

            const verificationToken = generateToken();
            const appUrl = process.env.APP_URL
                || process.env.NEXT_PUBLIC_APP_URL
                || 'https://app.despiertatuvoz.com';
            const verificationLink =
                `${appUrl}/api/email?token=${encodeURIComponent(verificationToken)}` +
                `&userId=${encodeURIComponent(userId)}`;

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    email_verification_token: hashToken(verificationToken),
                    email_verification_sent_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            const senderName = process.env.BREVO_SENDER_NAME || 'Fernando - Despierta tu Voz';
            const senderEmail = process.env.BREVO_SENDER_EMAIL || 'app-mentor@despiertatuvoz.com';

            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: targetEmail, name: nombre || targetEmail.split('@')[0] }],
                    templateId: parseInt(process.env.BREVO_TEMPLATE_BIENVENIDA_GRATIS || '5', 10),
                    params: {
                        NOMBRE: nombre || targetEmail.split('@')[0],
                        VERIFICATION_LINK: verificationLink
                    }
                })
            });

            if (!brevoResponse.ok) {
                const errorText = await brevoResponse.text();
                throw new Error(`Brevo ${brevoResponse.status}: ${errorText.slice(0, 300)}`);
            }

            console.log(`✅ Email de verificación enviado a ${targetEmail}`);
            return res.status(200).json({
                success: true,
                message: 'Email de verificación enviado correctamente'
            });

        } catch (error) {
            captureError(error, {
                endpoint: '/api/email',
                method: 'POST',
                userId,
                extra: { stage: 'send_verification' }
            });
            // No devolvemos error.message al cliente: puede contener detalles
            // de Brevo/Supabase.
            return res.status(500).json({ error: 'Error enviando email de verificación' });
        }
    }

    // ── GET: verificar token ─────────────────────────────────────────────────
    // Público por diseño: el enlace llega por correo y se abre sin sesión.
    if (req.method === 'GET') {
        if (!rateLimit(req, res, { key: 'email-verify', limit: 30, windowMs: 60000 })) return;

        const { token, userId } = req.query || {};

        if (!token || !userId) {
            return res.redirect('/index.html?verification=missing_params');
        }

        try {
            const supabase = serviceClient();

            const { data: profile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('email_verification_token, email_confirmado_at, email_verification_sent_at')
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError || !profile) {
                console.error('Error buscando perfil:', fetchError);
                return res.redirect('/index.html?verification=error');
            }

            if (profile.email_confirmado_at) {
                return res.redirect('/index.html?verification=already_verified');
            }

            if (!profile.email_verification_token) {
                return res.redirect('/index.html?verification=invalid_token');
            }

            // Comparación en tiempo constante contra el hash almacenado.
            if (!safeEqual(profile.email_verification_token, hashToken(token))) {
                console.warn(`⚠️ Token de verificación no válido para ${userId}`);
                return res.redirect('/index.html?verification=invalid_token');
            }

            const sentAt = new Date(profile.email_verification_sent_at);
            const daysDiff = (Date.now() - sentAt.getTime()) / (1000 * 60 * 60 * 24);
            if (!Number.isFinite(daysDiff) || daysDiff > TOKEN_TTL_DAYS) {
                return res.redirect('/index.html?verification=expired');
            }

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    email_confirmado_at: new Date().toISOString(),
                    email_verification_token: null
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            console.log(`✅ Email verificado para usuario ${userId}`);
            return res.redirect('/index.html?verification=success');

        } catch (error) {
            captureError(error, {
                endpoint: '/api/email',
                method: 'GET',
                userId,
                extra: { stage: 'verify_token' }
            });
            return res.redirect('/index.html?verification=error');
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
};

module.exports = withMonitoring('/api/email', handler);
