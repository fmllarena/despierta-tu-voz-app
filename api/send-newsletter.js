// api/send-newsletter.js
const axios = require('axios');

module.exports = async (req, res) => {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { subject, title, content, ctaText, ctaLink, templateId } = req.body;
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
        const response = await axios.post('https://api.brevo.com/v3/emailCampaigns', campaignData, {
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const campaignId = response.data.id;

        // Enviar la campaña inmediatamente
        await axios.post(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {}, {
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json({
            message: 'Campaña creada y enviada con éxito',
            campaignId: campaignId
        });

    } catch (error) {
        console.error('❌ Error en el envío de Newsletter:', error.response ? error.response.data : error.message);
        return res.status(500).json({
            error: 'Error al conectar con Brevo',
            details: error.response ? error.response.data : error.message
        });
    }
};
