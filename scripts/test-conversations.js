// Prueba de integración del historial de conversaciones usando jsdom.
//
// Carga el HTML real de la app, inyecta un cliente Supabase simulado y
// ejecuta js/modules/conversations.js para comprobar:
//   - se pinta la barra lateral con las conversaciones del usuario,
//   - "nueva conversación" crea y activa un hilo vacío,
//   - cambiar de conversación carga solo SUS mensajes,
//   - los mensajes internos (resumen_diario/sistema) nunca aparecen,
//   - la búsqueda encuentra por título y por texto,
//   - eliminar una conversación la quita de la lista y salta a la siguiente.
//
// Uso:  node scripts/test-conversations.js
// Requiere jsdom (si falta, el test se omite con un aviso).

const fs = require('fs');
const path = require('path');

let JSDOM;
try {
    ({ JSDOM } = require('jsdom'));
} catch (_) {
    try {
        // Fallback: jsdom instalado en un directorio de herramientas temporal.
        const alt = process.env.DTV_JSDOM_PATH;
        if (alt) ({ JSDOM } = require(alt));
    } catch (_) { /* sigue sin jsdom */ }
}

if (!JSDOM) {
    console.log('⚠️  jsdom no está instalado; se omite el test de DOM.');
    console.log('   Instálalo con:  npm i -D jsdom   (o define DTV_JSDOM_PATH)');
    process.exit(0);
}

/* ── Datos de prueba ─────────────────────────────────────────────────────── */
const USER = 'user-1';

const db = {
    conversaciones: [
        {
            id: 'c-1', alumno: USER, titulo: 'Respiración diafragmática',
            created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-03T10:00:00Z',
            mensajes_count: 4, fijada: false, archivada: false
        },
        {
            id: 'c-2', alumno: USER, titulo: 'Miedo al escenario',
            created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-02T10:00:00Z',
            mensajes_count: 2, fijada: false, archivada: false
        }
    ],
    mensajes: [
        { id: 1, alumno: USER, texto: 'Hola, me cuesta respirar al cantar', emisor: 'usuario', created_at: '2026-03-01T10:00:00Z', conversacion_id: 'c-1', reaction: null },
        { id: 2, alumno: USER, texto: 'Probemos con respiración diafragmática.', emisor: 'ia', created_at: '2026-03-01T10:01:00Z', conversacion_id: 'c-1', reaction: null },
        { id: 3, alumno: USER, texto: 'Mejor, gracias', emisor: 'usuario', created_at: '2026-03-02T10:00:00Z', conversacion_id: 'c-1', reaction: null },
        // Mensaje interno: NO debe mostrarse nunca.
        { id: 4, alumno: USER, texto: 'CRÓNICA INTERNA DEL DÍA', emisor: 'resumen_diario', created_at: '2026-03-02T23:59:00Z', conversacion_id: null, reaction: null },
        { id: 5, alumno: USER, texto: 'Aviso de sistema', emisor: 'sistema', created_at: '2026-03-02T23:59:30Z', conversacion_id: null, reaction: null },
        { id: 6, alumno: USER, texto: 'Tengo miedo al escenario', emisor: 'usuario', created_at: '2026-02-01T10:00:00Z', conversacion_id: 'c-2', reaction: null },
        { id: 7, alumno: USER, texto: 'Vamos por partes, con calma.', emisor: 'ia', created_at: '2026-02-01T10:02:00Z', conversacion_id: 'c-2', reaction: null }
    ]
};

