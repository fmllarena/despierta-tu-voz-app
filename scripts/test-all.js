// Ejecuta toda la batería de pruebas del proyecto (seguridad + chat + PWA).
// Uso: npm test
//
// No todas las suites necesitan las mismas dependencias: las que usan jsdom
// se omiten con un aviso si no está instalado (el resto sigue ejecutándose).

const { spawnSync } = require('child_process');
const path = require('path');

const suites = [
    { nombre: 'Webhooks y monitorización', archivo: 'tests/security.test.js' },
    { nombre: 'Control de acceso de /api/email', archivo: 'tests/email-auth.test.js' },
    { nombre: '/api/config y límite de 12 funciones de Vercel', archivo: 'tests/config.test.js' },
    { nombre: 'Firma de webhooks (bodyParser y cuerpo crudo)', archivo: 'tests/webhooks-config.test.js' },
    { nombre: 'Producto: exportación, estados vacíos y onboarding', archivo: 'tests/product-improvements.test.js' },
    { nombre: 'Historial de conversaciones', archivo: 'scripts/test-conversations.js' },
    { nombre: 'Markdown seguro y texto para TTS', archivo: 'scripts/test-markdown.js' },
    { nombre: 'Accesibilidad', archivo: 'scripts/test-a11y.js' },
    { nombre: 'Like/dislike, guardar y layout del modal', archivo: 'scripts/test-message-actions.js' },
    { nombre: 'Service worker (PWA)', archivo: 'scripts/test-service-worker.js' },
    { nombre: 'Estructura del HTML', archivo: 'scripts/validate-chat-ui.js' },
    { nombre: 'Referencias JS ↔ HTML', archivo: 'scripts/validate-chat-refs.js' }
];

const resultados = [];

for (const s of suites) {
    console.log('\n' + '─'.repeat(64));
    console.log(`▶ ${s.nombre}`);
    console.log('─'.repeat(64));

    const r = spawnSync(process.execPath, [path.join(__dirname, '..', s.archivo)], {
        stdio: 'inherit',
        env: process.env
    });

    resultados.push({
        nombre: s.nombre,
        ok: r.status === 0,
        status: r.status
    });
}

console.log('\n' + '='.repeat(64));
console.log('RESUMEN');
console.log('='.repeat(64));

resultados.forEach(r => {
    console.log(`${r.ok ? '✅' : '❌'} ${r.nombre}`);
});

const fallos = resultados.filter(r => !r.ok);
console.log('='.repeat(64));
console.log(`${resultados.length - fallos.length}/${resultados.length} suites correctas`);

process.exit(fallos.length === 0 ? 0 : 1);
