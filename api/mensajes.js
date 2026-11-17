const { handler: handlerEnviar } = require('./_lib/enviar-mensaje-personal');
const { handler: handlerListar } = require('./_lib/mensajes-personales');

module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        return handlerEnviar(req, res);
    }
    if (req.method === 'GET') {
        return handlerListar(req, res);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
};
