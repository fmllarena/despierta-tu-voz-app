// api/send-newsletter.js
const crypto = require('crypto');
const { applyCors, handlePreflight, rateLimit } = require('./_lib/http');

function safeEqual(a, b) {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = async (req, res) => {
    applyCors(req, res);
    if (handlePreflight(req, res)) return;
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }
    if (!rateLimit(req, res, { key: 'newsletter', limit: 5, windowMs: 60000 })) return;

    const adminKey = process.env.NEWSLETTER_ADMIN_KEY;
    if (!adminKey) {
        return res.status(503).json({ error: 'Falta configurar NEWSLETTER_ADMIN_KEY en el servidor.' });
    }
    if (!safeEqual(req.headers['x-admin-key'], adminKey)) {
        return res.status(401).json({ error: 'No autorizado.' });
    }

    const { subject, title, content, ctaText, ctaLink, templateId } = req.body || {};
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
        return res.status(500).json({ error: 'No se ha configurado la API Key de Brevo en el servidor.' });
    }

    try {
        console.log('🚀 Iniciando proceso de envío de Newsletter...');

        // 1. Obtener todos los contactos de Brevo (o de tu DB de Supabase)
        // Para simplificar y usar Brevo al 100%, vamos a crear una "Campaña" en lugar de enviar mails 1 a 1.
        // Esto es mucho más eficiente para newsletters masivas.

        const campaignData = {
            name: `Newsletter: ${title} (${new Date().toLocaleDateString()})`,
            subject: subject,
            sender: { name: 'Fernando Martínez - Despierta tu Voz', email: 'app-mentor@despiertatuvoz.com' },
            templateId: parseInt(templateId) || 3,
            recipients: { listIds: [2] }, // ID de tu lista de contactos en Brevo. CAMBIAR SI ES OTRA.
            params: {
                NOMBRE: '{{contact.NOMBRE}}', // Brevo sustituye esto automáticamente si el atributo existe
                TITULO_PRINCIPAL: title,
                CONTENIDO_TEXTO: content.replace(/\n/g, '<br>'), // Convertir saltos de línea a HTML
                TEXTO_BOTON: ctaText || 'Saber más',
                LINK_CTA: ctaLink || 'https://app.despiertatuvoz.com',
                FECHA_HOY: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
            }
        };

        // Crear la campaña
        const createResponse = await fetch('https://api.brevo.com/v3/emailCampaigns', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(campaignData)
        });
        if (!createResponse.ok) {
            const errData = await createResponse.json().catch(() => ({}));
            throw new Error(`Brevo ${createResponse.status}: ${errData.message || createResponse.statusText}`);
        }
        const createData = await createResponse.json();
        const campaignId = createData.id;

        // Enviar la campaña inmediatamente
        const sendResponse = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        if (!sendResponse.ok) {
            const errData = await sendResponse.json().catch(() => ({}));
            throw new Error(`Brevo sendNow ${sendResponse.status}: ${errData.message || sendResponse.statusText}`);
        }

        return res.status(200).json({
            message: 'Campaña creada y enviada con éxito',
            campaignId: campaignId
        });

    } catch (error) {
        console.error('❌ Error en el envío de Newsletter:', error.message);
        return res.status(500).json({
            error: 'Error al conectar con Brevo',
            details: error.message
        });
    }
};
