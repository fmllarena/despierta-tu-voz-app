// Validación estática de index-original.html tras los cambios de chat.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index-original.html', 'utf8');

let errors = [];
let warnings = [];

// ── 1. Balance de etiquetas ────────────────────────────────────────────────
const VOID = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr', '!doctype'
]);

// Se elimina el contenido de <script> y <style> para no confundir el parser.
const sinScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');

const stack = [];
const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)([^>]*?)(\/?)>/g;
let m;
let line = 1;
let lastIndex = 0;

while ((m = tagRe.exec(sinScripts)) !== null) {
    line += (sinScripts.slice(lastIndex, m.index).match(/\n/g) || []).length;
    lastIndex = m.index;

    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const selfClosing = m[4] === '/';

    if (VOID.has(name) || selfClosing) continue;

    if (!closing) {
        stack.push({ name, line });
    } else {
        const top = stack.pop();
        if (!top) {
            errors.push(`L${line}: </${name}> sin apertura`);
        } else if (top.name !== name) {
            errors.push(`L${line}: </${name}> cierra <${top.name}> abierto en L${top.line}`);
        }
    }
}
stack.forEach(t => errors.push(`Etiqueta <${t.name}> sin cerrar (L${t.line})`));

// ── 2. IDs duplicados ─────────────────────────────────────────────────────
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
const vistos = new Set();
ids.forEach(id => {
    if (vistos.has(id)) errors.push(`ID duplicado: ${id}`);
    vistos.add(id);
});

// ── 3. IDs referenciados por JS que deben existir ─────────────────────────
const requeridos = [
    // Sidebar / historial
    'chatSidebar', 'sidebarOverlay', 'sidebarToggleBtn', 'sidebarCloseBtn',
    'newConversationBtn', 'conversationSearch', 'conversationList',
    'exportConversationBtn', 'headerExportBtn',
    // Chat
    'chatBox', 'chatMentoriaInput', 'sendBtn', 'stopBtn', 'micBtn', 'singBtn',
    // Modales existentes
    'diarioModal', 'inspiracionModal', 'upgradeModal', 'authOverlay'
];
requeridos.forEach(id => {
    if (!vistos.has(id)) errors.push(`Falta el id requerido: #${id}`);
});

// ── 4. Recursos y scripts referenciados ───────────────────────────────────
const recursos = [
    ...html.matchAll(/(?:src|href)="((?!https?:|\/\/|data:|#)[^"]+)"/g)
].map(x => x[1]);

recursos.forEach(r => {
    const limpio = r.split('?')[0].replace(/^\//, '');
    if (!limpio) return;
    if (!fs.existsSync(limpio)) {
        warnings.push(`Recurso local no encontrado: ${r}`);
    }
});

// ── 5. Scripts clave presentes y en orden ─────────────────────────────────
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)].map(x => x[1]);
const idxConv = scripts.findIndex(s => s.includes('conversations.js'));
const idxMain = scripts.findIndex(s => s.includes('main.js'));
const idxA11y = scripts.findIndex(s => s.includes('a11y.js'));
const idxPwa = scripts.findIndex(s => s.includes('pwa.js'));

if (idxConv === -1) errors.push('No se carga conversations.js');
if (idxA11y === -1) errors.push('No se carga a11y.js');
if (idxPwa === -1) errors.push('No se carga pwa.js');
if (idxMain === -1) errors.push('No se carga main.js');
if (idxConv > idxMain && idxMain !== -1) errors.push('conversations.js debería cargarse antes de main.js');

const cssChat = html.includes('chat-extras.css');
if (!cssChat) errors.push('No se carga chat-extras.css');

// ── 6. Accesibilidad mínima ───────────────────────────────────────────────
if (!/aria-label="Historial de conversaciones"/.test(html)) {
    errors.push('La barra lateral no tiene aria-label');
}
if (!/id="conversationSearch"[^>]*aria-label=/.test(html) &&
    !/aria-label="Buscar[^"]*"[\s\S]{0,200}id="conversationSearch"/.test(html)) {
    warnings.push('El buscador podría no tener aria-label');
}

if (!html.includes('lang="es"')) errors.push('Falta lang="es"');

// ── 7. PWA ────────────────────────────────────────────────────────────────
if (!fs.existsSync('service-worker.js')) errors.push('Falta service-worker.js');
if (!fs.existsSync('offline.html')) errors.push('Falta offline.html');
if (!fs.existsSync('manifest.json')) errors.push('Falta manifest.json');

console.log('\n=== Validación de index-original.html ===\n');

if (warnings.length) {
    console.log('⚠️  Avisos:');
    warnings.forEach(w => console.log('   - ' + w));
    console.log('');
}

if (errors.length) {
    console.log('❌ Errores:');
    errors.forEach(e => console.log('   - ' + e));
    console.log(`\n${errors.length} error(es)\n`);
    process.exit(1);
}

console.log(`✅ Sin errores. ${ids.length} ids únicos, ${scripts.length} scripts.\n`);
