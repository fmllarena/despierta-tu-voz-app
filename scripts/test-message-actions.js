// Regresión: los botones de valoración (👍/👎), guardar (🔖) y eliminar (🗑)
// deben seguir apareciendo y funcionando tras los cambios del chat.
//
// Extrae las funciones reales de main.js y las ejecuta en un DOM real (jsdom).
//
// Uso: node scripts/test-message-actions.js

const fs = require('fs');
const path = require('path');

let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch (_) {
    const alt = process.env.DTV_JSDOM_PATH;
    if (alt) { try { ({ JSDOM } = require(alt)); } catch (_) { } }
}
if (!JSDOM) {
    console.log('⚠️  jsdom no está instalado; test de acciones omitido.');
    process.exit(0);
}

const dom = new JSDOM('<!doctype html><html><body><div id="chatBox"></div></body></html>', {
    runScripts: 'outside-only',
    url: 'https://app.despiertatuvoz.com/index.html'
});
const { window } = dom;
const { document } = window;

/* ── Extraer las funciones reales de main.js ─────────────────────────────── */
// Se normalizan los saltos de línea: el repo usa CRLF en Windows y los
// patrones con `\n` fallarían.
const mainSrc = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');

const bloqueFeedback = mainSrc.match(
    /const SVG_THUMBS_UP = [\s\S]*?function crearBotonesFeedback\([\s\S]*?\n\}\n/
);
const bloqueAcciones = mainSrc.match(
    /function crearAccionesIA\([\s\S]*?\n\}\n/
);

if (!bloqueFeedback || !bloqueAcciones) {
    console.error('❌ No se pudieron extraer las funciones de main.js');
    process.exit(1);
}

// Stubs de las funciones que los handlers referencian.
window.enviarFeedback = (...a) => { window.__ultimoFeedback = a; };
window.guardarRespuestaDesdeChat = (...a) => { window.__ultimoGuardado = a; };
window.eliminarMensaje = (...a) => { window.__ultimoBorrado = a; };
window.regenerarRespuesta = (...a) => { window.__ultimaRegeneracion = a; };
window.DTV_TTS = { toggle: (...a) => { window.__ultimoTts = a; }, stop: () => { } };
window.alertCustom = () => { };
window.state = { supabase: { from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }) } };
window.chatHistory = [];

window.eval(`
    const enviarFeedback = window.enviarFeedback;
    const guardarRespuestaDesdeChat = window.guardarRespuestaDesdeChat;
    const eliminarMensaje = window.eliminarMensaje;
    const regenerarRespuesta = window.regenerarRespuesta;
    const TTS_PLAYER = window.DTV_TTS;
    ${bloqueFeedback[0]}
    ${bloqueAcciones[0]}
    window.__crearBotonesFeedback = crearBotonesFeedback;
    window.__crearAccionesIA = crearAccionesIA;
`);

