/**
 * Content Generator - Genera copy para Feed y Story usando IA
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_PATH = path.join(__dirname, '..', 'resources', 'prompts.json');

class ContentGenerator {
    constructor() {
        this.prompts = this.loadPrompts();
    }

    /**
     * Carga los prompts desde JSON
     */
    loadPrompts() {
        const data = fs.readFileSync(PROMPTS_PATH, 'utf8');
        return JSON.parse(data);
    }

    /**
     * Genera copy para Feed y Story
     */
    async generateCopy(strategy) {
        console.log('   Generando copy basado en estrategia...');

        // Construir prompt para el copy del feed
        const feedPrompt = this.buildFeedPrompt(strategy);
        const feedCopy = await this.generateWithAI(feedPrompt);

        // Construir prompt para el copy de la story
        const storyPrompt = this.buildStoryPrompt(strategy);
        const storyCopy = await this.generateWithAI(storyPrompt);

        // Generar hashtags
        const hashtags = this.generateHashtags(strategy);

        return {
            feed: feedCopy,
            story: storyCopy,
            hashtags: hashtags
        };
    }

    /**
     * Construye el prompt para el feed post
     */
    buildFeedPrompt(strategy) {
        const copyConfig = this.prompts.copy_generation.feed_post;
        const systemPrompt = this.prompts.copy_generation.system_prompt;
        const templates = this.prompts.copy_generation.templates;

        // Seleccionar hook según tipo
        const hookType = `${strategy.type.toLowerCase()}_hook`;
        const hooks = templates[hookType] || [];
        const exampleHook = hooks[Math.floor(Math.random() * hooks.length)];

        let specificContext = '';
        if (strategy.niche_meta) {
            specificContext = `
DATOS ESPECÍFICOS DEL NICHO:
- Título Sugerido: ${strategy.niche_meta.suggested_title}
- Argumento: ${strategy.niche_meta.argument}
- Solución: ${strategy.niche_meta.solution}
- Palabras Clave: ${strategy.niche_meta.keywords.join(', ')}

INSTRUCCIÓN ESPECIAL: Usa el "Título Sugerido" como base para el gancho (hook) inicial. Desarrolla el post basándote en el "Argumento" y presenta la "Solución" como el recurso de apoyo gratuito (la App).
`;
        }

        return `${systemPrompt}

TAREA: Genera un post para Instagram Feed siguiendo estas especificaciones:

ESTRATEGIA DEL DÍA:
- Tipo: ${strategy.type}
- Tema: ${strategy.theme}
- Enfoque: ${strategy.focus}
- Tono: ${strategy.tone}
- CTA: ${strategy.cta}
${specificContext}

ESTRUCTURA REQUERIDA:
${copyConfig.structure}

LONGITUD MÁXIMA: ${copyConfig.max_length} caracteres

EJEMPLO DE HOOK (inspiración):
"${exampleHook}"

DIRECTRICES DE MARCA:
- Voz: ${strategy.brand_guidelines.voice}
- Posicionamiento: ${strategy.brand_guidelines.positioning}

FRASES PROHIBIDAS (NUNCA usar):
${strategy.avoid_phrases.map(p => `- "${p}"`).join('\n')}

EMOJIS: ${copyConfig.emoji_usage}

Genera SOLO el texto del post, sin incluir hashtags (se añadirán después).`;
    }

    /**
     * Construye el prompt para la story
     */
    buildStoryPrompt(strategy) {
        const storyConfig = this.prompts.copy_generation.story;
        const systemPrompt = this.prompts.copy_generation.system_prompt;

        return `${systemPrompt}

TAREA: Genera un texto corto para Instagram Story siguiendo estas especificaciones:

ESTRATEGIA DEL DÍA:
- Tipo: ${strategy.type}
- Tema: ${strategy.theme}
- CTA: ${strategy.cta}

ESTRUCTURA: ${storyConfig.structure}

LONGITUD MÁXIMA: ${storyConfig.max_length} caracteres

TONO: ${storyConfig.tone_guidelines}

EMOJIS: ${storyConfig.emoji_usage}

Genera un mensaje directo, impactante y accionable. Debe complementar el post del feed pero ser independiente.`;
    }

    /**
     * Genera hashtags basados en la estrategia
     */
    generateHashtags(strategy) {
        // La directriz actual es no usar hashtags en FB ni IG
        return [];
    }

    /**
     * Genera texto usando IA con Google Gemini API (Fetch directo para estabilidad)
     */
    async asyncGenerateWithAI(prompt) {
        try {
            console.log('   🤖 Generando con Gemini API (Fetch)...');

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('Falta GEMINI_API_KEY');

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error API (${response.status}): ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error('Respuesta vacía de la API');

            return text.trim();
        } catch (error) {
            console.error('   ❌ Error en Gemini API:', error.message);

            // Fallback simple si la IA falla
            return `[FALLBACK] Tu voz es tu esencia. Descúbrela hoy en Despierta tu Voz.`;
        }
    }

    /**
     * Mapeo de método original para compatibilidad
     */
    async generateWithAI(prompt) {
        return await this.asyncGenerateWithAI(prompt);
    }
}

module.exports = new ContentGenerator();
