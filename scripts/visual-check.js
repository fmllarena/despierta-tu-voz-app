// Verificación visual y de estilos usando un Chrome ya abierto con depuración
// remota (no lanza ningún navegador).
//
// Uso:
//   1) Abrir Chrome con:
//      chrome.exe --remote-debugging-port=9222 --user-data-dir="%TEMP%\dtv-chrome-debug"
//   2) node scripts/visual-check.js --url http://127.0.0.1:4173/index-original.html \
//         --out temp/visual --selectores "html[data-theme=\"dark\"] .stat-card,..."
//
// Genera capturas (claro y oscuro) y un JSON con los estilos resueltos de los
// selectores indicados, para comparar antes/después de un cambio de CSS.
//
// Requiere puppeteer-core (no descarga navegador):
//   npm i puppeteer-core --no-save
// o definir DTV_PUPPETEER_PATH.

const fs = require('fs');
const path = require('path');

function cargarPuppeteer() {
    const intentos = ['puppeteer-core'];
    if (process.env.DTV_PUPPETEER_PATH) intentos.push(process.env.DTV_PUPPETEER_PATH);
    for (const p of intentos) {
        try { return require(p); } catch (_) { /* siguiente */ }
    }
    return null;
}

const puppeteer = cargarPuppeteer();
if (!puppeteer) {
    console.log('⚠️  puppeteer-core no está instalado; verificación visual omitida.');
    console.log('   Instálalo con: npm i puppeteer-core --no-save');
    process.exit(0);
}

/* ── Argumentos ─────────────────────────────────────────────────────────── */
function arg(nombre, defecto) {
    const i = process.argv.indexOf(`--${nombre}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defecto;
}

const URL_APP = arg('url', 'http://127.0.0.1:4173/index-original.html');
const SALIDA = arg('out', path.join('temp', 'visual'));
const ENDPOINT = arg('cdp', 'http://127.0.0.1:9222');

// Selectores que se quieren comparar antes/después (por defecto, los que se
// van a fusionar en la limpieza de CSS).
const SELECTORES = (arg('selectores', '') || [
    'html[data-theme="dark"] .profile-info',
    'html[data-theme="dark"] .slider-group',
    'html[data-theme="dark"] .help-btn-tag',
    'html[data-theme="dark"] .stat-card',
    'html[data-theme="dark"] .chart-container',
    'html[data-theme="dark"] .sesiones-bar-container',
    'html[data-theme="dark"] .progreso-upgrade',
    'html[data-theme="dark"] .audio-item-stacked',
    'html[data-theme="dark"] .audio-loop-btn',
    'html[data-theme="dark"] .audio-play-btn',
    'html[data-theme="dark"] .music-submenu',
    'html[data-theme="dark"] .help-btn-tag.voice',
    'html[data-theme="dark"] .help-btn-tag.files',
    'html[data-theme="dark"] .help-btn-tag.phonetics',
    'html[data-theme="dark"] .support-messages',
    'html[data-theme="dark"] .loader-premium',
    'html[data-theme="dark"] .upgrade-modal-content',
    'html[data-theme="dark"] .progreso-modal-content',
    'html[data-theme="dark"] .auth-card',
    'html[data-theme="dark"] .modal-content',
    'html[data-theme="dark"] .botiquin-modal-content',
    'html[data-theme="dark"] .legal-modal-content',
    'html[data-theme="dark"] .legal-scroll-area',
    'html[data-theme="dark"] .privacy-notice-box',
    'html[data-theme="dark"] .legal-intro',
    'html[data-theme="dark"] .legal-section h3',
    'html[data-theme="dark"] .check-item'
].join(',')).split(',').map(s => s.trim()).filter(Boolean);

/* ── Captura ────────────────────────────────────────────────────────────── */
(async () => {
    fs.mkdirSync(SALIDA, { recursive: true });

    const browser = await puppeteer.connect({ browserURL: ENDPOINT });
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
        await page.goto(URL_APP, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Los CDN pueden no cargar en este entorno; el CSS es local.
        await new Promise(r => setTimeout(r, 1200));

        const resultados = {};

        for (const tema of ['light', 'dark']) {
            await page.evaluate((t) => {
                if (t === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                // Mostrar el modal legal sin necesitar sesión.
                const modal = document.getElementById('legalModal');
                if (modal) modal.style.display = 'flex';
            }, tema);

            await new Promise(r => setTimeout(r, 300));

            // Captura del modal legal
            const modal = await page.$('#legalModal .legal-modal-content');
            if (modal) {
                await modal.screenshot({ path: path.join(SALIDA, `legal-${tema}.png`) });
            }

            // Captura de la app (sin el modal encima)
            await page.evaluate(() => {
                const m = document.getElementById('legalModal');
                if (m) m.style.display = 'none';
            });
            await page.screenshot({ path: path.join(SALIDA, `app-${tema}.png`) });

            // Estilos resueltos: se leen de las hojas locales (CSSOM).
            resultados[tema] = await page.evaluate((selectores) => {
                const mapa = {};
                const reglas = [];

                for (const hoja of Array.from(document.styleSheets)) {
                    let lista;
                    try { lista = hoja.cssRules; } catch (_) { continue; } // hoja externa
                    for (const r of Array.from(lista)) {
                        if (r.type === 1 && r.selectorText) { // STYLE_RULE
                            reglas.push({ selector: r.selectorText, css: r.style });
                        }
                    }
                }

                for (const sel of selectores) {
                    // Declaraciones efectivas: última que gane para cada propiedad.
                    const props = {};
                    for (const r of reglas) {
                        const partes = r.selector.split(',').map(s => s.trim());
                        if (!partes.includes(sel)) continue;
                        for (let i = 0; i < r.css.length; i++) {
                            const prop = r.css[i];
                            props[prop] = r.css.getPropertyValue(prop);
                        }
                    }
                    mapa[sel] = props;
                }
                return mapa;
            }, SELECTORES);

            // Restaurar el modal para la siguiente vuelta
            await page.evaluate(() => {
                const m = document.getElementById('legalModal');
                if (m) m.style.display = 'flex';
            });
        }

        const destino = path.join(SALIDA, 'estilos.json');
        fs.writeFileSync(destino, JSON.stringify(resultados, null, 2), 'utf8');

        const totalPropiedades = Object.values(resultados.dark)
            .reduce((n, o) => n + Object.keys(o).length, 0);

        console.log(`✅ Capturas en ${SALIDA}`);
        console.log(`   ${SELECTORES.length} selectores, ${totalPropiedades} propiedades registradas`);
        console.log(`   Estilos: ${destino}`);
    } finally {
        await page.close();
        browser.disconnect(); // no cerramos el Chrome del usuario
    }
})().catch(e => {
    console.error('❌ Fallo en la verificación visual:', e.message);
    process.exit(1);
});
