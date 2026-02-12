/**
 * Meta Publisher - Publica contenido en Facebook e Instagram vía Graph API
 */

const https = require('https');
const fs = require('fs');

class MetaPublisher {
    constructor() {
        this.userToken = process.env.META_USER_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
        this.pageToken = process.env.META_PAGE_ACCESS_TOKEN || this.userToken;
        this.pageId = process.env.META_PAGE_ID;
        this.instagramAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID;
        this.apiVersion = 'v18.0';
        this.apiHost = 'graph.facebook.com';
    }

    /**
     * Valida que las credenciales estén configuradas
     */
    validateCredentials() {
        if (!this.userToken) {
            throw new Error('META_USER_ACCESS_TOKEN no configurado en .env');
        }
        if (!this.pageId) {
            throw new Error('META_PAGE_ID no configurado en .env');
        }
        if (!this.instagramAccountId) {
            throw new Error('META_INSTAGRAM_ACCOUNT_ID no configurado en .env');
        }
    }

    /**
     * Publica como borrador en Meta Business Suite
     */
    async publishAsDraft(content) {
        this.validateCredentials();

        const results = {
            instagram: { status: 'failed', error: 'Not attempted' },
            facebook: { status: 'failed', error: 'Not attempted' }
        };

        try {
            console.log('   📱 Publicando en Instagram (creando contenedor)...');
            results.instagram = await this.publishInstagramDraft(content);
        } catch (error) {
            console.error(`   ❌ Error en Instagram: ${error.message}`);
            results.instagram = { status: 'failed', error: error.message };
        }

        try {
            console.log('   📘 Publicando en Facebook como borrador...');
            results.facebook = await this.publishFacebookDraft(content);
        } catch (error) {
            console.error(`   ❌ Error en Facebook: ${error.message}`);
            results.facebook = { status: 'failed', error: error.message };
        }

        return results;
    }

    /**
     * Publica programado para una hora específica
     */
    async publishScheduled(content, time = '18:00') {
        this.validateCredentials();

        // Calcular timestamp para la publicación respetando el día de la estrategia
        let scheduledTime = this.calculateScheduledTimeForDay(content.day, time);

        // Si es un post de nicho, añadir un desfase para que no coincidan todos al mismo minuto
        if (content.type === 'Niche') {
            const nicheOffsets = {
                'choral_directors': 10,  // +10 min
                'vocal_teachers': 20,    // +20 min
                'singers_choristers': 30 // +30 min
            };
            const offset = nicheOffsets[content.strategy.image_variation] || 5;
            scheduledTime += (offset * 60);
        }

        console.log(`   📱 Programando Instagram para ${content.day} a las ${time} (+ offset nicho if any)...`);
        const instagramResult = await this.publishInstagramScheduled(content, scheduledTime);

        console.log(`   📘 Programando Facebook para ${content.day} a las ${time} (+ offset nicho if any)...`);
        const facebookResult = await this.publishFacebookScheduled(content, scheduledTime);

        return {
            instagram: instagramResult,
            facebook: facebookResult,
            scheduled_time: new Date(scheduledTime * 1000).toISOString()
        };
    }

    /**
     * Publica borrador en Instagram
     */
    async publishInstagramDraft(content) {
        // Paso 1: Obtener imagen (usamos placeholder para que Instagram acepte la URL)
        const imageUrl = await this.uploadImageToFacebook(content.images.feed);

        // Paso 2: Crear contenedor de media
        // Nota: Instagram no tiene modo "borrador" real vía API, 
        // crear el contenedor lo deja pendiente de publicación por 24h.
        const caption = `${content.copy.feed}\n\n${content.copy.hashtags.join(' ')}\n\n🔗 ${content.shortUrl}`;

        const postData = {
            image_url: imageUrl,
            caption: caption,
            access_token: this.pageToken
        };

        const result = await this.makeGraphAPIRequest(
            `/${this.apiVersion}/${this.instagramAccountId}/media`,
            'POST',
            postData
        );

        return {
            id: result.id,
            status: 'container_created',
            platform: 'instagram'
        };
    }

    /**
     * Publica borrador en Facebook
     */
    async publishFacebookDraft(content) {
        const message = `${content.copy.feed}\n\n${content.copy.hashtags.join(' ')}\n\n🔗 ${content.shortUrl}`;

        // Calcular fecha de publicación basada en el día del contenido
        const scheduledTime = this.calculateScheduledTimeForDay(content.day);

        const postData = {
            message: message,
            published: false,
            scheduled_publish_time: scheduledTime,
            access_token: this.pageToken
        };

        console.log(`   📝 Post programado para ${content.day} sin imagen (añadir manualmente)`);

        const result = await this.makeGraphAPIRequest(
            `/${this.apiVersion}/${this.pageId}/feed`,
            'POST',
            postData
        );

        return {
            id: result.id,
            status: 'scheduled',
            platform: 'facebook',
            scheduled_date: new Date(scheduledTime * 1000).toISOString()
        };
    }

