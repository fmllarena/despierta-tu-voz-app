/**
 * Content Generator - Genera copy para Feed y Story usando IA
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_PATH = path.join(__dirname, '..', 'resources', 'prompts.json');

class ContentGenerator {
    constructor() {
        this.prompts = this.loadPrompts();
        this.knowledge = this.loadKnowledge();
    }

    loadKnowledge() {
        const knowledgePath = path.join(__dirname, '..', 'resources', 'blog_knowledge.json');
        if (fs.existsSync(knowledgePath)) {
            return JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
        }
        return { posts: [] };
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

        // Buscar artículo de conocimiento relevante
        const relevantArticle = this.findRelevantArticle(strategy);
        if (relevantArticle) {
            specificContext += `
CONTENIDO DEL BLOG RELACIONADO:
- Título: ${relevantArticle.title}
- Esencia: ${relevantArticle.content}
- URL: ${relevantArticle.url}

INSTRUCCIÓN ESPECIAL: Basa el post en la esencia de este artículo del blog. Menciona que pueden leer más en el blog o profundizar con su Mentor en la App.
`;
        }

        if (strategy.niche_meta) {
            specificContext += `
DATOS ESPECÍFICOS DEL NICHO:
- Título Sugerido: ${strategy.niche_meta.suggested_title}
- Argumento: ${strategy.niche_meta.argument}
- Solución: ${strategy.niche_meta.solution}
- Palabras Clave: ${strategy.niche_meta.keywords.join(', ')}

INSTRUCCIÓN ESPECIAL (NICHO): Integra estos datos con la esencia del blog si aplica. Usa el "Título Sugerido" como base para el gancho inicial.
`;
        }

        // Seleccionar hook solo si no hay artículo del blog para evitar redundancia genérica
        let inspirationHook = '';
        if (!relevantArticle) {
            const hookType = `${strategy.type.toLowerCase()}_hook`;
            const hooks = templates[hookType] || [];
            inspirationHook = `EJEMPLO DE HOOK (inspiración): "${hooks[Math.floor(Math.random() * hooks.length)]}"`;
        }

        return `${systemPrompt}

TAREA: Genera un post para Instagram Feed basado EXCLUSIVAMENTE en la esencia del "Contenido del Blog" adjunto. 

ESTRATEGIA DEL DÍA:
- Tipo: ${strategy.type}
- Tema: ${strategy.theme}
- Enfoque: ${strategy.focus}
- Tono: ${strategy.tone}
- CTA: ${strategy.cta}
${specificContext}

${inspirationHook}

ESTRUCTURA REQUERIDA:
${copyConfig.structure}

LONGITUD MÁXIMA: ${copyConfig.max_length} caracteres

DIRECCIONES DE GENERACIÓN:
- Sé fiel al mensaje del artículo: usa sus conceptos clave y su voz humana.
- Menciona explícitamente el título del artículo para que sepan qué leer en el blog.
- El post debe ser valioso por sí mismo, no solo un anuncio.
- El cierre debe invitar a practicar lo aprendido hoy mismo en la App con el Mentor.

Genera SOLO el texto del post, sin incluir hashtags.`;
    }

    /**
     * Construye el prompt para la story
     */
    buildStoryPrompt(strategy) {
        const storyConfig = this.prompts.copy_generation.story;
        const systemPrompt = this.prompts.copy_generation.system_prompt;

        // Buscar artículo de conocimiento relevante (mismo que en el feed)
        const relevantArticle = this.findRelevantArticle(strategy);
        let blogContext = '';
        if (relevantArticle) {
            blogContext = `
CONTENIDO DEL BLOG RELACIONADO:
- Título: ${relevantArticle.title}
- Esencia: ${relevantArticle.content}
`;
        }

        return `${systemPrompt}

TAREA: Genera una secuencia de 3 SLICES (pantallas) para Instagram Story basada en la esencia del blog adjunto.

ESTRATEGIA DEL DÍA:
- Tipo: ${strategy.type}
- Tema: ${strategy.theme}
- CTA: ${strategy.cta}
${blogContext}

ESTRUCTURA OBLIGATORIA:
SLICE 1 (Gancho): Una pregunta o frase impactante que detenga el scroll.
SLICE 2 (Valor): Una píldora de sabiduría extraída directamente del artículo del blog.
SLICE 3 (CTA): La llamada a la acción vinculando con la App o el post del blog.

FORMATO DE SALIDA:
SLICE 1: [texto]
SLICE 2: [texto]
SLICE 3: [texto]

LONGITUD: Máximo 80 caracteres por slice para asegurar legibilidad.
TONO: ${storyConfig.tone_guidelines}`;
    }

    /**
     * Encuentra un artículo del blog que resuene con la estrategia actual
     */
    findRelevantArticle(strategy) {
        if (!this.knowledge.posts.length) return null;

        // Búsqueda por concordancia de texto en tema o enfoque
        const allText = (strategy.theme + ' ' + strategy.focus + ' ' + (strategy.niche_meta?.name || '')).toLowerCase();

        // Lógica de mapeo mejorada
        if (strategy.type === 'Filosófico') {
            const philosophical = this.knowledge.posts.filter(p => p.category.includes('Filosofía') || p.category.includes('Naturaleza'));
            return philosophical[Math.floor(Math.random() * philosophical.length)];
        }

        if (strategy.type === 'Niche') {
            // Match para Directores de Coro / Coralistas
            if (allText.includes('coro') || allText.includes('director') || allText.includes('grupal')) {
                return this.knowledge.posts.find(p => p.title.includes('corista')) || null;
            }
            // Match para Profesores (bloqueos, pedagogía)
            if (allText.includes('profesor') || allText.includes('pedagogía') || allText.includes('bloqueo')) {
                return this.knowledge.posts.find(p => p.title.includes('Patrones repetitivos')) || null;
            }
        }

        if (strategy.type === 'Coaching' || allText.includes('paz') || allText.includes('emocional')) {
            const psychological = this.knowledge.posts.filter(p => p.category.includes('Psicología') || p.category.includes('Paz Mental'));
            if (psychological.length) return psychological[Math.ceil(Math.random() * psychological.length) - 1];
        }

        // Default: uno aleatorio para dar variedad si no hay match claro
        return this.knowledge.posts[Math.floor(Math.random() * this.knowledge.posts.length)];
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

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`;

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
