/**
 * Script para inyectar el copy real (incluyendo multislice stories) en los archivos de salida
 */
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'output', '2026-02-02');
// El archivo está en el root de la app según el comando anterior, lo moveré si es necesario o lo leeré de ahí
const weeklyCopyPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', 'temp', 'weekly_copy.json');

if (!fs.existsSync(weeklyCopyPath)) {
    console.error('No se encontró weekly_copy.json en', weeklyCopyPath);
    process.exit(1);
}

const weeklyCopy = JSON.parse(fs.readFileSync(weeklyCopyPath, 'utf8'));

Object.keys(weeklyCopy).forEach(day => {
    const dayDir = path.join(outputDir, day);
    if (!fs.existsSync(dayDir)) {
        fs.mkdirSync(dayDir, { recursive: true });
    }

    const contentJsonPath = path.join(dayDir, 'content.json');
    const copyTxtPath = path.join(dayDir, 'copy.txt');

    let content = {};
    if (fs.existsSync(contentJsonPath)) {
        content = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));
    } else {
        content = {
            date: "2026-02-02",
            day: day,
            shortUrl: "https://bit.ly/3YVs9MI",
            images: {
                feed: `C:\\Projects\\appDTV\\despierta-tu-voz-app\\.agent\\skills\\dtv_marketing_manager\\temp\\feed_placeholder.png`,
                story: `C:\\Projects\\appDTV\\despierta-tu-voz-app\\.agent\\skills\\dtv_marketing_manager\\temp\\story_placeholder.png`
            }
        };
    }

    content.copy = weeklyCopy[day];
    fs.writeFileSync(contentJsonPath, JSON.stringify(content, null, 2));

    // Generar copy.txt con slices
    let storiesText = '';
    if (content.copy.story_slices) {
        content.copy.story_slices.forEach((slice, idx) => {
            storiesText += `SLICE ${idx + 1}:\nTEXTO: ${slice.text}\nVISUAL: ${slice.visual}\n\n`;
        });
    } else {
        storiesText = content.copy.story || 'N/A';
    }

    const copyText = `
FEED POST
─────────
${content.copy.feed}

${(content.copy.hashtags || []).join(' ')}

STORY SEQUENCE
──────────────
${storiesText}

SHORT URL
─────────
${content.shortUrl}

ESTRATEGIA
──────────
Día: ${day}
  `.trim();

    fs.writeFileSync(copyTxtPath, copyText);
    console.log(`✅ Copy multislice inyectado para: ${day}`);
});
