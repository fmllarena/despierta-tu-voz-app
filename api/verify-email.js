// api/verify-email.js
// Verifica el email del usuario cuando hace clic en el link del correo

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, userId } = req.query;

    if (!token || !userId) {
        return res.redirect('/index.html?verification=missing_params');
    }

    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Buscar usuario con este token
        const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('email_verification_token, email_confirmado_at, email_verification_sent_at')
            .eq('user_id', userId)
            .single();

        if (fetchError || !profile) {
            console.error('Error buscando perfil:', fetchError);
            return res.redirect('/index.html?verification=error');
        }

        // Verificar que el token coincide
        if (profile.email_verification_token !== token) {
            console.error('Token no coincide');
            return res.redirect('/index.html?verification=invalid_token');
        }

        // Verificar que el token no ha expirado (7 días)
        const sentAt = new Date(profile.email_verification_sent_at);
        const now = new Date();
        const daysDiff = (now - sentAt) / (1000 * 60 * 60 * 24);

        if (daysDiff > 7) {
            console.error('Token expirado');
            return res.redirect('/index.html?verification=expired');
        }

        // Ya verificado
        if (profile.email_confirmado_at) {
            return res.redirect('/index.html?verification=already_verified');
        }

        // Marcar como verificado
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                email_confirmado_at: new Date().toISOString(),
                email_verification_token: null // Limpiar token usado
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        console.log(`✅ Email verificado para usuario ${userId}`);
        return res.redirect('/index.html?verification=success');

    } catch (error) {
        console.error('Error en verify-email:', error);
        return res.redirect('/index.html?verification=error');
    }
}
