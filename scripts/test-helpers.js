// Utilidades compartidas para pruebas de UI con jsdom.
// Permite cargar archivos HTML, ejecutar su <script type="module"> y mockea Supabase
// para que no haga llamadas de red reales.

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

let dom = null;
let window = null;
let document = null;

// Guarda las funciones originales para restaurarlas después
const originales = {
    fetch: global.fetch,
    createClient: null,
};

/**
 * Carga un archivo HTML en jsdom y devuelve { dom, window, document }.
 * @param {string} rutaArchivoHtml - Ruta relativa desde la raíz del proyecto.
 */
function cargarHTML(rutaArchivoHtml) {
    const html = fs.readFileSync(path.resolve(rutaArchivoHtml), 'utf8');
    dom = new JSDOM(html, {
        url: 'http://localhost/',
        pretendToBeVisual: true,
        runScripts: 'dangerously',
        resources: 'usable',
    });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
    return { dom, window, document };
}

/**
 * Mockee createClient de Supabase para que devuelva un cliente falso.
 * Devuelve un objeto con métodos para configurar respuestas de from().select(), etc.
 */
function mockeaSupabase() {
    const solicitudes = [];
    let modoOffline = false;

    const clienteFalso = {
        auth: {
            signInWithPassword: async () => ({ data: { session: { access_token: 'token-falso' } }, error: null }),
            signOut: async () => ({ error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: { id: 'usuario-falso', email: 'test@test.com' } }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: (tabla) => {
            solicitudes.push({ tabla, metodo: 'from', args: Array.from(arguments) });
            return {
                select: (columnas = '*') => {
                    solicitudes.push({ tabla, metodo: 'select', columnas });
                    return {
                        eq: (col, val) => {
                            solicitudes.push({ tabla, metodo: 'eq', col, val });
                            return {
                                order: () => ({ data: [], error: null }),
                                limit: () => ({ data: [], error: null }),
                                maybeSingle: () => ({ data: null, error: null }),
                                single: () => ({ data: null, error: null }),
                            };
                        },
                        not: () => ({ order: () => ({ data: [], error: null }) }),
                        neq: () => ({ order: () => ({ data: [], error: null }) }),
                        order: () => ({ data: [], error: null }),
                        limit: () => ({ data: [], error: null }),
                        maybeSingle: () => ({ data: null, error: null }),
                        gte: () => ({ order: () => ({ data: [], error: null }) }),
                        lte: () => ({ order: () => ({ data: [], error: null }) }),
                        insert: (payload) => {
                            solicitudes.push({ tabla, metodo: 'insert', payload });
                            return { select: () => ({ maybeSingle: () => ({ data: { id: 'msg-falso' }, error: null }) }) };
                        },
                        update: (payload) => {
                            solicitudes.push({ tabla, metodo: 'update', payload });
                            return { eq: () => ({ error: null }) };
                        },
                        delete: () => ({ eq: () => ({ error: null }) }),
                    };
                },
                rpc: () => ({ data: [], error: null }),
            };
        },
    };

    originales.createClient = global.createClient;
    global.createClient = () => clienteFalso;

    return {
        solicitudes,
        setModoOffline: (v) => { modoOffline = v; },
        restaurar: () => {
            if (originales.createClient) global.createClient = originales.createClient;
        },
    };
}

function restaurarOriginales() {
    if (originales.fetch) global.fetch = originales.fetch;
}

module.exports = { cargarHTML, mockeaSupabase, restaurarOriginales };