let passed = 0, failed = 0;
function test(nombre, fn) {
    try { fn(); passed++; console.log(`  ✅ ${nombre}`); }
    catch (e) { failed++; console.error(`  ❌ ${nombre}\n     ${e.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m); }

const crear = window.__crearBotonesFeedback;
const crearAcciones = window.__crearAccionesIA;

console.log('\n👍 Acciones del mensaje (like / guardar / eliminar)\n');

test('un mensaje con id muestra like, dislike, guardar y eliminar', () => {
    const wrap = crear(42, null, '2026-03-01T10:00:00Z');
    const botones = [...wrap.querySelectorAll('button')];

    assert(wrap.classList.contains('feedback-btns'), 'clase del contenedor incorrecta');
    assert(botones.length === 4, `esperaba 4 botones, hay ${botones.length}`);

    const tipos = botones.map(b => b.dataset.tipo).filter(Boolean);
    assert(tipos.includes('like'), 'falta el botón like');
    assert(tipos.includes('dislike'), 'falta el botón dislike');
    assert(wrap.querySelector('.save-msg-btn'), 'falta el botón guardar');
    assert(wrap.querySelector('.trash-btn'), 'falta el botón eliminar');
});

test('el contenedor guarda el id del mensaje para poder votarlo', () => {
    const wrap = crear(77);
    assert(String(wrap.dataset.msgId) === '77', `dataset.msgId=${wrap.dataset.msgId}`);
    const deshabilitados = [...wrap.querySelectorAll('button')].filter(b => b.disabled);
    assert(deshabilitados.length === 0, 'con id los botones deben estar activos');
});

test('sin id los botones quedan pendientes (respuesta en streaming)', () => {
    const wrap = crear(null);
    const botones = [...wrap.querySelectorAll('button')];
    assert(botones.length === 4, 'faltan botones');
    assert(botones.every(b => b.disabled), 'deberían estar deshabilitados');
    assert(botones.every(b => b.classList.contains('pendiente')), 'deberían marcarse como pendientes');
});

test('la reacción guardada se marca como activa', () => {
    const wrap = crear(1, 'like');
    const like = [...wrap.querySelectorAll('button')].find(b => b.dataset.tipo === 'like');
    const dislike = [...wrap.querySelectorAll('button')].find(b => b.dataset.tipo === 'dislike');
    assert(like.classList.contains('activa'), 'like debería estar activo');
    assert(!dislike.classList.contains('activa'), 'dislike no debería estar activo');
});

test('pulsar like llama a enviarFeedback', () => {
    window.__ultimoFeedback = null;
    const wrap = crear(5);
    const like = [...wrap.querySelectorAll('button')].find(b => b.dataset.tipo === 'like');
    like.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert(window.__ultimoFeedback, 'no se llamó a enviarFeedback');
    assert(window.__ultimoFeedback[1] === 'like', `tipo=${window.__ultimoFeedback[1]}`);
});

test('pulsar guardar llama a guardarRespuestaDesdeChat', () => {
    window.__ultimoGuardado = null;
    const wrap = crear(6);
    wrap.querySelector('.save-msg-btn')
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert(window.__ultimoGuardado, 'no se llamó a guardarRespuestaDesdeChat');
});

test('pulsar eliminar llama a eliminarMensaje', () => {
    window.__ultimoBorrado = null;
    const wrap = crear(7);
    wrap.querySelector('.trash-btn')
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert(window.__ultimoBorrado, 'no se llamó a eliminarMensaje');
});

test('la fila de acciones añade Escuchar y Regenerar', () => {
    const cont = document.createElement('div');
    cont.className = 'ia-container';
    const acc = crearAcciones('Texto de respuesta', cont);

    assert(acc.classList.contains('msg-actions'), 'clase incorrecta');
    const etiquetas = [...acc.querySelectorAll('button')].map(b => b.textContent.trim());
    assert(etiquetas.some(t => t.includes('Escuchar')), `falta Escuchar: ${etiquetas}`);
    assert(etiquetas.some(t => t.includes('Regenerar')), `falta Regenerar: ${etiquetas}`);
});

test('Escuchar usa el TTS con el texto del mensaje', () => {
    window.__ultimoTts = null;
    const cont = document.createElement('div');
    cont.className = 'ia-container';
    const msg = document.createElement('div');
    msg.className = 'message ia';
    msg.textContent = 'Respira hondo.';
    cont.appendChild(msg);

    const acc = crearAcciones('Respira hondo.', cont);
    acc.querySelector('button').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert(window.__ultimoTts, 'no se llamó al TTS');
    assert(window.__ultimoTts[0].includes('Respira hondo'), `texto: ${window.__ultimoTts[0]}`);
});

test('Regenerar llama a regenerarRespuesta', () => {
    window.__ultimaRegeneracion = null;
    const cont = document.createElement('div');
    const acc = crearAcciones('x', cont);
    const btn = [...acc.querySelectorAll('button')].find(b => b.textContent.includes('Regenerar'));
    btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert(window.__ultimaRegeneracion, 'no se llamó a regenerarRespuesta');
});

/* ── Layout del modal de Mensajes Guardados ─────────────────────────────── */
console.log('\n🖼️  Layout del modal de Mensajes Guardados\n');

// Se quitan los comentarios CSS: el texto explicativo menciona el valor
// anterior (auto-fill) y falsearía las comprobaciones.
const css = fs.readFileSync(path.join('css/modals.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
const reglaGrid = css.match(/\.saved-messages-grid\s*\{([\s\S]*?)\}/);
const reglaCard = css.match(/\.saved-message-card\s*\{([\s\S]*?)\}/);
const reglaContent = css.match(/\.saved-messages-content\s*\{([\s\S]*?)\}/);

test('el grid es de una sola columna', () => {
    assert(reglaGrid, 'no se encuentra la regla .saved-messages-grid');
    const cuerpo = reglaGrid[1];
    assert(/grid-template-columns:\s*1fr\s*;/.test(cuerpo),
        'debe ser 1fr (una columna)');
    assert(!/auto-fill|auto-fit|minmax\(380px/.test(cuerpo),
        'no debe repartir en varias columnas');
});

test('el grid fuerza un ancho máximo y se centra', () => {
    const cuerpo = reglaGrid[1];
    assert(/max-width:\s*\d+px/.test(cuerpo), 'falta max-width');
    assert(/margin:\s*0\s+auto/.test(cuerpo), 'falta centrado con margin auto');
    assert(/width:\s*100%/.test(cuerpo), 'debería ocupar el 100% del contenedor');
});

test('la tarjeta ocupa todo el ancho de la columna', () => {
    assert(reglaCard, 'no se encuentra .saved-message-card');
    const cuerpo = reglaCard[1];
    assert(/width:\s*100%/.test(cuerpo), 'la tarjeta debe tener width:100%');
    assert(/min-width:\s*0/.test(cuerpo), 'min-width:0 evita desbordes en grid');
});

test('el modal fuerza un ancho fijo en escritorio', () => {
    assert(reglaContent, 'no se encuentra .saved-messages-content');
    const cuerpo = reglaContent[1];
    const m = cuerpo.match(/max-width:\s*(\d+)px/);
    assert(m, 'falta max-width en el modal');
    assert(Number(m[1]) <= 800, `ancho ${m[1]}px demasiado grande para una sola columna`);
});

test('en móvil también es una columna', () => {
    const movil = css.match(/@media\s*\(max-width:\s*640px\)[\s\S]*?\.saved-messages-grid\s*\{([\s\S]*?)\}/);
    if (movil) {
        assert(/grid-template-columns:\s*1fr/.test(movil[1]), 'en móvil debe ser 1fr');
    }
});

/* ── Posición del botón Copiar en los mensajes de la IA ─────────────────── */
console.log('\n📋 Colocación del botón Copiar (IA)\n');

// Se extrae appendMessage completo para verificar la estructura real del DOM.
const bloqueAppend = mainSrc.match(
    /function appendMessage\(text, type, id = null, meta = null\) \{[\s\S]*?\n\}\n/
);

test('appendMessage se puede extraer del código fuente', () => {
    assert(bloqueAppend, 'no se encontró la función appendMessage');
});

if (bloqueAppend) {
    // Stubs de las dependencias que usa appendMessage.
    window.copiarConFormato = () => { };
    window.crearBotonesAccionFinal = () => { };
    window.renderSafeMarkdown = t => String(t);
    window.PRONUNCIATION = null;
    window.userProfile = { nombre: 'Test' };
    // jsdom no implementa scrollIntoView.
    window.Element.prototype.scrollIntoView = function () { };

    window.eval(`
        const copiarConFormato = window.copiarConFormato;
        const crearBotonesAccionFinal = window.crearBotonesAccionFinal;
        const ELEMENTS = { get chatBox() { return document.getElementById('chatBox'); } };
        const renderSafeMarkdown = window.renderSafeMarkdown;
        ${bloqueFeedback[0]}
        ${bloqueAcciones[0]}
        ${bloqueAppend[0]}
        window.__appendMessage = appendMessage;
    `);

    const append = window.__appendMessage;
    const chatBox = document.getElementById('chatBox');

    test('copiar está en la fila de iconos, no suelto en el contenedor', () => {
        chatBox.innerHTML = '';
        const cont = append('Respuesta de prueba', 'ia', 'ia-response-1', { dbId: 99 });

        const copiar = cont.querySelector('.msg-copy-btn');
        assert(!!copiar, 'no se ha creado el botón de copiar');

        // Lo importante: su padre debe ser la fila de iconos.
        assert(copiar.parentElement.classList.contains('feedback-btns'),
            `el padre de copiar es .${copiar.parentElement.className}, debería ser .feedback-btns`);

        // Y NO debe colgar directamente del contenedor (ese era el bug).
        assert(copiar.parentElement !== cont,
            'copiar sigue siendo hijo directo de .ia-container (posición absoluta)');
    });

    test('copiar comparte fila con like, dislike, guardar y borrar', () => {
        chatBox.innerHTML = '';
        const cont = append('Otra respuesta', 'ia', 'ia-response-2', { dbId: 100 });

        const fila = cont.querySelector('.feedback-btns');
        assert(!!fila, 'falta la fila de iconos');

        const tieneLike = !!fila.querySelector('[data-tipo="like"]');
        const tieneDislike = !!fila.querySelector('[data-tipo="dislike"]');
        const tieneGuardar = !!fila.querySelector('.save-msg-btn');
        const tieneBorrar = !!fila.querySelector('.trash-btn');
        const tieneCopiar = !!fila.querySelector('.msg-copy-btn');

        assert(tieneLike && tieneDislike && tieneGuardar && tieneBorrar && tieneCopiar,
            `fila incompleta: like=${tieneLike} dislike=${tieneDislike} guardar=${tieneGuardar} borrar=${tieneBorrar} copiar=${tieneCopiar}`);
    });

    test('Escuchar y Regenerar van en una fila aparte, debajo', () => {
        chatBox.innerHTML = '';
        const cont = append('Respuesta con acciones', 'ia', 'ia-response-3', { dbId: 101 });

        const filas = [...cont.querySelectorAll('.ia-col > div')];
        const idxIconos = filas.findIndex(f => f.classList.contains('feedback-btns'));
        const idxAcciones = filas.findIndex(f => f.classList.contains('msg-actions'));

        assert(idxIconos !== -1, 'no hay fila de iconos');
        assert(idxAcciones !== -1, 'no hay fila de acciones');
        assert(idxIconos < idxAcciones, 'los iconos deben ir ANTES que Escuchar/Regenerar');
    });

    test('en el saludo inicial (sin id) copiar sigue existiendo, solo', () => {
        chatBox.innerHTML = '';
        const cont = append('Bienvenido', 'ia', 'msg-bienvenida');

        const copiar = cont.querySelector('.msg-copy-btn');
        assert(!!copiar, 'el saludo debería tener botón copiar');
        assert(copiar.parentElement.classList.contains('feedback-btns'),
            'copiar debería ir en su propia fila de iconos');
    });

    test('el mensaje del usuario conserva su copiar anclado', () => {
        chatBox.innerHTML = '';
        const cont = append('Mi mensaje', 'user', 'msg-user-1', { dbId: 5 });
        const copiar = cont.querySelector('.copy-msg-btn');
        assert(!!copiar, 'el mensaje del usuario debería tener .copy-msg-btn');
        assert(copiar.parentElement.classList.contains('message'),
            'el copiar del usuario debe seguir dentro de la burbuja');
    });
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
process.exit(failed === 0 ? 0 : 1);
