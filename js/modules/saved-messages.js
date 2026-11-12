// ------------------------------------------------------------
// MÓDULO: Mensajes guardados (estilo "guardar un reel" de Instagram)
// Permite guardar respuestas individuales del Mentor y recuperarlas
// en cualquier sesión desde el modal de la barra superior.
// ------------------------------------------------------------
import { ELEMENTS } from './elements.js';
import { state } from './state.js';
import { alertCustom } from './utils.js';

const TABLA = 'mensajes_guardados';
const ICONO_GUARDAR = 'assets/marcador0.png';

let cacheMensajes = [];

function perfilActual() {
    return state.userProfile || window.userProfile || null;
}

function idAlumno() {
    const perfil = perfilActual();
    return perfil?.user_id || perfil?.id || null;
}

function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    // También escapamos comillas para poder usar el valor en atributos (data-id, etc.)
    return div.innerHTML.replace(/"/g, '&quot;');
}

function formatearFecha(valor) {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
    const dia = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${dia} · ${hora}`;
}

function mostrarToast(mensaje) {
    let toast = document.getElementById('dtvToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dtvToast';
        toast.className = 'dtv-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    toast.classList.add('visible');
    clearTimeout(mostrarToast._timer);
    mostrarToast._timer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

function detalleError(error) {
    const codigo = error?.code;
    const texto = error?.message || '';
    if (codigo === '42P01' || /relation .* does not exist/i.test(texto)) {
        return 'Falta crear la tabla en Supabase. Ejecuta sql/09_create_table_mensajes_guardados.sql.';
    }
    return texto || 'Inténtalo de nuevo.';
}

export const MENSAJES_GUARDADOS = window.MENSAJES_GUARDADOS = {
    _setupHecho: false,

    abrirModal() {
        if (!idAlumno()) {
            alertCustom('Debes iniciar sesión para ver tus mensajes guardados.');
            return;
        }
        const modal = ELEMENTS.savedMessagesModal;
        if (!modal) return;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.cargarMensajesGuardados();
    },

    cerrarModal() {
        const modal = ELEMENTS.savedMessagesModal;
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    async cargarMensajesGuardados() {
        const alumno = idAlumno();
        const contenedor = ELEMENTS.savedMessagesContent;
        if (!contenedor || !alumno) return;

        contenedor.innerHTML = `
            <div class="saved-messages-loading">
                <div class="loader-spin"></div>
                <p>Cargando tus mensajes guardados...</p>
            </div>
        `;

        if (!state.supabase) {
            contenedor.innerHTML = `
                <div class="saved-messages-error">
                    <p>❌ La conexión todavía no está lista.</p>
                    <p class="saved-error-detail">Recarga la página e inténtalo de nuevo.</p>
                </div>
            `;
            return;
        }

        try {
            const { data, error } = await state.supabase
                .from(TABLA)
                .select('*')
                .eq('alumno_id', alumno)
                .order('creada_en', { ascending: false });

            if (error) throw error;

            cacheMensajes = data || [];
            this.renderizarMensajesGuardados(cacheMensajes);
        } catch (e) {
            console.error('Error cargando mensajes guardados:', e);
            contenedor.innerHTML = `
                <div class="saved-messages-error">
                    <p>❌ No he podido cargar tus mensajes guardados.</p>
                    <p class="saved-error-detail">${escapar(detalleError(e))}</p>
                </div>
            `;
        }
    },

    renderizarMensajesGuardados(mensajes) {
        const contenedor = ELEMENTS.savedMessagesContent;
        if (!contenedor) return;

        const contador = document.getElementById('savedMessagesCount');
        if (contador) contador.textContent = mensajes.length ? `(${mensajes.length})` : '';

        if (!mensajes.length) {
            contenedor.innerHTML = `
                <div class="empty-saved-messages">
                    <img src="${ICONO_GUARDAR}" alt="" class="empty-saved-icon">
                    <h3>No tienes mensajes guardados aún</h3>
                    <p>Pulsa el marcador <img src="${ICONO_GUARDAR}" alt="" class="inline-bookmark"> que aparece
                        debajo de cualquier respuesta del Mentor para guardarla y recuperarla cuando quieras.</p>
                </div>
            `;
            return;
        }

        const tarjetas = mensajes.map(msg => {
            const id = escapar(msg.id);
            const pregunta = (msg.pregunta || '').trim();
            const respuesta = msg.respuesta || '';
            const fecha = formatearFecha(msg.fecha || msg.creada_en);

            return `
                <article class="saved-message-card" data-id="${id}">
                    <div class="saved-message-header">
                        <span class="saved-date">📅 ${escapar(fecha)}</span>
                        <div class="saved-card-actions">
                            <button type="button" class="saved-card-btn" data-accion="copiar" data-id="${id}"
                                title="Copiar pregunta y respuesta">📋</button>
                            <button type="button" class="saved-card-btn danger" data-accion="eliminar" data-id="${id}"
                                title="Eliminar este mensaje guardado">🗑</button>
                        </div>
                    </div>
                    <div class="saved-message-content">
                        <div class="saved-question">
                            <span class="saved-label">Pregunta</span>
                            <p>${pregunta ? escapar(pregunta) : '<em>Sin pregunta asociada</em>'}</p>
                        </div>
                        <div class="saved-answer">
                            <span class="saved-label">Respuesta del Mentor</span>
                            <div class="saved-answer-text">${escapar(respuesta)}</div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        contenedor.innerHTML = `
            <div class="saved-messages-grid">${tarjetas}</div>
            <div class="saved-messages-footer">
                <button type="button" class="clear-saved-btn" data-accion="limpiar">🗑 Borrar todo</button>
            </div>
        `;
    },

    /**
     * Guarda una respuesta concreta.
     * @param {{mensajeId: number|string, pregunta?: string, respuesta: string, fecha?: string, etiquetas?: string[]}} datos
     * @returns {Promise<'saved'|'duplicate'|'error'>}
     */
    async guardar({ mensajeId, pregunta = '', respuesta, fecha = null, etiquetas = [] }) {
        const alumno = idAlumno();
        if (!alumno) {
            alertCustom('Debes iniciar sesión para guardar mensajes.');
            return 'error';
        }
        if (!mensajeId || !respuesta) {
            alertCustom('No he podido identificar esta respuesta.');
            return 'error';
        }
        if (!state.supabase) {
            alertCustom('La conexión todavía no está lista. Recarga la página.');
            return 'error';
        }

        try {
            const { error } = await state.supabase
                .from(TABLA)
                .insert({
                    alumno_id: alumno,
                    mensaje_original_id: mensajeId,
                    pregunta: pregunta || '',
                    respuesta,
                    fecha: fecha || new Date().toISOString(),
                    etiquetas
                });

            if (error) {
                if (error.code === '23505') {
                    mostrarToast('Ya tenías guardada esta respuesta');
                    return 'duplicate';
                }
                throw error;
            }

            mostrarToast('Respuesta guardada en tus mensajes');

            if (ELEMENTS.savedMessagesModal?.style.display === 'flex') {
                this.cargarMensajesGuardados();
            }
            return 'saved';
        } catch (e) {
            console.error('Error guardando mensaje:', e);
            alertCustom('No he podido guardar la respuesta: ' + detalleError(e));
            return 'error';
        }
    },

    async copiar(id) {
        const msg = cacheMensajes.find(m => String(m.id) === String(id));
        if (!msg) return;

        const texto = `Pregunta: ${msg.pregunta || '—'}\n\nRespuesta del Mentor:\n${msg.respuesta || ''}`;
        try {
            await navigator.clipboard.writeText(texto);
            mostrarToast('📋 Mensaje copiado');
        } catch {
            const area = document.createElement('textarea');
            area.value = texto;
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            area.remove();
            mostrarToast('📋 Mensaje copiado');
        }
    },

    async eliminar(id) {
        const alumno = idAlumno();
        if (!alumno || !state.supabase) return;

        const confirmado = window.confirmCustom
            ? await window.confirmCustom('¿Eliminar este mensaje guardado? No se puede deshacer.', '🗑 Eliminar mensaje')
            : confirm('¿Eliminar este mensaje guardado?');
        if (!confirmado) return;

        try {
            const { error } = await state.supabase
                .from(TABLA)
                .delete()
                .eq('id', id)
                .eq('alumno_id', alumno);
            if (error) throw error;

            cacheMensajes = cacheMensajes.filter(m => String(m.id) !== String(id));
            this.renderizarMensajesGuardados(cacheMensajes);
            mostrarToast('🗑 Mensaje eliminado');
        } catch (e) {
            console.error('Error eliminando mensaje guardado:', e);
            alertCustom('No he podido eliminar el mensaje: ' + detalleError(e));
        }
    },

    async limpiarTodos() {
        const alumno = idAlumno();
        if (!alumno || !state.supabase) return;

        const confirmado = window.confirmCustom
            ? await window.confirmCustom('¿Borrar TODOS tus mensajes guardados? Esta acción no se puede deshacer.', '🗑 Borrar todo')
            : confirm('¿Borrar TODOS tus mensajes guardados?');
        if (!confirmado) return;

        try {
            const { error } = await state.supabase
                .from(TABLA)
                .delete()
                .eq('alumno_id', alumno);
            if (error) throw error;

            cacheMensajes = [];
            this.renderizarMensajesGuardados([]);
            mostrarToast('🧹 Mensajes guardados eliminados');
        } catch (e) {
            console.error('Error limpiando mensajes guardados:', e);
            alertCustom('No he podido borrar los mensajes: ' + detalleError(e));
        }
    },

    setup() {
        if (this._setupHecho) return;
        this._setupHecho = true;

        ELEMENTS.savedMessagesBtn?.addEventListener('click', () => this.abrirModal());
        ELEMENTS.closeSavedMessages?.addEventListener('click', () => this.cerrarModal());

        ELEMENTS.savedMessagesModal?.addEventListener('click', (e) => {
            if (e.target === ELEMENTS.savedMessagesModal) this.cerrarModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && ELEMENTS.savedMessagesModal?.style.display === 'flex') {
                this.cerrarModal();
            }
        });

        ELEMENTS.savedMessagesContent?.addEventListener('click', (e) => {
            const boton = e.target.closest('[data-accion]');
            if (!boton) return;

            const { accion, id } = boton.dataset;
            if (accion === 'copiar') this.copiar(id);
            else if (accion === 'eliminar') this.eliminar(id);
            else if (accion === 'limpiar') this.limpiarTodos();
        });

        console.log('🔖 Módulo de mensajes guardados listo.');
    }
};
