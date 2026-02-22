/**
 * Despierta tu Voz - Backend Utilities
 */

function formatHistoryForGeminiREST(history) {
    if (!Array.isArray(history)) return [];
    let sanitized = [];
    let lastRole = null;

    history.filter(h => h?.parts?.[0]?.text).forEach(h => {
        const role = h.role === 'model' ? 'model' : 'user';
        if (role !== lastRole) {
            sanitized.push({ role, parts: [{ text: h.parts[0].text }] });
            lastRole = role;
        }
    });

    // Ventana inteligente: últimos 10 mensajes
    while (sanitized.length > 10) sanitized.shift();

    return sanitized;
}

/**
 * Filtra y limpia el historial para asegurar que no haya roles repetidos seguidos,
 * lo cual rompe la API de Gemini.
 */
function sanitizeGeminiHistory(history) {
    return formatHistoryForGeminiREST(history);
}

module.exports = {
    formatHistoryForGeminiREST,
    sanitizeGeminiHistory
};
