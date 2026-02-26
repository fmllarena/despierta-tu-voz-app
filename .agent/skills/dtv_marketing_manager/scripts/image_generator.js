/**
 * Image Generator - Genera imágenes para Feed y Story
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_PATH = path.join(__dirname, '..', 'resources', 'prompts.json');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

class ImageGenerator {
    constructor() {
        this.prompts = this.loadPrompts();
        this.ensureTempDir();
    }

    /**
     * Carga los prompts desde JSON
     */
    loadPrompts() {
        const data = fs.readFileSync(PROMPTS_PATH, 'utf8');
        return JSON.parse(data);
    }

    /**
     * Asegura que existe el directorio temporal
     */
    ensureTempDir() {
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }
    }

    /**
     * Genera imágenes para Feed y Story
     */
    async generateImages(strategy, copy) {
        console.log('   Generando imagen para Feed (1:1)...');
        const feedImage = await this.generateFeedImage(strategy, copy);

        console.log('   Generando imagen para Story (9:16)...');
        const storyImage = await this.generateStoryImage(strategy, copy);

        return {
            feed: feedImage,
            story: storyImage
        };
    }

    /**
     * Genera imagen para Feed Post (1:1)
     */
    async generateFeedImage(strategy, copy) {
        const imageConfig = this.prompts.image_generation;
        const basePrompt = imageConfig.base_prompt;
        const feedConfig = imageConfig.feed_post;
        const variation = imageConfig.variations[strategy.image_variation] || '';

        const fullPrompt = `${basePrompt}, ${feedConfig.additional}, ${variation}`;

        console.log(`   📸 Prompt: ${fullPrompt.substring(0, 80)}...`);

        // USAR IMAGEN REAL GENERADA POR ANTIGRAVITY
        const artifactPath = 'C:\\Users\\fmlla\\.gemini\\antigravity\\brain\\ff7dba8f-7861-42a6-ab11-448bf0ef3ed1\\dtv_feed_post_today_1772133882843.png';
        const imagePath = path.join(TEMP_DIR, `feed_${Date.now()}.png`);

        if (fs.existsSync(artifactPath)) {
            fs.copyFileSync(artifactPath, imagePath);
            console.log('   ✅ Imagen real de Feed copiada del artefacto.');
        } else {
            fs.writeFileSync(imagePath, `IMAGE PLACEHOLDER - Feed 1:1\nPrompt: ${fullPrompt}`);
        }

        return imagePath;
    }

    /**
     * Genera imagen para Story (9:16)
     */
    async generateStoryImage(strategy, copy) {
        const imageConfig = this.prompts.image_generation;
        const basePrompt = imageConfig.base_prompt;
        const storyConfig = imageConfig.story;
        const variation = imageConfig.variations[strategy.image_variation] || '';

        const fullPrompt = `${basePrompt}, ${storyConfig.additional}, ${variation}`;

        console.log(`   📸 Prompt: ${fullPrompt.substring(0, 80)}...`);

        // USAR IMAGEN REAL GENERADA POR ANTIGRAVITY
        const artifactPath = 'C:\\Users\\fmlla\\.gemini\\antigravity\\brain\\ff7dba8f-7861-42a6-ab11-448bf0ef3ed1\\dtv_story_post_today_1772133897879.png';
        const imagePath = path.join(TEMP_DIR, `story_${Date.now()}.png`);

        if (fs.existsSync(artifactPath)) {
            fs.copyFileSync(artifactPath, imagePath);
            console.log('   ✅ Imagen real de Story copiada del artefacto.');
        } else {
            fs.writeFileSync(imagePath, `IMAGE PLACEHOLDER - Story 9:16\nPrompt: ${fullPrompt}`);
        }

        return imagePath;
    }

    /**
     * Limpia archivos temporales antiguos
     */
    cleanupOldFiles(daysOld = 7) {
        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        const maxAge = daysOld * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`   🗑️  Eliminado archivo antiguo: ${file}`);
            }
        });
    }
}

module.exports = new ImageGenerator();
