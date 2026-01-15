import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { code, userId } = req.body;

        if (!code || !userId) {
            return res.status(400).json({ error: 'Faltan datos (code, userId)' });
        }

        // --- SISTEMA DE CÓDIGOS (Simplificado) ---
        // Puedes añadir más códigos aquí o llevarlos a una tabla en Supabase en el futuro
        const VALID_CODES = ['ALQUIMIA2026', 'PROMO2026', 'FERNANDO2026'];

        if (!VALID_CODES.includes(code.toUpperCase())) {
            return res.status(400).json({ error: 'El código promocional no es válido o ha expirado.' });
        }

        console.log(`🎁 Canjeando promo ${code} para usuario ${userId}`);

        // Actualizamos el tier directamente sin pasar por Stripe
        const { error } = await supabase
            .from('user_profiles')
            .update({
                subscription_tier: 'pro',
                updated_at: new Date().toISOString(),
                mentor_notes: `Promo ${code} canjeada el ${new Date().toLocaleDateString()}`
            })
            .eq('user_id', userId);

        if (error) throw error;

        return res.status(200).json({ success: true, message: '¡Promoción activada con éxito!' });

    } catch (err) {
        console.error('Error en redeem-promo:', err);
        return res.status(500).json({ error: 'Error al activar la promoción', details: err.message });
    }
}
