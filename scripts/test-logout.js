// Pruebas del botón de Cerrar sesión en index-original.html
// Usa jsdom para cargar el HTML y verificar elementos y comportamiento.

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
    console.log('\n🔐 Pruebas de Cerrar sesión (logout)\n');

    // 1. El HTML contiene el botón #logoutBtn
    await test('el botón #logoutBtn existe en el HTML', () => {
        const { window, document } = cargarHTML('index-original.html');
        const btn = document.getElementById('logoutBtn');
        assertOk(btn, 'no se encontró #logoutBtn');
        assertOk(btn.tagName === 'BUTTON', 'no es un botón');
        assertOk(btn.textContent.includes('SALIR'), 'texto no contiene SALIR');
        restaurarOriginales();
    });

    // 2. El botón tiene title o aria-label apropiado
    await test('el botón tiene title de Cerrar sesión / Guardar resumen', () => {
        const { document } = cargarHTML('index-original.html');
        const btn = document.getElementById('logoutBtn');
        const title = btn.getAttribute('title') || '';
        const aria = btn.getAttribute('aria-label') || '';
        assertOk(title.includes('Cerrar') || title.includes('Sesión') || aria.includes('Cerrar') || aria.includes('Sesión'), 'falta título o aria-label de cierre de sesión: title="' + title + '" aria-label="' + aria + '"');
        restaurarOriginales();
    });

    // 3. index-original.html referencia signOut
    await test('index-original.html referencia signOut', () => {
        const html = fs.readFileSync(path.join(RAIZ, 'index-original.html'), 'utf8');
        assertOk(html.includes('signOut'), 'index-original.html no referencia signOut');
        restaurarOriginales();
    });

    // 4. main.js (en la raíz) referencia el botón de logout y location.reload
    await test('main.js referencia el botón de logout y recarga', () => {
        const mainJs = fs.readFileSync(path.join(RAIZ, 'main.js'), 'utf8');
        assertOk(mainJs.includes('logoutBtn') || mainJs.includes('navButtons.logout'), 'main.js no referencia el botón de logout');
        assertOk(mainJs.includes('signOut'), 'main.js no tiene signOut');
        assertOk(mainJs.includes('location.reload'), 'main.js no tiene location.reload');
        restaurarOriginales();
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
