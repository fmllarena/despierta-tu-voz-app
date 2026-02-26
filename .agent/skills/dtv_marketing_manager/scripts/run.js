#!/usr/bin/env node

/**
 * DTV Marketing Manager - Script Principal
 * Orquesta la generación y publicación de contenido diario
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CalendarLogic = require('./calendar_logic.js');
const ContentGenerator = require('./content_generator.js');
const ImageGenerator = require('./image_generator.js');
const LinkManager = require('./link_manager.js');
const MetaPublisher = require('./meta_publisher.js');

// Configuración
const CONFIG = {
    mode: process.env.DTV_PUBLISH_MODE || 'draft', // draft | publish | assets_only
    baseUrl: process.env.DTV_BASE_URL || 'https://despiertatuvoz.vercel.app',
    outputDir: path.join(__dirname, '..', 'output'),
    logsDir: path.join(__dirname, '..', 'logs'),
};

// Parse argumentos CLI
const args = process.argv.slice(2);
const cliArgs = {};
args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    cliArgs[key] = value || true;
});

// Override mode si se especifica en CLI
if (cliArgs.mode) {
    CONFIG.mode = cliArgs.mode;
}

/**
 * Función principal
 */
async function main() {
    const startTime = Date.now();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    console.log('\n🚀 DTV Marketing Manager - Iniciando...\n');
    console.log(`📅 Fecha: ${dateStr}`);
    console.log(`⚙️  Modo: ${CONFIG.mode.toUpperCase()}`);
    console.log('─'.repeat(50));

    try {
        // Step 1: Análisis del contexto
        console.log('\n📊 Step 1: Analizando contexto...');
        let dayOfWeek = cliArgs.day || CalendarLogic.getCurrentDay();
        let strategy;

        if (cliArgs.niche) {
            console.log(`   🎯 Generando para nicho: ${cliArgs.niche}`);
            strategy = CalendarLogic.getNicheStrategy(cliArgs.niche);
            // Si es un nicho, usamos su día recomendado para la programación
            if (strategy.niche_meta && strategy.niche_meta.recommended_day) {
                dayOfWeek = strategy.niche_meta.recommended_day;
                console.log(`   📅 Día programado (nicho): ${dayOfWeek}`);
            }
            // Sobrescribir el tipo para que el generador de imágenes use el prompt correcto
            strategy.image_variation = cliArgs.niche;
        } else {
            console.log(`   📅 Día: ${dayOfWeek}`);
            strategy = CalendarLogic.getStrategyForDay(dayOfWeek);
            strategy.image_variation = strategy.type.toLowerCase();
        }

        console.log(`   Tipo: ${strategy.type}`);
        console.log(`   Tema: ${strategy.theme}`);

        // Step 2: Generación de copy
        console.log('\n✍️  Step 2: Generando copy...');
        const copy = await ContentGenerator.generateCopy(strategy);

        console.log(`   Feed: ${copy.feed.substring(0, 80)}...`);
        console.log(`   Story: ${copy.story}`);
        console.log(`   Hashtags: ${copy.hashtags.join(' ')}`);

        // Step 3: Generación de imágenes
        console.log('\n🎨 Step 3: Generando imágenes...');
        const images = await ImageGenerator.generateImages(strategy, copy);

        console.log(`   Feed: ${images.feed}`);
        console.log(`   Story: ${images.story}`);

        // SINCRONIZAR A ASSETS DE PRODUCCIÓN (Con nombre único para evitar cache)
        const productionAssetsDir = path.join(__dirname, '..', '..', 'assets', 'social-media');
        if (!fs.existsSync(productionAssetsDir)) {
            fs.mkdirSync(productionAssetsDir, { recursive: true });
        }
        const postDest = path.join(productionAssetsDir, `post-${dateStr}.png`);
        fs.copyFileSync(images.feed, postDest);
        console.log(`   🔄 Imagen sincronizada para producción: assets/social-media/post-${dateStr}.png`);

        // AUTO-PUSH A GITHUB
        console.log(`   📤 Sincronizando con GitHub para desplegar en Vercel...`);
        try {
            const { execSync } = require('child_process');
            execSync(`git add .`, { cwd: path.join(__dirname, '..', '..') });
            execSync(`git commit -m "Social content update: ${dateStr} 🚀"`, { cwd: path.join(__dirname, '..', '..') });
            execSync(`git push origin main`, { cwd: path.join(__dirname, '..', '..') });
            console.log(`   ✅ Sincronización con GitHub completada.`);
        } catch (gitError) {
            console.warn(`   ⚠️ Advertencia: Error parcial en git push (puede ser que no haya cambios o red).`);
        }

        // Step 4: Obtener URL fija
        console.log('\n🔗 Step 4: Obteniendo URL de tracking...');
        const shortUrl = await LinkManager.createShortLink(
            CONFIG.baseUrl,
            dayOfWeek,
            strategy.type
        );

        console.log(`   URL: ${shortUrl}`);

        // Step 5: Publicación o guardado
        console.log(`\n📤 Step 5: ${CONFIG.mode === 'assets_only' ? 'Guardando assets' : 'Publicando contenido'}...`);

        const content = {
            date: dateStr,
            day: dayOfWeek,
            type: strategy.type,
            copy: copy,
            images: images,
            shortUrl: shortUrl,
            strategy: strategy
        };

        // SALVAGUARDA: Si el copy tiene [FALLBACK], abortar publicación en Meta
        const isFallback = content.copy.feed.includes('[FALLBACK]') || content.copy.story.includes('[FALLBACK]');
        if (isFallback && (CONFIG.mode === 'draft' || CONFIG.mode === 'publish')) {
            console.error('\n⚠️  ¡ERROR DE CALIDAD! El contenido generado es un [FALLBACK].');
            console.error('   ❌ Abortando publicación en Meta para proteger la marca.');
            console.log('   💡 Consejo: Revisa tu conexión, API KEY o los prompts.');
            process.exit(1);
        }

        let result;

        switch (CONFIG.mode) {
            case 'draft':
                result = await MetaPublisher.publishAsDraft(content);
                console.log(`   ✅ Proceso de borrador finalizado`);
                if (result.instagram.id) console.log(`   📱 Instagram: ${result.instagram.id}`);
                else console.log(`   📱 Instagram: Fallido (${result.instagram.error})`);

                if (result.facebook.id) console.log(`   📘 Facebook: ${result.facebook.id}`);
                else console.log(`   📘 Facebook: Fallido (${result.facebook.error})`);
                break;

            case 'publish':
                result = await MetaPublisher.publishScheduled(content, '18:00');
                console.log(`   ✅ Programado para publicación a las 18:00 CET`);
                console.log(`   📱 Instagram: ${result.instagram.id}`);
                console.log(`   📘 Facebook: ${result.facebook.id}`);
                break;

            case 'assets_only':
                result = await saveAssetsLocally(content, dateStr);
                console.log(`   ✅ Assets guardados en: ${result.path}`);
                break;

            default:
                throw new Error(`Modo desconocido: ${CONFIG.mode}`);
        }

        // Guardar log
        await saveLog(content, result);

        // Resumen final
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n' + '─'.repeat(50));
        console.log(`\n✨ Proceso completado en ${duration}s\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

/**
 * Guarda assets localmente
 */
async function saveAssetsLocally(content, dateStr) {
    const outputPath = path.join(CONFIG.outputDir, dateStr, content.day);

    // Crear directorio si no existe
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    // Guardar JSON con toda la información
    const jsonPath = path.join(outputPath, 'content.json');
    fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2));

    // Copiar imágenes
    const feedImageDest = path.join(outputPath, 'feed.png');
    const storyImageDest = path.join(outputPath, 'story.png');

    fs.copyFileSync(content.images.feed, feedImageDest);
    fs.copyFileSync(content.images.story, storyImageDest);

    // Crear archivo de texto con el copy
    const copyPath = path.join(outputPath, 'copy.txt');
    const copyText = `
FEED POST
─────────
${content.copy.feed}

${content.copy.hashtags.join(' ')}

STORY
─────
${content.copy.story}

SHORT URL
─────────
${content.shortUrl}

ESTRATEGIA
──────────
Tipo: ${content.type}
Tema: ${content.strategy.theme}
CTA: ${content.strategy.cta}
  `.trim();

    fs.writeFileSync(copyPath, copyText);

    return { path: outputPath };
}

/**
 * Guarda log de ejecución
 */
async function saveLog(content, result) {
    const logsPath = CONFIG.logsDir;

    if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath, { recursive: true });
    }

    const logFile = path.join(logsPath, `${content.date}.log`);
    const logEntry = {
        timestamp: new Date().toISOString(),
        date: content.date,
        day: content.day,
        type: content.type,
        mode: CONFIG.mode,
        result: result,
        copy_preview: content.copy.feed.substring(0, 100),
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry, null, 2) + '\n\n');
}

// Ejecutar
main();
