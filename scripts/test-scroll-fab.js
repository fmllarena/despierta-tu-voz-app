// Pruebas del globo flotante (scroll-fab) en index-original.html
// Verifica que existen los iconos arriba.png y abajo.png y que la lógica los alterna.

const { cargarHTML, mockeaSupabase, restaurarOriginales } = require('./test-helpers');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function test(nombre, fn) {
    return Promise.resolve().then(fn)
        .then(() => { passed++; console.log(`  ✅ ${nombre}`); })
        .catch(e => { failed++; console.error(`  ❌ ${nombre}\n     ${e.message}`); });
}
function assertOk(c, m) { if (!c) throw new Error(m); }

(async () => {
    console.log('\n🎈 Pruebas del globo flotante (scroll-fab)\n');

    // 1. El HTML contiene el botón y los dos spans de iconos
    await test('existen los spans de iconos arriba y abajo', () => {
        const { document } = cargarHTML('index-original.html');
        const abajo = document.querySelector('.scroll-fab-icon-abajo');
        const arriba = document.querySelector('.scroll-fab-icon-arriba');
        assertOk(abajo, 'falta .scroll-fab-icon-abajo');
        assertOk(arriba, 'falta .scroll-fab-icon-arriba');
        assertOk(abajo.dataset.dir === 'abajo', 'abajo no tiene data-dir=abajo');
        assertOk(arriba.dataset.dir === 'arriba', 'arriba no tiene data-dir=arriba');
        restaurarOriginales();
    });

    // 2. Los iconos usan las imágenes PNG correctas en el CSS
    await test('CSS usa assets/abajo.png y assets/arriba.png como máscara', () => {
        const css = fs.readFileSync(path.join(RAIZ, 'css/style.css'), 'utf8');
        assertOk(css.includes("url('../assets/abajo.png')"), 'CSS no referencia assets/abajo.png');
        assertOk(css.includes("url('../assets/arriba.png')"), 'CSS no referencia assets/arriba.png');
        assertOk(css.includes('.scroll-fab-icon-abajo'), 'CSS no define .scroll-fab-icon-abajo');
        assertOk(css.includes('.scroll-fab-icon-arriba'), 'CSS no define .scroll-fab-icon-arriba');
        restaurarOriginales();
    });

    // 3. Ambos PNG existen en assets/
    await test('existen los archivos assets/abajo.png y assets/arriba.png', () => {
        assertOk(fs.existsSync(path.join(RAIZ, 'assets/abajo.png')), 'falta assets/abajo.png');
        assertOk(fs.existsSync(path.join(RAIZ, 'assets/arriba.png')), 'falta assets/arriba.png');
        restaurarOriginales();
    });

    // 4. scroll-fab.js tiene la lógica de alternancia de iconos
    await test('scroll-fab.js tiene la lógica de alternancia de iconos', () => {
        const scrollFab = fs.readFileSync(path.join(RAIZ, 'js/modules/scroll-fab.js'), 'utf8');
        assertOk(scrollFab.includes('fijarIcono') || scrollFab.includes('querySelectorAll(\'.scroll-fab-icon\')'), 'scroll-fab.js no tiene lógica de iconos');
        assertOk(scrollFab.includes('hidden'), 'scroll-fab.js no usa hidden para alternar');
        restaurarOriginales();
    });

    // 5. index-original.html carga el módulo scroll-fab
    await test('index-original.html carga scroll-fab.js', () => {
        const html = fs.readFileSync(path.join(RAIZ, 'index-original.html'), 'utf8');
        assertOk(html.includes('scroll-fab.js'), 'no carga scroll-fab.js');
        restaurarOriginales();
    });

    // 6. Los spans tienen data-dir correcto
    await test('los spans declaran su dirección con data-dir', () => {
        const { document } = cargarHTML('index-original.html');
        const abajo = document.querySelector('.scroll-fab-icon-abajo');
        const arriba = document.querySelector('.scroll-fab-icon-arriba');
        assertOk(abajo.getAttribute('data-dir') === 'abajo', 'abajo data-dir incorrecto');
        assertOk(arriba.getAttribute('data-dir') === 'arriba', 'arriba data-dir incorrecto');
        restaurarOriginales();
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