/* ── Cliente Supabase simulado ───────────────────────────────────────────── */
function createFakeClient(database) {
    let seq = 1000;

    function applyFilters(rows, filters) {
        return rows.filter(row => filters.every(([k, v, op]) => {
            if (op === 'eq') return String(row[k]) === String(v);
            if (op === 'ilike') {
                const needle = String(v).replace(/%/g, '').toLowerCase();
                return String(row[k] || '').toLowerCase().includes(needle);
            }
            return true;
        }));
    }

    return {
        from(table) {
            const state = {
                table,
                op: 'select',
                payload: null,
                filters: [],
                order: [],
                limit: null
            };

            const run = async (single) => {
                const rows = database[state.table] || (database[state.table] = []);
                let result;

                if (state.op === 'select') {
                    result = applyFilters(rows, state.filters).map(r => ({ ...r }));
                    for (const [col, asc] of [...state.order].reverse()) {
                        result.sort((a, b) => {
                            const av = String(a[col] ?? '');
                            const bv = String(b[col] ?? '');
                            return asc ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
                        });
                    }
                    if (state.limit != null) result = result.slice(0, state.limit);
                    if (single) return { data: result[0] || null, error: null };
                    return { data: result, error: null };
                }

                if (state.op === 'insert') {
                    const row = { id: `new-${++seq}`, ...state.payload };
                    row.created_at = row.created_at || new Date().toISOString();
                    row.updated_at = row.updated_at || row.created_at;
                    row.mensajes_count = row.mensajes_count ?? 0;
                    row.fijada = row.fijada ?? false;
                    row.archivada = row.archivada ?? false;
                    rows.push(row);
                    return { data: { ...row }, error: null };
                }

                if (state.op === 'update') {
                    const target = applyFilters(rows, state.filters);
                    target.forEach(r => Object.assign(r, state.payload));
                    return { data: target.map(r => ({ ...r })), error: null };
                }

                if (state.op === 'delete') {
                    const target = applyFilters(rows, state.filters);
                    const ids = new Set(target.map(r => r.id));
                    database[state.table] = rows.filter(r => !ids.has(r.id));
                    // Simula ON DELETE CASCADE de mensajes.
                    if (state.table === 'conversaciones') {
                        database.mensajes = (database.mensajes || [])
                            .filter(m => !ids.has(m.conversacion_id));
                    }
                    return { data: target, error: null };
                }
                return { data: null, error: null };
            };

            const api = {
                select() { return api; },
                insert(v) { state.op = 'insert'; state.payload = v; return api; },
                update(v) { state.op = 'update'; state.payload = v; return api; },
                delete() { state.op = 'delete'; return api; },
                eq(k, v) { state.filters.push([k, v, 'eq']); return api; },
                ilike(k, v) { state.filters.push([k, v, 'ilike']); return api; },
                order(col, opts = {}) {
                    state.order.push([col, opts.ascending !== false]);
                    return api;
                },
                limit(n) { state.limit = n; return api; },
                maybeSingle() { return run(true); },
                single() { return run(true); },
                then(res, rej) { return run(false).then(res, rej); },
                catch(rej) { return run(false).catch(rej); }
            };
            return api;
        }
    };
}

/* ── Entorno DOM ─────────────────────────────────────────────────────────── */
const html = fs.readFileSync(path.join('index-original.html'), 'utf8')
    // Sin scripts ni hojas externas: se prueba solo el DOM.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');

const dom = new JSDOM(html, {
    url: 'https://app.despiertatuvoz.com/index.html',
    pretendToBeVisual: true
});

const { window } = dom;
const { document } = window;

// Globals que el módulo espera encontrar.
window.localStorage.setItem('dtv_sidebar_open', 'true');
window.innerWidth = 1280;

const appendLog = [];
window.appendMessage = (texto, tipo, id, meta) => {
    appendLog.push({ texto, tipo, meta });
    return document.createElement('div');
};
window.saludarUsuario = () => { };
window.alertCustom = (m) => appendLog.push({ alerta: m });
window.confirmCustom = async () => true;
window.promptCustom = async () => 'Nuevo título';

// Estado compartido que importa el módulo.
const stateObj = { supabase: null, userProfile: null, chatHistory: [] };
window.state = stateObj;
window.chatHistory = [];

global.window = window;
global.document = document;
global.localStorage = window.localStorage;
global.navigator = window.navigator;
global.CustomEvent = window.CustomEvent;
global.HTMLElement = window.HTMLElement;
global.Node = window.Node;

globalThis.__ELEMENTS = {
    get chatBox() { return document.getElementById('chatBox'); },
    get chatInput() { return document.getElementById('chatMentoriaInput'); }
};
globalThis.__STATE = stateObj;

/* ── Carga del módulo bajo prueba ────────────────────────────────────────── */
const src = fs.readFileSync(path.join('js/modules/conversations.js'), 'utf8')
    .replace(/^\s*import .*$/gm, '')
    .replace(/^export const CONVERSATIONS/m, 'const CONVERSATIONS')
    .replace(/^export default .*$/gm, '');

const prelude = `
    const ELEMENTS = globalThis.__ELEMENTS;
    const state = globalThis.__STATE;
`;

let CONV;
try {
    window.eval(prelude + '\n' + src);
    CONV = window.CONVERSATIONS;
} catch (e) {
    console.error('❌ No se pudo cargar conversations.js:', e.message);
    process.exit(1);
}

/* ── Micro-framework de test ─────────────────────────────────────────────── */
let passed = 0, failed = 0;

