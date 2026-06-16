// api/email.js
// POST /api/email  → envía email de verificación al usuario
// GET  /api/email  → verifica el token del email y redirige

module.exports = async function handler(req, res) {
    // ── POST: enviar email de verificación ──────────────────────────────────
    if (req.method === 'POST') {
        const { userId, email, nombre } = req.body;

        if (!userId || !email || !nombre) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos' });
        }

        try {
            const crypto = require('crypto');
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.despiertatuvoz.com'}/api/email?token=${verificationToken}&userId=${userId}`;

            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    email_verification_token: verificationToken,
                    email_verification_sent_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: 'Fernando - Despierta tu Voz',
                        email: 'app-mentor@despiertatuvoz.com'
                    },
                    to: [{ email, name: nombre }],
                    templateId: parseInt(process.env.BREVO_TEMPLATE_BIENVENIDA_GRATIS || '5'),
                    params: {
                        NOMBRE: nombre,
                        VERIFICATION_LINK: verificationLink
                    }
                })
            });

            if (!brevoResponse.ok) {
                const errorText = await brevoResponse.text();
                console.error('Error Brevo:', errorText);
                throw new Error('Error enviando email de verificación');
            }

            console.log(`Email de verificación enviado a ${email}`);
            return res.status(200).json({
                success: true,
                message: 'Email de verificación enviado correctamente'
            });

        } catch (error) {
            console.error('Error en email (POST):', error);
            return res.status(500).json({
                error: 'Error enviando email de verificación',
                details: error.message
            });
        }
    }

    // ── GET: verificar token ─────────────────────────────────────────────────
    if (req.method === 'GET') {
        const { token, userId } = req.query;

        if (!token || !userId) {
            return res.redirect('/index.html?verification=missing_params');
        }

        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            const { data: profile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('email_verification_token, email_confirmado_at, email_verification_sent_at')
                .eq('user_id', userId)
                .single();

            if (fetchError || !profile) {
                console.error('Error buscando perfil:', fetchError);
                return res.redirect('/index.html?verification=error');
            }

            if (profile.email_verification_token !== token) {
                console.error('Token no coincide');
                return res.redirect('/index.html?verification=invalid_token');
            }

            const sentAt = new Date(profile.email_verification_sent_at);
            const daysDiff = (new Date() - sentAt) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
                console.error('Token expirado');
                return res.redirect('/index.html?verification=expired');
            }

            if (profile.email_confirmado_at) {
                return res.redirect('/index.html?verification=already_verified');
            }

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    email_confirmado_at: new Date().toISOString(),
                    email_verification_token: null
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            console.log(`Email verificado para usuario ${userId}`);
            return res.redirect('/index.html?verification=success');

        } catch (error) {
            console.error('Error en email (GET):', error);
            return res.redirect('/index.html?verification=error');
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
};