    /**
     * Calcula el timestamp para un día específico de la semana
     */
    calculateScheduledTimeForDay(dayName, time = '18:00') {
        const [hours, minutes] = time.split(':').map(Number);

        const dayMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0
        };

        const targetDay = dayMap[dayName.toLowerCase()];
        const now = new Date();
        const currentDay = now.getDay();

        // Calcular días hasta el día objetivo
        let daysUntil = targetDay - currentDay;

        // Si el día es hoy pero la hora ya pasó (o falta poco), programar para la próxima semana
        // O si el día ya pasó esta semana, programar para la próxima
        const minBuffer = 25 * 60 * 1000; // 25 min buffer para Meta
        const targetToday = new Date(now);
        targetToday.setHours(hours, minutes, 0, 0);

        if (daysUntil < 0 || (daysUntil === 0 && targetToday.getTime() <= now.getTime() + minBuffer)) {
            daysUntil += 7;
        }

        // Crear fecha objetivo
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysUntil);
        targetDate.setHours(hours, minutes, 0, 0);

        // Convertir a timestamp Unix
        return Math.floor(targetDate.getTime() / 1000);
    }

    /**
     * Publica programado en Instagram
     */
    async publishInstagramScheduled(content, scheduledTime) {
        const imageUrl = await this.uploadImageToFacebook(content.images.feed);
        const caption = `${content.copy.feed}\n\n${content.copy.hashtags.join(' ')}\n\n🔗 ${content.shortUrl}`;

        // Crear container
        const containerData = {
            image_url: imageUrl,
            caption: caption,
            access_token: this.pageToken
        };

        const container = await this.makeGraphAPIRequest(
            `/${this.apiVersion}/${this.instagramAccountId}/media`,
            'POST',
            containerData
        );

        // Publicar container programado
        const publishData = {
            creation_id: container.id,
            published: true,
            scheduled_publish_time: scheduledTime,
            access_token: this.pageToken
        };

        const result = await this.makeGraphAPIRequest(
            `/${this.apiVersion}/${this.instagramAccountId}/media_publish`,
            'POST',
            publishData
        );

        return {
            id: result.id,
            status: 'scheduled',
            platform: 'instagram',
            scheduled_time: scheduledTime
        };
    }

    /**
     * Publica programado en Facebook
     */
    async publishFacebookScheduled(content, scheduledTime) {
        const imageUrl = await this.uploadImageToFacebook(content.images.feed);
        const message = `${content.copy.feed}\n\n${content.copy.hashtags.join(' ')}\n\n🔗 ${content.shortUrl}`;

        const postData = {
            message: message,
            url: imageUrl,
            published: false,
            scheduled_publish_time: scheduledTime,
            access_token: this.pageToken
        };

        const result = await this.makeGraphAPIRequest(
            `/${this.apiVersion}/${this.pageId}/photos`,
            'POST',
            postData
        );

        return {
            id: result.id,
            status: 'scheduled',
            platform: 'facebook',
            scheduled_time: scheduledTime
        };
    }

    /**
     * Sube imagen a Facebook y retorna URL
     * NOTA: Actualmente retorna una URL fija del sitio para que Meta acepte el borrador,
     * ya que los archivos locales en temp/ no son accesibles desde internet.
     */
    async uploadImageToFacebook(imagePath) {
        console.log(`   📸 Usando placeholder público para borrador: https://despiertatuvoz.com/wp-content/themes/dtv-theme/assets/hero-v2.png`);
        // Usamos el hero del sitio como placeholder para que Meta acepte la creación del post
        return `https://despiertatuvoz.com/wp-content/themes/dtv-theme/assets/hero-v2.png`;
    }

    /**
     * Calcula timestamp Unix para hora programada
     */
    calculateScheduledTime(time) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const scheduled = new Date(now);

        scheduled.setHours(hours, minutes, 0, 0);

        // Si la hora ya pasó hoy, programar para mañana (mínimo 20 min en el futuro para Meta)
        if (scheduled <= new Date(now.getTime() + 20 * 60 * 1000)) {
            scheduled.setDate(scheduled.getDate() + 1);
        }

        return Math.floor(scheduled.getTime() / 1000);
    }

    /**
     * Hace una petición a Graph API
     */
    makeGraphAPIRequest(path, method, data) {
        return new Promise((resolve, reject) => {
            const queryString = new URLSearchParams(data).toString();
            const fullPath = method === 'GET' ? `${path}?${queryString}` : path;
            const postData = method === 'POST' ? queryString : '';

            console.log(`   🌐 API Request: ${method} ${fullPath.split('?')[0]}`);
            if (method === 'POST') console.log(`   📦 Post Data: ${queryString.substring(0, 100)}...`);

            const options = {
                hostname: this.apiHost,
                path: fullPath,
                method: method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(responseData));
                    } else {
                        console.error(`   ❌ Error de API (${res.statusCode}): ${responseData}`);
                        reject(new Error(`Graph API error: ${res.statusCode} - ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`   ❌ Error de Red: ${error.message}`);
                reject(error);
            });

            if (postData) {
                req.write(postData);
            }

            req.end();
        });
    }
}

module.exports = new MetaPublisher();