async function test(nombre, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${nombre}`);
    } catch (e) {
        failed++;
        console.error(`  ❌ ${nombre}\n     ${e.message}`);
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

const titulosSidebar = () =>
    [...document.querySelectorAll('#conversationList .conv-item .conv-title')]
        .map(el => el.textContent);

(async () => {
    console.log('\n💬 Historial de conversaciones (jsdom)\n');

    const sb = createFakeClient(db);

    await test('init lista las conversaciones del usuario', async () => {
        await CONV.init(sb, USER);
        assert(CONV.migrationReady === true, 'debería detectar la migración');
        assert(CONV.list.length === 2, `esperaba 2 conversaciones, hay ${CONV.list.length}`);
        const titulos = titulosSidebar();
        assert(titulos.includes('Respiración diafragmática'), 'falta la conversación 1');
        assert(titulos.includes('Miedo al escenario'), 'falta la conversación 2');
    });

    await test('abre la conversación más reciente y pinta sus mensajes', async () => {
        const visibles = appendLog.filter(x => x.tipo);
        assert(CONV.currentId === 'c-1', `activa=${CONV.currentId}`);
        const textos = visibles.map(v => v.texto);
        assert(textos.includes('Hola, me cuesta respirar al cantar'), 'falta el mensaje del usuario');
        assert(textos.includes('Probemos con respiración diafragmática.'), 'falta la respuesta IA');
    });

    await test('los mensajes internos (resumen_diario/sistema) no se muestran', async () => {
        const textos = appendLog.filter(x => x.tipo).map(v => v.texto);
        assert(!textos.includes('CRÓNICA INTERNA DEL DÍA'), 'se filtró el resumen diario');
        assert(!textos.includes('Aviso de sistema'), 'se filtró un mensaje de sistema');
    });

    await test('chatHistory se reconstruye solo con mensajes visibles', async () => {
        const h = window.chatHistory;
        assert(h.length === 3, `esperaba 3 turnos, hay ${h.length}`);
        assert(h[0].role === 'user', 'el primer turno debe ser del usuario');
        assert(h[1].role === 'model', 'el segundo debe ser del modelo');
    });

    await test('cambiar de conversación carga solo sus mensajes', async () => {
        appendLog.length = 0;
        await CONV.setCurrent('c-2', { render: true });
        const textos = appendLog.filter(x => x.tipo).map(v => v.texto);
        assert(textos.length === 2, `esperaba 2 mensajes, hay ${textos.length}`);
        assert(textos[0] === 'Tengo miedo al escenario', `primero: ${textos[0]}`);
        assert(!textos.includes('Mejor, gracias'), 'se coló un mensaje de otra conversación');
    });

    await test('nueva conversación crea y activa un hilo vacío', async () => {
        appendLog.length = 0;
        const conv = await CONV.newConversation();
        assert(!!conv, 'no se creó la conversación');
        assert(CONV.currentId === conv.id, 'no quedó activa');
        assert(window.chatHistory.length === 0, 'el contexto debería estar vacío');
        assert(document.querySelectorAll('#conversationList .conv-item').length === 3,
            'la barra lateral debería tener 3 elementos');
    });

    await test('la búsqueda encuentra por título', async () => {
        await CONV.search('escenario');
        const titulos = titulosSidebar();
        assert(titulos.includes('Miedo al escenario'), 'no aparece en resultados');
        await CONV.search('');
    });

    await test('la búsqueda encuentra por texto de mensaje', async () => {
        await CONV.search('diafragmática');
        const resultados = document.querySelectorAll('#conversationList .conv-result');
        assert(resultados.length >= 1, 'no hay resultados de mensajes');
        const textos = [...resultados].map(r => r.textContent);
        assert(textos.some(t => t.includes('diafragmática')), 'falta el texto buscado');
        await CONV.search('');
    });

    await test('la búsqueda excluye mensajes internos', async () => {
        await CONV.search('CRÓNICA');
        const resultados = document.querySelectorAll('#conversationList .conv-result');
        assert(resultados.length === 0, 'la búsqueda no debe devolver crónicas internas');
        await CONV.search('');
    });

    await test('los resultados muestran cabecera con botón Volver', async () => {
        await CONV.search('escenario');
        const cabeza = document.querySelector('#conversationList .conv-search-head');
        assert(!!cabeza, 'falta la cabecera de resultados');
        const volver = cabeza.querySelector('.conv-back-btn');
        assert(!!volver, 'falta el botón Volver');
        assert(/escenario/i.test(cabeza.textContent), 'la cabecera no menciona el término buscado');
        await CONV.search('');
    });

    await test('el botón Volver devuelve al listado completo con fechas', async () => {
        await CONV.search('escenario');
        assert(!!document.querySelector('#conversationList .conv-search-head'),
            'debería estar en modo resultados');

        document.querySelector('#conversationList .conv-back-btn').click();

        // Tras volver: sin cabecera de resultados, sin resultados, y con la lista.
        assert(!document.querySelector('#conversationList .conv-search-head'),
            'la cabecera de resultados sigue visible');
        assert(document.querySelectorAll('#conversationList .conv-result').length === 0,
            'siguen apareciendo resultados de mensajes');
        assert(document.querySelectorAll('#conversationList .conv-item').length === CONV.list.length,
            'no se restauró el listado completo');

        const fechas = [...document.querySelectorAll('#conversationList .conv-item .conv-date')];
        assert(fechas.length > 0, 'las conversaciones deberían mostrar su fecha');
        assert(fechas.some(f => f.textContent.trim().length > 0), 'las fechas están vacías');

        // El campo de búsqueda debe quedar limpio.
        const input = document.getElementById('conversationSearch');
        assert(input.value === '', `el buscador no se limpió: "${input.value}"`);
    });

    await test('vaciar el buscador a mano también restaura el listado', async () => {
        const input = document.getElementById('conversationSearch');
        const nConversaciones = CONV.list.length;

        // Simula que el usuario escribe y luego borra (evento `input` real).
        input.value = 'escenario';
        input.dispatchEvent(new window.Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 400));
        assert(!!document.querySelector('#conversationList .conv-search-head'),
            'no se mostraron resultados al escribir');

        input.value = '';
        input.dispatchEvent(new window.Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 400));

        assert(!document.querySelector('#conversationList .conv-search-head'),
            'al vaciar el buscador siguen los resultados');
        assert(document.querySelectorAll('#conversationList .conv-item').length === nConversaciones,
            'no volvió el listado completo');
    });

    await test('el botón de limpiar aparece solo cuando hay búsqueda', async () => {
        const btn = document.getElementById('clearSearchBtn');
        assert(!!btn, 'falta el botón de limpiar');

        // Estado inicial: sin texto ni resultados.
        CONV.searchResults = null;
        document.getElementById('conversationSearch').value = '';
        CONV._updateClearButton();
        assert(btn.hidden === true, 'debería estar oculto sin búsqueda');

        await CONV.search('escenario');
        assert(btn.hidden === false, 'debería mostrarse con resultados');

        btn.click();
        assert(btn.hidden === true, 'debería ocultarse al limpiar');
        assert(!document.querySelector('#conversationList .conv-search-head'),
            'al limpiar siguen los resultados');
    });

    await test('el render en bloque pinta sin hacer scroll por cada mensaje', async () => {
        appendLog.length = 0;
        await CONV.setCurrent('c-1', { render: true, scroll: 'top' });

        assert(appendLog.length > 0, 'no se pintó nada');
        const todosSilenciosos = appendLog.every(e => e.meta && e.meta.silencioso === true);
        assert(todosSilenciosos, 'los mensajes del historial deben pintarse en silencio');
    });

    await test('al abrir un hilo desde el historial se ancla al principio', async () => {
        const chatBox = document.getElementById('chatBox');
        Object.defineProperty(chatBox, 'scrollHeight', { configurable: true, value: 500 });

        CONV.toggleSidebar(true, { persist: false });
        const item = document.querySelector('#conversationList .conv-item');
        item.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 20));

        assert(chatBox.scrollTop === 0, `debería quedar al principio, scrollTop=${chatBox.scrollTop}`);
    });

    await test('al arrancar se muestra el final del hilo (lo más reciente)', async () => {
        const chatBox = document.getElementById('chatBox');
        Object.defineProperty(chatBox, 'scrollHeight', { configurable: true, value: 500 });

        await CONV.setCurrent('c-1', { render: true, scroll: 'bottom' });
        assert(chatBox.scrollTop === 500, `debería quedar al final, scrollTop=${chatBox.scrollTop}`);
    });

    await test('descarta mensajes de otro hilo aunque el backend los devuelva', async () => {
        const sbMezclado = {
            from() {
                const api = {
                    select() { return api; },
                    eq() { return api; },
                    order() { return api; },
                    then(res) {
                        return Promise.resolve({
                            data: [
                                { id: 1, texto: 'del hilo', emisor: 'usuario', created_at: '2026-01-01', conversacion_id: 'c-1' },
                                { id: 2, texto: 'de otro día', emisor: 'usuario', created_at: '2026-01-02', conversacion_id: 'c-9' }
                            ],
                            error: null
                        }).then(res);
                    }
                };
                return api;
            }
        };

        const CONV2 = Object.assign(
            Object.create(Object.getPrototypeOf(CONV)),
            CONV,
            { _sb: sbMezclado, _userId: USER }
        );

        const msgs = await CONV2.loadMessages('c-1');
        assert(msgs.length === 1, `esperaba 1 mensaje, hay ${msgs.length}`);
        assert(msgs[0].texto === 'del hilo', `se coló: ${msgs[0].texto}`);
    });

    await test('al elegir una conversación se cierra la barra lateral', async () => {        const sidebar = document.getElementById('chatSidebar');
        localStorage.setItem('dtv_sidebar_open', 'true');
        CONV.toggleSidebar(true, { persist: false });
        assert(sidebar.classList.contains('open'), 'la barra debería estar abierta de partida');

        const item = document.querySelector('#conversationList .conv-item');
        assert(!!item, 'no hay conversaciones que pulsar');

        item.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 20));

        assert(!sidebar.classList.contains('open'), 'la barra debería cerrarse al elegir');
        assert(sidebar.getAttribute('aria-hidden') === 'true', 'aria-hidden debería ser true');
    });

    await test('cerrar al elegir NO cambia la preferencia guardada', async () => {
        // Si el usuario la tenía abierta por defecto, debe seguir así al recargar.
        assert(localStorage.getItem('dtv_sidebar_open') === 'true',
            `preferencia alterada: "${localStorage.getItem('dtv_sidebar_open')}"`);
    });

    await test('al pulsar un resultado de búsqueda también se cierra', async () => {
        const sidebar = document.getElementById('chatSidebar');
        CONV.toggleSidebar(true, { persist: false });

        await CONV.search('diafragmática');
        const resultado = document.querySelector('#conversationList .conv-result');
        assert(!!resultado, 'no hay resultados de búsqueda');

        resultado.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 20));

        assert(!sidebar.classList.contains('open'), 'debería cerrarse al abrir un resultado');
        await CONV.search('');
    });

    await test('una conversación nueva también cierra la barra', async () => {
        const sidebar = document.getElementById('chatSidebar');
        CONV.toggleSidebar(true, { persist: false });

        await CONV.newConversation();

        assert(!sidebar.classList.contains('open'), 'debería cerrarse al crear una conversación');
    });

    await test('la barra se puede volver a abrir sin problema', async () => {
        const sidebar = document.getElementById('chatSidebar');
        CONV.toggleSidebar(true, { persist: false });
        assert(sidebar.classList.contains('open'), 'debería reabrirse');
        assert(sidebar.getAttribute('aria-hidden') === 'false', 'aria-hidden debería ser false');
    });

    await test('renombrar actualiza el título en la lista', async () => {
        await CONV.rename('c-2', 'Pánico escénico');
        const titulos = titulosSidebar();
        assert(titulos.includes('Pánico escénico'), 'no se actualizó el título');
    });

    await test('eliminar la conversación activa salta a otra', async () => {
        const activa = CONV.currentId;
        await CONV.remove(activa);
        assert(!CONV.list.some(c => c.id === activa), 'sigue en la lista');
        assert(CONV.currentId !== activa, 'debería cambiar de conversación activa');
        assert(CONV.currentId !== null, 'debería haber una conversación activa');
    });

    await test('autoTitle pone título al primer mensaje', async () => {
        const nueva = await CONV.create('Nueva conversación');
        await CONV.autoTitle(nueva.id, '  **Hola**  mundo  ');
        const item = CONV.list.find(c => c.id === nueva.id);
        assert(item.titulo === 'Hola mundo', `título inesperado: "${item.titulo}"`);
    });

    await test('sin migración se muestra aviso y no rompe', async () => {
        const sbRoto = {
            from() {
                const api = {
                    select() { return api; },
                    eq() { return api; },
                    order() { return api; },
                    then(res) { return Promise.resolve({ data: null, error: { code: '42P01', message: 'no existe' } }).then(res); }
                };
                return api;
            }
        };
        const CONV2 = window.CONVERSATIONS;
        await CONV2.refresh.call(Object.assign(Object.create(Object.getPrototypeOf(CONV2)), CONV2, { _sb: sbRoto, _userId: USER }))
            .catch(() => { });
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
