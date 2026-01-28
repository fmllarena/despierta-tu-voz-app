/**
 * Bitly Shortener - Genera enlaces cortos con tracking UTM
 */

const https = require('https');

class BitlyShortener {
    constructor() {
        this.apiToken = process.env.BITLY_ACCESS_TOKEN;
        this.apiUrl = 'api-ssl.bitly.com';
    }

    /**
     * Crea un link corto con parámetros UTM
     */
    async createShortLink(baseUrl, day, contentType) {
        // Construir URL con parámetros UTM
        const utmParams = new URLSearchParams({
            utm_source: 'instagram',
            utm_medium: 'social',
            utm_campaign: 'daily_content',
            utm_content: `${day}_${contentType.toLowerCase()}`
        });

        const longUrl = `${baseUrl}?${utmParams.toString()}`;

        console.log(`   🔗 URL original: ${longUrl}`);

        if (!this.apiToken) {
            console.log('   ⚠️  BITLY_ACCESS_TOKEN no configurado - usando URL original');
            return longUrl;
        }

        try {
            const shortUrl = await this.callBitlyAPI(longUrl);
            console.log(`   ✅ URL acortada: ${shortUrl}`);
            return shortUrl;
        } catch (error) {
            console.error(`   ❌ Error al acortar URL: ${error.message}`);
            console.log('   ⚠️  Usando URL original como fallback');
            return longUrl;
        }
    }

    /**
     * Llama a la API de Bitly
     */
    callBitlyAPI(longUrl) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                long_url: longUrl,
                domain: 'bit.ly'
            });

            const options = {
                hostname: this.apiUrl,
                path: '/v4/shorten',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        const response = JSON.parse(data);
                        resolve(response.link);
                    } else {
                        reject(new Error(`Bitly API error: ${res.statusCode} - ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Obtiene estadísticas de un link (opcional)
     */
    async getLinkStats(shortUrl) {
        if (!this.apiToken) {
            throw new Error('BITLY_ACCESS_TOKEN no configurado');
        }

        // Extraer el bitlink ID de la URL
        const bitlinkId = shortUrl.replace('https://', '').replace('http://', '');

        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.apiUrl,
                path: `/v4/bitlinks/${bitlinkId}/clicks/summary`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Bitly API error: ${res.statusCode} - ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }
}

module.exports = new BitlyShortener();
