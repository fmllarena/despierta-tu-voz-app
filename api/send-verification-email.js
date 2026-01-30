// api/send-verification-email.js
// Envía email de verificación a usuarios FREE después del registro

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, email, nombre } = req.body;

    if (!userId || !email || !nombre) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    try {
        // Generar token de verificación único
        const crypto = require('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.despiertatuvoz.com'}/api/verify-email?token=${verificationToken}&userId=${userId}`;

        // Guardar token en Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
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

        // Enviar email vía Brevo
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
                templateId: parseInt(process.env.BREVO_TEMPLATE_BIENVENIDA_GRATIS || '8'), // ID de la plantilla en Brevo
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

        console.log(`✅ Email de verificación enviado a ${email}`);
        return res.status(200).json({
            success: true,
            message: 'Email de verificación enviado correctamente'
        });

    } catch (error) {
        console.error('Error en send-verification-email:', error);
        return res.status(500).json({
            error: 'Error enviando email de verificación',
            details: error.message
        });
    }
}
