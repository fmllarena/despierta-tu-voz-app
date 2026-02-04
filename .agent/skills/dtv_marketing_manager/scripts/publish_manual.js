/**
 * Publicador manual para procesar todos los días de una carpeta de salida
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MetaPublisher = require('./meta_publisher.js');

async function main() {
    const dateStr = '2026-02-02';
    const outputBaseDir = path.join(__dirname, '..', 'output', dateStr);

    if (!fs.existsSync(outputBaseDir)) {
        console.error('No se encontró el directorio de salida para', dateStr);
        return;
    }

    const days = fs.readdirSync(outputBaseDir);
    console.log(`🚀 Iniciando publicación manual para ${days.length} días...\n`);

    for (const day of days) {
        const contentPath = path.join(outputBaseDir, day, 'content.json');
        if (!fs.existsSync(contentPath)) continue;

        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        console.log(`📤 Publicando: ${day.toUpperCase()} (${content.type || 'Contenido'})`);

        try {
            const result = await MetaPublisher.publishAsDraft(content);
            console.log(`   ✅ Resultado ${day}:`, result.facebook.id ? 'Facebook OK' : 'Facebook Falló');
        } catch (error) {
            console.error(`   ❌ Error en ${day}:`, error.message);
        }
        console.log('─'.repeat(30));
    }

    console.log('\n✨ Proceso de publicación manual finalizado.');
}

main();
