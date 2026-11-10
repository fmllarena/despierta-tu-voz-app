// Comprueba que cada id usado desde JS existe realmente en el HTML,
// y que las clases clave usadas por el CSS/JS están definidas.

const fs = require('fs');

const html = fs.readFileSync('index-original.html', 'utf8');
const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

const archivos = [
    'main.js',
    'js/modules/conversations.js',
    'js/modules/a11y.js',
    'js/modules/pwa.js'
];

let errores = [];
let okCount = 0;

// ids que se crean dinámicamente en tiempo de ejecución (no están en el HTML)
const DINAMICOS = new Set([
    'dtvLiveRegion', 'dtvUpdateBanner', 'dtvInstallBtn',
    'dtvPromptInput', 'dtvGlobalError', 'msg-thinking', 'ia-response',
    'progresoEmpezarBtn', 'progresoChart'
]);

for (const archivo of archivos) {
    const src = fs.readFileSync(archivo, 'utf8');

    // getElementById('x') y querySelector('#x')
    const patrones = [
        /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g,
        /querySelector\(\s*['"]#([^'"\s]+)['"]\s*\)/g
    ];

    for (const re of patrones) {
        let m;
        while ((m = re.exec(src)) !== null) {
            const id = m[1];
            if (DINAMICOS.has(id)) continue;
            if (id.includes('${') || id.includes('+')) continue;
            if (!htmlIds.has(id)) {
                errores.push(`${archivo}: usa #${id}, que no existe en el HTML`);
            } else {
                okCount++;
            }
        }
    }

    // LABEL_MAP de a11y: las claves deben existir o ser opcionales.
    if (archivo.includes('a11y.js')) {
        const bloque = src.match(/const LABEL_MAP = \{([\s\S]*?)\};/);
        if (bloque) {
            const claves = [...bloque[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map(x => x[1]);
            for (const c of claves) {
                if (!htmlIds.has(c)) {
                    // No es fatal: el código comprueba si el elemento existe.
                    // Pero avisamos de ids que probablemente estén mal escritos.
                    console.log(`   · a11y: "${c}" no está en el HTML (se omite sin error)`);
                }
            }
        }
    }
}

// ── Clases CSS usadas por el JS nuevo ─────────────────────────────────────
const css = fs.readFileSync('css/chat-extras.css', 'utf8');
const clasesNecesarias = [
    'chat-sidebar', 'sidebar-overlay', 'conv-item', 'conv-title', 'conv-date',
    'conv-actions', 'conv-action', 'conv-result', 'conv-group-title', 'conv-empty',
    'msg-actions', 'msg-action-btn', 'msg-error-box', 'msg-error-retry',
    'msg-edit-area', 'msg-edit-actions', 'msg-edit-save', 'msg-edit-cancel',
    'edit-msg-btn', 'sr-only', 'sidebar-toggle-btn', 'header-export-btn'
];

for (const c of clasesNecesarias) {
    if (!css.includes('.' + c)) {
        errores.push(`chat-extras.css no define .${c}`);
    }
}

console.log(`\n=== Referencias cruzadas ===`);
console.log(`ids verificados: ${okCount}`);

if (errores.length) {
    console.log('\n❌ Errores:');
    errores.forEach(e => console.log('   - ' + e));
    process.exit(1);
}
console.log('✅ Todas las referencias existen.\n');
