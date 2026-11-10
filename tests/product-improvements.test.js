// Tests de las mejoras de producto:
//   1. Exportación de datos del usuario (RGPD art. 20).
//   2. Estado vacío de Mi Progreso.
//   3. Estado vacío de Sesiones 1:1.
//   4. Onboarding dosificado (tour esencial).
//
// Uso: node tests/product-improvements.test.js

const fs = require('fs');
const path = require('path');

let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch (_) {
    const alt = process.env.DTV_JSDOM_PATH;
    if (alt) { try { ({ JSDOM } = require(alt)); } catch (_) { } }
}
if (!JSDOM) {
    console.log('⚠️  jsdom no está instalado; test de producto omitido.');
    process.exit(0);
}

/* ── Entorno DOM ─────────────────────────────────────────────────────────── */
const dom = new JSDOM(`<!doctype html><html><body>
    <div id="progresoContent"></div>
    <div id="progresoModal"></div>
    <textarea id="chatMentoriaInput"></textarea>
    <div id="downloadDataStatus"></div>
    <div id="upgradeModal" style="display:none"></div>
    <div id="sesionModal"></div>
    <div id="sessionQuotaInfo"></div>
</body></html>`, {
    runScripts: 'outside-only',
    url: 'https://app.despiertatuvoz.com/index.html'
});

const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;
global.Node = window.Node;
global.Blob = window.Blob;
global.URL = window.URL;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
window.Element.prototype.scrollIntoView = function () { };
// jsdom no implementa la API de object URLs (descarga de blobs).
window.URL.createObjectURL = () => 'blob:mock';
window.URL.revokeObjectURL = () => { };

let passed = 0, failed = 0;
function test(nombre, fn) {
    return Promise.resolve().then(fn)
        .then(() => { passed++; console.log(`  ✅ ${nombre}`); })
        .catch(e => { failed++; console.error(`  ❌ ${nombre}\n     ${e.message}`); });
}
function assert(c, m) { if (!c) throw new Error(m); }

function cargarModulo(ruta, prelude = '') {
    const src = fs.readFileSync(path.join(__dirname, '..', ruta), 'utf8')
        .replace(/^\s*import .*$/gm, '')
        .replace(/^\s*export\s+const\s+/gm, 'const ')
        .replace(/^\s*export\s+default\s+.*$/gm, '');
    window.eval(prelude + '\n' + src);
}

/* ── Cliente Supabase simulado ───────────────────────────────────────────── */
function createFakeClient(datos, fallos = {}) {
    return {
        auth: {
            getUser: async () => ({
                data: {
                    user: {
                        id: 'user-1',
                        email: 'ana@ejemplo.com',
                        created_at: '2026-01-01T00:00:00Z',
                        last_sign_in_at: '2026-03-01T00:00:00Z'
                    }
                },
                error: null
            })
        },
        from(tabla) {
            const st = { filtros: [], orden: null };
            const api = {
                select() { return api; },
                eq(k, v) { st.filtros.push([k, v]); return api; },
                order(col, opts) { st.orden = [col, opts]; return api; },
                then(res, rej) {
                    if (fallos[tabla]) {
                        return Promise.resolve({ data: null, error: { message: fallos[tabla] } }).then(res, rej);
                    }
                    let filas = (datos[tabla] || []).filter(f =>
                        st.filtros.every(([k, v]) => String(f[k]) === String(v))
                    );
                    return Promise.resolve({ data: filas, error: null }).then(res, rej);
                }
            };
            return api;
        }
    };
}

