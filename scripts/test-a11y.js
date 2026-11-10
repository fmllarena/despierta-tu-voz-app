// Verifica las mejoras de accesibilidad: etiquetas en botones de icono,
// trampa de foco en modales, cierre con Escape y región live.
//
// Uso: node scripts/test-a11y.js

const fs = require('fs');
const path = require('path');

let JSDOM;
try {
    ({ JSDOM } = require('jsdom'));
} catch (_) {
    const alt = process.env.DTV_JSDOM_PATH;
    if (alt) { try { ({ JSDOM } = require(alt)); } catch (_) { } }
}
if (!JSDOM) {
    console.log('⚠️  jsdom no está instalado; test de accesibilidad omitido.');
    process.exit(0);
}

const html = fs.readFileSync('index-original.html', 'utf8')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');

const dom = new JSDOM(html, {
    url: 'https://app.despiertatuvoz.com/index.html',
    pretendToBeVisual: true
});
const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;
global.HTMLElement = window.HTMLElement;
global.Node = window.Node;
global.navigator = window.navigator;
global.MutationObserver = window.MutationObserver;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.localStorage = window.localStorage;
global.CustomEvent = window.CustomEvent;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
window.dtvAnnounce = undefined;

// El módulo usa `document`, `window` y `MutationObserver` globales.
// Se quita la sintaxis ESM conservando las declaraciones.
const src = fs.readFileSync('js/modules/a11y.js', 'utf8')
    .replace(/^\s*export\s+function\s+/gm, 'function ')
    .replace(/^\s*export\s+const\s+/gm, 'const ')
    .replace(/^\s*export\s+default\s+.*$/gm, '');

let passed = 0, failed = 0;
function test(nombre, fn) {
    try { fn(); passed++; console.log(`  ✅ ${nombre}`); }
    catch (e) { failed++; console.error(`  ❌ ${nombre}\n     ${e.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m); }

console.log('\n♿ Accesibilidad\n');

try {
    window.eval(src);
} catch (e) {
    console.error('❌ No se pudo cargar a11y.js:', e.message);
    process.exit(1);
}

// El módulo arranca solo; dar tiempo a los timeouts.
setTimeout(() => {
    test('crea la región live para lectores de pantalla', () => {
        const region = document.getElementById('dtvLiveRegion');
        assert(!!region, 'no existe #dtvLiveRegion');
        assert(region.getAttribute('aria-live') === 'polite', 'aria-live incorrecto');
        assert(region.classList.contains('sr-only'), 'debe ser visualmente oculto');
    });

    test('etiqueta los botones de icono por id', () => {
        const pares = {
            sendBtn: 'Enviar mensaje',
            stopBtn: 'Detener la respuesta',
            micBtn: 'Transcribir voz a texto',
            singBtn: 'Analizar mi canto',
            sidebarToggleBtn: 'Mostrar historial de conversaciones',
            newConversationBtn: 'Nueva conversación'
        };
        for (const [id, esperado] of Object.entries(pares)) {
            const el = document.getElementById(id);
            assert(!!el, `falta #${id}`);
            const label = el.getAttribute('aria-label');
            assert(label === esperado, `#${id}: "${label}" != "${esperado}"`);
        }
    });

    test('el botón de historial declara aria-expanded y aria-controls', () => {
        const btn = document.getElementById('sidebarToggleBtn');
        assert(btn.hasAttribute('aria-expanded'), 'falta aria-expanded');
        assert(btn.getAttribute('aria-controls') === 'chatSidebar', 'aria-controls incorrecto');
    });

    test('la barra lateral declara aria-hidden', () => {
        const sb = document.getElementById('chatSidebar');
        assert(sb.hasAttribute('aria-hidden'), 'falta aria-hidden');
    });

    test('Escape cierra el modal visible', () => {
        const modal = document.getElementById('inspiracionModal');
        // JSDOM no calcula layout: forzamos los rects para simular visibilidad.
        modal.style.display = 'flex';
        modal.getClientRects = () => [{ width: 100, height: 100 }];

        const evt = new window.KeyboardEvent('keydown', {
            key: 'Escape', bubbles: true, cancelable: true
        });
        document.dispatchEvent(evt);

        assert(modal.style.display === 'none', 'el modal sigue visible tras Escape');
    });

    test('Tab atrapa el foco dentro del modal', () => {
        const modal = document.getElementById('inspiracionModal');
        modal.style.display = 'flex';
        modal.getClientRects = () => [{ width: 100, height: 100 }];

        // Dos focos dentro del modal.
        const a = document.createElement('button');
        a.textContent = 'A';
        const b = document.createElement('button');
        b.textContent = 'B';
        modal.querySelector('.modal-content').appendChild(a);
        modal.querySelector('.modal-content').appendChild(b);

        // Simulamos que los elementos son "visibles".
        [a, b].forEach(el => { el.getClientRects = () => [{ width: 10, height: 10 }]; });

        a.focus();
        assert(document.activeElement === a, 'no se pudo enfocar A');

        // Shift+Tab desde el primero debe saltar al último.
        const evt = new window.KeyboardEvent('keydown', {
            key: 'Tab', shiftKey: true, bubbles: true, cancelable: true
        });
        document.dispatchEvent(evt);

        assert(document.activeElement === b,
            `el foco se escapó del modal (activo: ${document.activeElement?.textContent})`);

        modal.style.display = 'none';
    });

    test('anuncia mensajes a la región live', () => {
        const region = document.getElementById('dtvLiveRegion');
        window.dtvAnnounce('Respuesta del mentor lista.');
        // El anuncio se aplica tras un pequeño timeout.
        setTimeout(() => {
            assert(region.textContent.includes('Respuesta lista') ||
                region.textContent.includes('Respuesta del mentor'),
                `región vacía: "${region.textContent}"`);

            console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
            process.exit(failed === 0 ? 0 : 1);
        }, 120);
    });
}, 350);
