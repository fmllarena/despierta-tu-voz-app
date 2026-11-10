/**
 * DTV Data Export Module
 * Derecho de portabilidad (RGPD art. 20): el usuario descarga una copia
 * completa de sus datos en JSON.
 *
 * Se hace en el cliente, con la sesión del propio usuario, así que las
 * políticas RLS garantizan que solo se leen SUS filas. No requiere desplegar
 * ninguna función nueva (el plan Hobby de Vercel está en 12/12).
 *
 * Si alguna tabla falla (RLS, tabla inexistente…), el resto se exporta igual
 * y el error queda anotado en `avisos` para que el usuario lo sepa.
 */

import { state } from './state.js';

// columnas por las que filtrar al propietario de los datos
const FUENTES = [
    { clave: 'perfil',              tabla: 'user_profiles',      columna: 'user_id',   orden: 'created_at' },
    { clave: 'conversaciones',      tabla: 'conversaciones',     columna: 'alumno',    orden: 'created_at' },
    { clave: 'mensajes',            tabla: 'mensajes',           columna: 'alumno',    orden: 'created_at' },
    { clave: 'progreso_coaching',   tabla: 'user_coaching_data', columna: 'user_id' },
    { clave: 'mensajes_guardados',  tabla: 'mensajes_guardados', columna: 'alumno_id', orden: 'creada_en' }
];

export const DATOS = window.DATOS = {
    _descargando: false,

    /** Descarga un JSON con todos los datos del usuario autenticado. */
    async descargar() {
        if (this._descargando) return;
        this._descargando = true;
        this._estado('Preparando tu copia de datos…');

        try {
            const supabase = state.supabase;
            if (!supabase) {
                this._estado('La conexión todavía no está lista. Recarga la página.', true);
                return;
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                this._estado('Debes iniciar sesión para descargar tus datos.', true);
                return;
            }

            const documento = {
                exportado_en: new Date().toISOString(),
                aplicacion: 'Despierta tu Voz',
                formato: 1,
                titular: {
                    id: user.id,
                    email: user.email,
                    cuenta_creada_en: user.created_at,
                    ultimo_acceso: user.last_sign_in_at || null
                },
                aviso:
                    'Copia de tus datos personales. Los mensajes con emisor ' +
                    '"resumen_diario" o "sistema" son resúmenes internos generados ' +
                    'a partir de tus conversaciones para dar continuidad al mentor.',
                contenido: {},
                totales: {},
                avisos: []
            };

            for (const fuente of FUENTES) {
                try {
                    let consulta = supabase
                        .from(fuente.tabla)
                        .select('*')
                        .eq(fuente.columna, user.id);

                    if (fuente.orden) {
                        consulta = consulta.order(fuente.orden, { ascending: true });
                    }

                    const { data, error } = await consulta;

                    if (error) throw error;

                    const filas = data || [];
                    documento.contenido[fuente.clave] = filas;
                    documento.totales[fuente.clave] = filas.length;
                } catch (e) {
                    documento.contenido[fuente.clave] = [];
                    documento.totales[fuente.clave] = 0;
                    documento.avisos.push(
                        `No se pudo incluir "${fuente.clave}": ${e?.message || 'error desconocido'}`
                    );
                    console.warn(`[Datos] Fallo exportando ${fuente.tabla}:`, e?.message || e);
                }
            }

            this._descargarJSON(documento);

            const totalRegistros = Object.values(documento.totales)
                .reduce((a, b) => a + b, 0);

            this._estado(
                documento.avisos.length
                    ? `Descarga lista (${totalRegistros} registros). Algunas secciones fallaron.`
                    : `Descarga lista: ${totalRegistros} registros.`
            );

            // Si faltó algo, se avisa también en consola para soporte.
            if (documento.avisos.length) {
                console.warn('[Datos] Secciones incompletas:', documento.avisos);
            }
        } catch (e) {
            console.error('[Datos] Error al exportar:', e);
            this._estado('No se pudo preparar la descarga. Inténtalo de nuevo.', true);
        } finally {
            this._descargando = false;
        }
    },

    _descargarJSON(documento) {
        const json = JSON.stringify(documento, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const fecha = new Date().toISOString().split('T')[0];
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `mis-datos-despierta-tu-voz-${fecha}.json`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);

        // Dar tiempo al navegador antes de liberar el objeto.
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        return enlace.download;
    },

    /** Muestra el estado junto al botón (o usa el aviso de la app). */
    _estado(texto, esError = false) {
        const el = document.getElementById('downloadDataStatus');
        if (el) {
            el.textContent = texto;
            el.style.display = 'block';
            // El color se decide en CSS (claro/oscuro); aquí solo el estado.
            el.classList.toggle('is-error', !!esError);
            el.classList.toggle('is-ok', !esError);
            if (!esError) {
                setTimeout(() => { el.style.display = 'none'; }, 6000);
            }
            return;
        }
        if (window.alertCustom) window.alertCustom(texto);
        else if (esError) console.error(texto);
    },

    setup() {
        if (this._setupHecho) return;
        this._setupHecho = true;

        document.getElementById('downloadMyDataBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.descargar();
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DATOS.setup());
} else {
    DATOS.setup();
}