(async () => {
    console.log('\n📦 Exportación de datos (RGPD art. 20)\n');

    const datosUsuario = {
        user_profiles: [{ user_id: 'user-1', email: 'ana@ejemplo.com', subscription_tier: 'pro', accepted_terms: true }],
        conversaciones: [{ id: 'c-1', alumno: 'user-1', titulo: 'Respiración' }],
        mensajes: [
            { id: 1, alumno: 'user-1', emisor: 'usuario', texto: 'Hola' },
            { id: 2, alumno: 'user-1', emisor: 'ia', texto: 'Bienvenida' }
        ],
        user_coaching_data: [{ user_id: 'user-1', proposito_vida: ['cantar'] }],
        mensajes_guardados: []
    };

    // Carga el módulo con un state simulado.
    window.__STATE = {
        supabase: createFakeClient(datosUsuario),
        userProfile: null
    };
    cargarModulo('js/modules/data-export.js', 'const state = globalThis.__STATE;');

    const DATOS = window.DATOS;
    const descargarJSONOriginal = DATOS._descargarJSON;
    let capturado = null;
    DATOS._descargarJSON = (doc) => { capturado = doc; return 'mis-datos.json'; };

    await test('exporta perfil, conversaciones, mensajes y coaching', async () => {
        capturado = null;
        await DATOS.descargar();

        assert(capturado, 'no se generó el documento');
        assert(capturado.titular.email === 'ana@ejemplo.com', 'falta el email del titular');
        assert(capturado.contenido.perfil.length === 1, 'falta el perfil');
        assert(capturado.contenido.mensajes.length === 2, `mensajes: ${capturado.contenido.mensajes.length}`);
        assert(capturado.contenido.conversaciones.length === 1, 'faltan las conversaciones');
        assert(capturado.contenido.progreso_coaching.length === 1, 'falta el coaching');
        assert(capturado.totales.mensajes === 2, 'totales incorrectos');
    });

    await test('incluye todos los emisores, también los resúmenes internos', async () => {
        const mensajes = capturado.contenido.mensajes;
        assert(mensajes.every(m => m.emisor), 'los mensajes deben conservar el emisor');
        assert(/resumen_diario/.test(capturado.aviso), 'el aviso debe explicar los resúmenes internos');
    });

    await test('no incluye filas de otros usuarios', async () => {
        const todosDelTitular = capturado.contenido.mensajes.every(m => m.alumno === 'user-1');
        assert(todosDelTitular, 'se colaron mensajes de otro usuario');
    });

    await test('si una tabla falla, el resto se exporta y se avisa', async () => {
        window.__STATE.supabase = createFakeClient(datosUsuario, {
            mensajes_guardados: 'permission denied for table mensajes_guardados'
        });
        DATOS._descargando = false;
        capturado = null;

        await DATOS.descargar();

        assert(capturado.contenido.mensajes.length === 2, 'los mensajes deberían seguir exportándose');
        assert(capturado.avisos.length === 1, `avisos: ${capturado.avisos.length}`);
        assert(/mensajes_guardados/.test(capturado.avisos[0]), 'el aviso debe nombrar la sección');
    });

    await test('el estado usa clases, no color inline (para adaptarse al tema)', async () => {
        const el = document.getElementById('downloadDataStatus');
        assert(el.classList.contains('is-ok'), `clases: "${el.className}"`);
        const estilo = el.getAttribute('style') || '';
        assert(!/color/i.test(estilo), `no debe fijar color inline: "${estilo}"`);
    });

    await test('sin conexión el estado se marca como error', async () => {
        const sb = window.__STATE.supabase;
        window.__STATE.supabase = null;
        DATOS._descargando = false;

        await DATOS.descargar();

        window.__STATE.supabase = sb;
        const el = document.getElementById('downloadDataStatus');
        assert(el.classList.contains('is-error'), `clases: "${el.className}"`);
        assert(!el.classList.contains('is-ok'), 'no debería quedar marcado como ok');
    });

    await test('el modo oscuro define contraste para texto, botón y estado', () => {
        const css = fs.readFileSync(path.join(__dirname, '../css/chat-extras.css'), 'utf8');

        assert(/html\[data-theme="dark"\]\s+\.account-export-hint/.test(css),
            'falta el color del texto en modo oscuro');
        assert(/html\[data-theme="dark"\]\s+#downloadMyDataBtn/.test(css),
            'falta el estilo del botón en modo oscuro');
        assert(/html\[data-theme="dark"\]\s+#downloadDataStatus\.is-ok/.test(css),
            'falta el estado correcto en modo oscuro');
        assert(/html\[data-theme="dark"\]\s+#downloadDataStatus\.is-error/.test(css),
            'falta el estado de error en modo oscuro');
        assert(/html\[data-theme="dark"\]\s+#downloadMyDataBtn\s*\{[^}]*var\(--color-acento/.test(css),
            'el botón oscuro debería usar el amarillo de acento');
    });

    await test('los colores del modo oscuro superan 4.5:1 de contraste', () => {
        // Contraste WCAG AA para texto normal.
        function luminancia(hex) {
            const c = hex.replace('#', '').match(/../g).map(h => {
                const v = parseInt(h, 16) / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        }
        function ratio(a, b) {
            const l1 = luminancia(a), l2 = luminancia(b);
            const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
            return (hi + 0.05) / (lo + 0.05);
        }

        const fondoOscuro = '#2a2520';   // fondo del modal en modo oscuro
        const casos = [
            ['texto explicativo', '#e8e2d8'],
            ['estado ok', '#9be7a8'],
            ['estado error', '#ff9b8a']
        ];

        casos.forEach(([nombre, color]) => {
            const r = ratio(color, fondoOscuro);
            assert(r >= 4.5, `${nombre}: contraste ${r.toFixed(2)}:1 (mínimo 4.5)`);
        });

        // Texto del botón sobre el amarillo de acento.
        const rBoton = ratio('#1a1a1a', '#d4af37');
        assert(rBoton >= 4.5, `botón: contraste ${rBoton.toFixed(2)}:1`);
    });

    await test('el nombre del fichero incluye la fecha', () => {
        // Se restaura el método real (antes estaba interceptado).
        DATOS._descargarJSON = descargarJSONOriginal;
        const nombre = DATOS._descargarJSON({ a: 1 });
        assert(/^mis-datos-despierta-tu-voz-\d{4}-\d{2}-\d{2}\.json$/.test(nombre),
            `nombre inesperado: ${nombre}`);
    });

    /* ── Mi Progreso ─────────────────────────────────────────────────────── */
    console.log('\n🌱 Estado vacío de Mi Progreso\n');

    cargarModulo('js/modules/progress.js', 'const state = globalThis.__STATE;');
    const PROGRESO = window.PROGRESO;
    window.Chart = function () { return { destroy() { } }; };

    const datosVacios = {
        perfil: { nombre: 'Ana', tier: 'free', tierLabel: 'Explora' },
        mensajes: { total: 0, usuario: 0, ia: 0, porMes: [] },
        viaje: { hitoProgress: 0, modulesCompleted: [], totalModules: 5, journeyCompleted: false },
        sesiones: { tier: 'free', minutesConsumed: 0, minutesAvailable: 0 },
        racha: { daysSinceActive: null, accountAgeDays: 0 }
    };

    await test('sin actividad muestra explicación, no un gráfico vacío', () => {
        const cont = document.getElementById('progresoContent');
        PROGRESO.render(cont, datosVacios);

        assert(cont.querySelector('.progreso-vacio'), 'falta el bloque de estado vacío');
        assert(!cont.querySelector('canvas'), 'no debería pintar el gráfico');
        assert(/Aún no hay progreso/.test(cont.textContent), 'falta el mensaje principal');
    });

    await test('el estado vacío tiene una llamada a la acción que abre el chat', () => {
        const cont = document.getElementById('progresoContent');
        PROGRESO.render(cont, datosVacios);

        const btn = cont.querySelector('#progresoEmpezarBtn');
        assert(btn, 'falta el botón de empezar');

        const modal = document.getElementById('progresoModal');
        modal.style.display = 'flex';
        btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

        assert(modal.style.display === 'none', 'debería cerrar el modal');
        assert(document.activeElement === document.getElementById('chatMentoriaInput'),
            'debería enfocar la caja de chat');
    });

    await test('con actividad sí pinta el gráfico', () => {
        const cont = document.getElementById('progresoContent');
        PROGRESO.render(cont, {
            ...datosVacios,
            mensajes: {
                total: 12, usuario: 6, ia: 6,
                porMes: [{ mes: '2026-01', usuario: 6, ia: 6 }]
            }
        });
        assert(!cont.querySelector('.progreso-vacio'), 'no debería mostrar el estado vacío');
        assert(cont.querySelector('canvas'), 'debería pintar el gráfico');
    });

    await test('sobrevive a una respuesta sin perfil', () => {
        const cont = document.getElementById('progresoContent');
        PROGRESO.render(cont, {});
        assert(/No he podido cargar/.test(cont.textContent), 'debería avisar del fallo');
    });

    /* ── Sesiones ────────────────────────────────────────────────────────── */
    console.log('\n🎟️  Estado vacío de Sesiones 1:1\n');

    function botonStub() {
        return {
            disabled: false,
            innerText: '',
            style: {},
            addEventListener() { },
            removeEventListener() { }
        };
    }

    window.ELEMENTS = {
        sessionQuotaInfo: document.getElementById('sessionQuotaInfo'),
        sesionModal: document.getElementById('sesionModal'),
        upgradeModal: document.getElementById('upgradeModal'),
        book30Btn: botonStub(),
        book60Btn: botonStub(),
        buyExtra30Btn: botonStub(),
        buyExtra60Btn: botonStub(),
        closeSesion: botonStub()
    };
    window.userProfile = { subscription_tier: 'pro', sessions_minutes_consumed: 0 };

    const srcSesiones = fs.readFileSync(path.join(__dirname, '../js/modules/sessions.js'), 'utf8');
    window.eval(srcSesiones);

    await test('un plan sin sesiones explica qué son, no solo que no las tiene', () => {
        window.SESIONES.actualizarInfoCuota();
        const info = document.getElementById('sessionQuotaInfo');
        assert(/Transforma/.test(info.textContent), 'debe mencionar el plan que las incluye');
        assert(/hora al mes/i.test(info.textContent), 'debe explicar qué incluyen');
    });

    await test('ofrece un botón para ver el plan y abre el modal de planes', () => {
        const info = document.getElementById('sessionQuotaInfo');
        const cta = info.querySelector('[data-abrir-upgrade]');
        assert(cta, 'falta el botón de ver el plan');

        document.getElementById('upgradeModal').style.display = 'none';
        document.getElementById('sesionModal').style.display = 'flex';
        cta.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

        assert(document.getElementById('upgradeModal').style.display === 'flex',
            'debería abrir el modal de planes');
        assert(document.getElementById('sesionModal').style.display === 'none',
            'debería cerrar el modal de sesiones');
    });

    /* ── Tour ────────────────────────────────────────────────────────────── */
    console.log('\n🧭 Onboarding dosificado\n');

    cargarModulo('js/modules/tour.js');
    const TOUR = window.TOUR;

    await test('el tour baja de 16 a 6 pasos', () => {
        assert(TOUR.steps.length === 6, `pasos: ${TOUR.steps.length}`);
    });

    await test('arranca en el chat, que es la acción que importa', () => {
        assert(TOUR.steps[0].target === null, 'el primer paso debe ser la bienvenida');
        assert(TOUR.steps[1].target === '#chatMentoriaInput', `segundo paso: ${TOUR.steps[1].target}`);
    });

    await test('no señala funciones exclusivas de pago', () => {
        const targets = TOUR.steps.map(s => s.target).filter(Boolean);
        ['#sesionBtn', '#upgradeBtn', '#savedMessagesBtn'].forEach(t => {
            assert(!targets.includes(t), `no debería mostrar funciones de pago: ${t}`);
        });
    });

    await test('termina remitiendo a la guía completa', () => {
        const ultimo = TOUR.steps[TOUR.steps.length - 1];
        assert(ultimo.target === '#mainHelpBtn', `último paso: ${ultimo.target}`);
    });

    await test('todos los pasos tienen título y texto', () => {
        TOUR.steps.forEach((s, i) => {
            assert(s.title && s.title.length > 0, `paso ${i} sin título`);
            assert(s.text && s.text.length > 0, `paso ${i} sin texto`);
        });
    });

    /* ── Modal legal en modo oscuro ──────────────────────────────────────── */
    console.log('\n⚖️  Modal "Compromiso y Privacidad" en modo oscuro\n');

    await test('define contraste para el modal legal en modo oscuro', () => {
        // Algunas reglas viven ahora en style.css (se consolidaron allí).
        const css = fs.readFileSync(path.join(__dirname, '../css/chat-extras.css'), 'utf8') +
            fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

        const selectores = [
            '.legal-modal-content',
            '.legal-intro',
            '.legal-section h3',
            '.legal-section p',
            '.legal-scroll-area',
            '.privacy-notice-box',
            '.check-item'
        ];

        selectores.forEach(sel => {
            const re = new RegExp(`html\\[data-theme="dark"\\]\\s+\\${sel}[^{]*\\{`);
            assert(re.test(css), `falta el estilo oscuro de ${sel}`);
        });
    });

    await test('todos los modales comparten una única superficie en oscuro', () => {
        const style = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

        assert(/--card-bg:\s*#2a2520/.test(style),
            'la superficie común (--card-bg) debería ser #2a2520 en modo oscuro');

        assert(/html\[data-theme="dark"\]\s+\.modal-content\s*\{[^}]*var\(--card-bg\)/.test(style),
            '.modal-content debería usar var(--card-bg)');

        // Ningún *modal-content debe fijar un fondo literal propio.
        const conFondoPropio = [...style.matchAll(/html\[data-theme="dark"\]\s+\.([\w-]*modal-content[\w-]*)\s*\{([^}]*)\}/g)]
            .filter(m => /background:\s*#/.test(m[2]))
            .map(m => m[1]);

        assert(conFondoPropio.length === 0,
            `modales con fondo propio (deberían usar la variable): ${conFondoPropio.join(', ')}`);
    });

    await test('las reglas consolidadas no se repiten en chat-extras', () => {
        const extras = fs.readFileSync(path.join(__dirname, '../css/chat-extras.css'), 'utf8');

        assert(!/html\[data-theme="dark"\]\s+\.legal-scroll-area\s*\{/.test(extras),
            '.legal-scroll-area está duplicado (debe vivir solo en style.css)');
        assert(!/html\[data-theme="dark"\]\s+\.privacy-notice-box\s*\{/.test(extras),
            '.privacy-notice-box está duplicado (debe vivir solo en style.css)');
    });

    await test('los textos del modal legal superan 4.5:1 en modo oscuro', () => {
        function luminancia(hex) {
            const c = hex.replace('#', '').match(/../g).map(h => {
                const v = parseInt(h, 16) / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        }
        function ratio(a, b) {
            const l1 = luminancia(a), l2 = luminancia(b);
            const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
            return (hi + 0.05) / (lo + 0.05);
        }

        const pares = [
            ['párrafos sobre el modal', '#e8e2d8', '#2a2520'],
            ['intro sobre el modal', '#d8cfc4', '#2a2520'],
            ['texto del área de scroll', '#e8e2d8', '#1c1815'],
            ['títulos sobre el scroll', '#d4af37', '#1c1815'],
            ['texto de la nota de privacidad', '#f0ead9', '#332f1c'],
            ['negritas de la nota', '#f7d774', '#332f1c'],
            ['checkboxes', '#e8e2d8', '#2a2520']
        ];

        pares.forEach(([nombre, texto, fondo]) => {
            const r = ratio(texto, fondo);
            assert(r >= 4.5, `${nombre}: ${r.toFixed(2)}:1 (mínimo 4.5)`);
        });
    });

    console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} pasadas, ${failed} fallidas\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
