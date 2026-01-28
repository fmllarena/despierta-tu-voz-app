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

        // NOTA: Aquí integrarías con tu herramienta de generación de imágenes
        // Por ahora, retornamos un path placeholder
        const imagePath = path.join(TEMP_DIR, `feed_${Date.now()}.png`);

        // Crear archivo placeholder
        fs.writeFileSync(imagePath, `IMAGE PLACEHOLDER - Feed 1:1\nPrompt: ${fullPrompt}`);

        console.log('   ⚠️  NOTA: Usando placeholder - integrar con generate_image tool');

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

        // NOTA: Aquí integrarías con tu herramienta de generación de imágenes
        const imagePath = path.join(TEMP_DIR, `story_${Date.now()}.png`);

        // Crear archivo placeholder
        fs.writeFileSync(imagePath, `IMAGE PLACEHOLDER - Story 9:16\nPrompt: ${fullPrompt}`);

        console.log('   ⚠️  NOTA: Usando placeholder - integrar con generate_image tool');

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
