// Pruebas de los campos "Fecha primer mensaje" y "Fecha último mensaje" en perfil-alumno.html
// Verificación estática del HTML y del JavaScript (sin ejecutar módulos ES).

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
    console.log('\n📅 Pruebas de fechas de mensajes en perfil-alumno\n');

    // 1. El HTML contiene los dos campos de fecha
    await test('existen los campos fFechaPrimerMensaje y fFechaUltimoMensaje', () => {
        const { document } = cargarHTML('perfil-alumno.html');
        const f1 = document.getElementById('fFechaPrimerMensaje');
        const f2 = document.getElementById('fFechaUltimoMensaje');
        assertOk(f1, 'falta #fFechaPrimerMensaje');
        assertOk(f2, 'falta #fFechaUltimoMensaje');
        assertOk(f1.textContent === '—', 'fFechaPrimerMensaje no inicia en —');
        assertOk(f2.textContent === '—', 'fFechaUltimoMensaje no inicia en —');
        restaurarOriginales();
    });

    // 2. Los campos tienen etiquetas con los nombres correctos
    await test('las etiquetas tienen los nombres correctos', () => {
        const { document } = cargarHTML('perfil-alumno.html');
        const f1 = document.getElementById('fFechaPrimerMensaje');
        const f2 = document.getElementById('fFechaUltimoMensaje');
        const label1 = f1.previousElementSibling;
        const label2 = f2.previousElementSibling;
        assertOk(label1 && label1.textContent.includes('Fecha primer mensaje'), 'etiqueta primer mensaje incorrecta: ' + (label1 ? label1.textContent : 'nula'));
        assertOk(label2 && label2.textContent.includes('Fecha último mensaje'), 'etiqueta último mensaje incorrecta: ' + (label2 ? label2.textContent : 'nula'));
        restaurarOriginales();
    });

    // 3. El HTML tiene la función formatearFechaMensaje con formato es-ES
    await test('HTML contiene formatearFechaMensaje con toLocaleDateString es-ES', () => {
        const html = fs.readFileSync(path.join(RAIZ, 'perfil-alumno.html'), 'utf8');
        assertOk(html.includes('formatearFechaMensaje'), 'no hay función formatearFechaMensaje');
        assertOk(html.includes("toLocaleDateString('es-ES'"), 'no usa toLocaleDateString con es-ES');
        assertOk(html.includes('day: \'2-digit\''), 'no tiene day: 2-digit');
        assertOk(html.includes('month: \'2-digit\''), 'no tiene month: 2-digit');
        assertOk(html.includes('year: \'numeric\''), 'no tiene year: numeric');
        restaurarOriginales();
    });

    // 4. renderPerfil recibe fechas y actualiza los campos
    await test('renderPerfil acepta fechas y actualiza fFechaPrimerMensaje / fFechaUltimoMensaje', () => {
        const html = fs.readFileSync(path.join(RAIZ, 'perfil-alumno.html'), 'utf8');
        assertOk(html.includes('function renderPerfil(p, fechasMensajes)'), 'renderPerfil no acepta parámetro fechasMensajes');
        assertOk(html.includes('$(\'fFechaPrimerMensaje\').textContent = formatearFechaMensaje(fechasMensajes?.fechaPrimerMensaje)'), 'no actualiza fFechaPrimerMensaje');
        assertOk(html.includes('$(\'fFechaUltimoMensaje\').textContent = formatearFechaMensaje(fechasMensajes?.fechaUltimoMensaje)'), 'no actualiza fFechaUltimoMensaje');
        restaurarOriginales();
    });

    // 5. cargarPerfil llama a cargarFechasMensajes y pasa fechas a renderPerfil
    await test('cargarPerfil consulta fechas y las pasa a renderPerfil', () => {
        const html = fs.readFileSync(path.join(RAIZ, 'perfil-alumno.html'), 'utf8');
        assertOk(html.includes('const fechasMensajes = await cargarFechasMensajes(data.user_id)'), 'no llama a cargarFechasMensajes');
        assertOk(html.includes('renderPerfil(data, fechasMensajes)'), 'no pasa fechas a renderPerfil');
        restaurarOriginales();
    });

    // 6. cargarFechasMensajes consulta tabla mensajes ordenada por created_at
    await test('cargarFechasMensajes consulta tabla mensajes ordenada por created_at', () => {
        const html = fs.readFileSync(path.join(RAIZ, 'perfil-alumno.html'), 'utf8');
        assertOk(html.includes('from(\'mensajes\')') || html.includes('from("mensajes")'), 'no consulta tabla mensajes');
        assertOk(html.includes('.eq(\'alumno\','), 'no filtra por alumno');
        assertOk(html.includes('.order(\'created_at\','), 'no ordena por created_at');
        assertOk(html.includes('.limit(1)'), 'no limita a 1 resultado');
        restaurarOriginales();
    });

    // 7. Se excluyen mensajes internos (resumen_diario, sistema)
    await test('excluye mensajes resumen_diario y sistema', () => {
        const html = fs.readFileSync(path.join(RAIZ, 'perfil-alumno.html'), 'utf8');
        assertOk(html.includes('.neq(\'emisor\', \'resumen_diario\')'), 'no excluye resumen_diario');
        assertOk(html.includes('.neq(\'emisor\', \'sistema\')'), 'no excluye sistema');
        restaurarOriginales();
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
