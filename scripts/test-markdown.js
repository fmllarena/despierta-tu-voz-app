// Verifica el renderizado de Markdown del chat: tablas, bloques de código,
// enlaces seguros y que NO se pueda inyectar HTML/JS.
//
// Extrae `window.renderSafeMarkdown` del propio index-original.html para
// probar exactamente el código que se sirve en producción.
//
// Uso: node scripts/test-markdown.js
// Requiere: jsdom, marked y dompurify (se omiten si faltan).

const fs = require('fs');
const path = require('path');

function load(nombre) {
    const intentos = [
        nombre,
        process.env.DTV_JSDOM_PATH && path.join(path.dirname(process.env.DTV_JSDOM_PATH), nombre)
    ].filter(Boolean);
    for (const p of intentos) {
        try { return require(p); } catch (_) { /* siguiente */ }
    }
    return null;
}

const jsdomMod = load('jsdom');
const markedMod = load('marked');
const purifyMod = load('dompurify');

if (!jsdomMod || !markedMod || !purifyMod) {
    console.log('⚠️  Faltan dependencias (jsdom/marked/dompurify): test de markdown omitido.');
    process.exit(0);
}

const { JSDOM } = jsdomMod;
const marked = markedMod.marked || markedMod;
const createDOMPurify = purifyMod.default || purifyMod;

// `runScripts: 'outside-only'` habilita window.eval dentro del contexto DOM.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only'
});
const window = dom.window;

window.marked = marked;
window.DOMPurify = createDOMPurify(window);

// Extraer la función real desde el HTML.
const html = fs.readFileSync('index-original.html', 'utf8');
const bloque = html.match(/window\.renderSafeMarkdown\s*=\s*function[\s\S]*?\n\s*\};/);
if (!bloque) {
    console.error('❌ No se encontró renderSafeMarkdown en index-original.html');
    process.exit(1);
}
window.eval(bloque[0]);

const render = window.renderSafeMarkdown;

let passed = 0, failed = 0;
function test(nombre, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${nombre}`);
    } catch (e) {
        failed++;
        console.error(`  ❌ ${nombre}\n     ${e.message}`);
    }
}
function assert(c, m) { if (!c) throw new Error(m); }

console.log('\n📝 Markdown seguro del chat\n');

test('renderiza texto plano en párrafo', () => {
    const out = render('Hola mundo');
    assert(/<p>Hola mundo<\/p>/.test(out), `salida: ${out}`);
});

test('renderiza negrita y cursiva', () => {
    const out = render('**fuerte** y *suave*');
    assert(out.includes('<strong>fuerte</strong>'), 'sin <strong>');
    assert(out.includes('<em>suave</em>'), 'sin <em>');
});

test('renderiza tablas GFM', () => {
    const md = '| Nota | Estado |\n|---|---|\n| Do4 | bien |\n| Re4 | flojo |';
    const out = render(md);
    assert(out.includes('<table>'), 'sin <table>');
    assert(out.includes('<th>Nota</th>'), 'sin cabecera');
    assert(out.includes('<td>Do4</td>'), 'sin celda');
});

test('renderiza bloques de código con lenguaje', () => {
    const md = '```js\nconst x = 1;\n```';
    const out = render(md);
    assert(out.includes('<pre>'), 'sin <pre>');
    assert(out.includes('<code'), 'sin <code>');
});

test('renderiza código en línea', () => {
    const out = render('Usa `respirar` primero');
    assert(out.includes('<code>respirar</code>'), `salida: ${out}`);
});

test('renderiza listas', () => {
    const out = render('- uno\n- dos');
    assert(out.includes('<ul>'), 'sin <ul>');
    assert(out.includes('<li>uno</li>'), 'sin <li>');
});

test('enlaces externos abren en pestaña nueva con rel seguro', () => {
    const out = render('[Ver](https://ejemplo.com/x)');
    assert(out.includes('href="https://ejemplo.com/x"'), 'falta href');
    assert(/target="_blank"/.test(out), 'falta target=_blank');
    assert(/rel="[^"]*noopener/.test(out), 'falta noopener');
    assert(/rel="[^"]*noreferrer/.test(out), 'falta noreferrer');
});

test('NO ejecuta ni conserva <script>', () => {
    const out = render('<script>alert(1)</script>hola');
    assert(!/<script/i.test(out), `se coló un script: ${out}`);
    assert(!/alert\(1\)/.test(out) || !out.includes('<script'), 'código ejecutable presente');
});

test('NO conserva manejadores de evento inline', () => {
    const out = render('<img src=x onerror="alert(1)">');
    assert(!/onerror/i.test(out), `se coló onerror: ${out}`);
});

test('NO conserva enlaces javascript:', () => {
    const out = render('[pulsa](javascript:alert(1))');
    assert(!/href="\s*javascript:/i.test(out), `enlace peligroso: ${out}`);
});

test('NO permite iframes', () => {
    const out = render('<iframe src="https://evil.com"></iframe>');
    assert(!/<iframe/i.test(out), `se coló un iframe: ${out}`);
});

test('sobrevive a entradas nulas o vacías', () => {
    assert(render(null) === '' || typeof render(null) === 'string', 'null rompe');
    assert(render(undefined) === '' || typeof render(undefined) === 'string', 'undefined rompe');
    assert(render('') === '', 'cadena vacía debe dar cadena vacía');
});

test('no rompe con markdown incompleto', () => {
    assert(typeof render('**sin cerrar') === 'string', 'rompe con negrita sin cerrar');
    assert(typeof render('```\nsin cerrar') === 'string', 'rompe con bloque sin cerrar');
});

// ── markdownToPlain: texto que se envía al TTS ────────────────────────────
// Se extrae la función real de main.js para que el TTS no lea asteriscos.
const mainSrc = fs.readFileSync('main.js', 'utf8');
const bloqueTts = mainSrc.match(/function markdownToPlain\(text\) \{[\s\S]*?\n\}/);
if (bloqueTts) {
    window.eval(bloqueTts[0]);
    const plain = window.markdownToPlain;

    console.log('\n🔊 Texto para el TTS (markdownToPlain)\n');

    test('quita negritas y cursivas', () => {
        const out = plain('Esto es **importante** y *suave*');
        assert(!out.includes('*'), `quedan asteriscos: ${out}`);
        assert(out.includes('importante'), 'se perdió el texto');
    });

    test('quita encabezados y viñetas', () => {
        const out = plain('## Título\n- punto uno\n- punto dos');
        assert(!out.includes('#'), `quedan almohadillas: ${out}`);
        assert(out.includes('punto uno'), 'se perdió el contenido');
    });

    test('convierte enlaces en su texto', () => {
        const out = plain('Mira [este enlace](https://ejemplo.com)');
        assert(out.includes('este enlace'), 'falta el texto del enlace');
        assert(!out.includes('https://'), `quedó la URL: ${out}`);
    });

    test('sustituye bloques de código por una marca hablada', () => {
        const out = plain('```js\nconst x = 1;\n```');
        assert(!out.includes('const x'), 'no debería leer el código');
        assert(out.includes('bloque de código'), `salida: ${out}`);
    });

    test('quita el tag técnico SESION_FINAL y el cursor', () => {
        const out = plain('Adiós [SESION_FINAL] ▮');
        assert(!out.includes('SESION_FINAL'), 'se coló el tag técnico');
        assert(!out.includes('▮'), 'se coló el cursor');
    });

    test('quita etiquetas HTML', () => {
        const out = plain('Hola <strong>mundo</strong>');
        assert(out === 'Hola mundo', `salida: ${out}`);
    });
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
process.exit(failed === 0 ? 0 : 1);
