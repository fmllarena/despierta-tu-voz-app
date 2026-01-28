/**
 * Link Manager - Retorna URL fija de Despierta tu Voz
 * No requiere conexión a Bitly API
 */

class LinkManager {
    constructor() {
        // URL fija de Bitly para tracking
        this.fixedUrl = 'https://bit.ly/3YVs9MI';
    }

    /**
     * Retorna el link fijo (no necesita llamadas a API)
     */
    async createShortLink(baseUrl, day, contentType) {
        console.log(`   🔗 Usando URL fija: ${this.fixedUrl}`);
        console.log(`   📊 Contexto: ${day} - ${contentType}`);

        return this.fixedUrl;
    }

    /**
     * Retorna el link fijo (método simplificado)
     */
    getLink() {
        return this.fixedUrl;
    }
}

module.exports = new LinkManager();
