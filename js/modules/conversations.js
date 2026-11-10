/**
 * DTV Conversations Module
 * Historial persistente de conversaciones para el chat.
 *
 * Responsabilidades:
 *  - Listar / crear / renombrar / eliminar conversaciones del usuario.
 *  - Cargar los mensajes de una conversación en el chat.
 *  - Búsqueda de texto en todo el historial.
 *  - Pintar la barra lateral.
 *
 * IMPORTANTE: los mensajes con emisor 'resumen_diario' y 'sistema' son
 * material interno para que la IA recupere contexto. NUNCA se muestran en
 * la interfaz ni se cuentan en la barra lateral.
 */

import { ELEMENTS } from './elements.js';
import { state } from './state.js';

const INTERNAL_SENDERS = ['resumen_diario', 'sistema'];
const SIDEBAR_KEY = 'dtv_sidebar_open';
const ACTIVE_KEY = 'dtv_active_conversation';

export const CONVERSATIONS = window.CONVERSATIONS = {
    ready: false,
    /** false si la migración SQL aún no se ha aplicado. */
    migrationReady: false,
    currentId: null,
    list: [],
    filter: '',
    searchResults: null,
    _sb: null,
    _userId: null,
    _initialized: false,

    async init(supabase, userId) {
        if (!supabase || !userId) return;
        this._sb = supabase;
        this._userId = userId;

        if (!this._initialized) {
            this._initialized = true;
            this._bindUI();
        }

        await this.refresh();
        this.ready = true;

        // Restaurar la conversación activa (o la más reciente).
        const saved = localStorage.getItem(ACTIVE_KEY);
        const target =
            this.list.find(c => c.id === saved) ||
            this.list[0] ||
            null;

        if (target) {
            await this.setCurrent(target.id, { render: true });
        } else {
            this.currentId = null;
            this._clearChat();
        }

        this.renderSidebar();
        return this;
    },

    // ── Datos ──────────────────────────────────────────────────────────────
    async refresh() {
        if (!this._sb || !this._userId) return [];

        const { data, error } = await this._sb
            .from('conversaciones')
            .select('id, titulo, created_at, updated_at, mensajes_count, fijada')
            .eq('alumno', this._userId)
            .eq('archivada', false)
            .order('fijada', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) {
            // 42P01 = tabla inexistente; PGRST205 = no está en el schema cache.
            if (error.code === '42P01' || error.code === 'PGRST205') {
                if (this.migrationReady !== false) {
                    console.warn(
                        '⚠️ [Conversaciones] Falta la migración supabase/conversations_migration.sql. ' +
                        'Se usa el modo de conversación única.'
                    );
                }
                this.migrationReady = false;
                this.list = [];
                return this.list;
            }
            console.error('[Conversaciones] Error listando:', error);
            return this.list;
        }

        this.migrationReady = true;
        this.list = data || [];
        return this.list;
    },

    async create(title = null) {
        if (!this._sb || !this._userId) return null;
        if (!this.migrationReady) return null;

        const { data, error } = await this._sb
            .from('conversaciones')
            .insert({
                alumno: this._userId,
                titulo: title || 'Nueva conversación'
            })
            .select('id, titulo, created_at, updated_at, mensajes_count, fijada')
            .single();

        if (error) {
            console.error('[Conversaciones] Error creando:', error);
            return null;
        }

        this.list.unshift(data);
        return data;
    },

    async rename(id, titulo) {
        const limpio = String(titulo || '').trim().slice(0, 80);
        if (!limpio || !id) return false;

        const { error } = await this._sb
            .from('conversaciones')
            .update({ titulo: limpio })
            .eq('id', id)
            .eq('alumno', this._userId);

        if (error) {
            console.error('[Conversaciones] Error renombrando:', error);
            return false;
        }

        const item = this.list.find(c => c.id === id);
        if (item) item.titulo = limpio;
        this.renderSidebar();
        return true;
    },

    async remove(id) {
        if (!id) return false;

        // El borrado en cascada se lleva los mensajes (ON DELETE CASCADE).
        const { error } = await this._sb
            .from('conversaciones')
            .delete()
            .eq('id', id)
            .eq('alumno', this._userId);

        if (error) {
            console.error('[Conversaciones] Error eliminando:', error);
            return false;
        }

        this.list = this.list.filter(c => c.id !== id);

        if (this.currentId === id) {
            this.currentId = null;
            localStorage.removeItem(ACTIVE_KEY);
            const next = this.list[0];
            if (next) {
                await this.setCurrent(next.id, { render: true });
            } else {
                this._clearChat();
                window.saludarUsuario?.(null, window.userProfile);
            }
        }
        this.renderSidebar();
        return true;
    },

    async setCurrent(id, { render = true } = {}) {
        if (!id) return;
        this.currentId = id;
        localStorage.setItem(ACTIVE_KEY, id);
        this._markActiveInSidebar();

        const mensajes = await this.loadMessages(id);
        if (render) {
            await this.renderMessages(mensajes);
        }
        return mensajes;
    },

    /**
     * Carga los mensajes visibles de una conversación y reconstruye
     * chatHistory (el contexto que se envía a la IA).
     */
    async loadMessages(conversationId) {
        if (!this._sb || !this._userId) return [];

        let query = this._sb
            .from('mensajes')
            .select('id, texto, emisor, created_at, reaction, conversacion_id')
            .eq('alumno', this._userId)
            .order('created_at', { ascending: true });

        if (this.migrationReady) {
            // Sin conversación activa no hay nada que mostrar: evita mezclar
            // mensajes de hilos distintos.
            if (!conversationId) {
                this._syncChatHistory([]);
                return [];
            }
            query = query.eq('conversacion_id', conversationId);
        } else {
            // Modo degradado: un único hilo con los mensajes más recientes.
            query = query.limit(200);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[Conversaciones] Error cargando mensajes:', error);
            return [];
        }

        const visibles = (data || []).filter(m => !INTERNAL_SENDERS.includes(m.emisor));
        this._syncChatHistory(visibles);
        return visibles;
    },

    _syncChatHistory(mensajes) {
        const history = mensajes.map(m => ({
            role: m.emisor === 'ia' ? 'model' : 'user',
            parts: [{ text: m.texto }],
            created_at: m.created_at,
            msgId: m.id
        }));
        // Se reemplaza el contenido del array global en su sitio, para no
        // romper la referencia que otros módulos ya tienen.
        window.chatHistory = history;
        if (Array.isArray(state.chatHistory)) {
            state.chatHistory.length = 0;
            state.chatHistory.push(...history);
        }
        return history;
    },

    async renderMessages(mensajes) {
        this._clearChat();
        if (!mensajes || mensajes.length === 0) return;

        for (const m of mensajes) {
            window.appendMessage?.(m.texto, m.emisor, null, {
                dbId: m.id,
                reaction: m.reaction,
                createdAt: m.created_at
            });
        }
        // Al final, sin animación de scroll para no marear al entrar.
        if (ELEMENTS.chatBox) {
            ELEMENTS.chatBox.scrollTop = ELEMENTS.chatBox.scrollHeight;
        }
    },

    _clearChat() {
        if (ELEMENTS.chatBox) ELEMENTS.chatBox.innerHTML = '';
    },

    /** Crea una conversación nueva, vacía, y la activa. */
    async newConversation() {
        if (!this.migrationReady) {
            // Sin migración no se pueden separar hilos: al menos limpiamos la vista.
            this._clearChat();
            this._syncChatHistory([]);
            this._cerrarTrasElegir();
            window.saludarUsuario?.(null, window.userProfile);
            return null;
        }

        const conv = await this.create('Nueva conversación');
        if (!conv) {
            this._toast('No se pudo crear la conversación.');
            return null;
        }

        this.currentId = conv.id;
        localStorage.setItem(ACTIVE_KEY, conv.id);
        this._clearChat();
        this._syncChatHistory([]);
        this.renderSidebar();
        // Se cierra para poder escribir en el chat nuevo.
        this._cerrarTrasElegir();
        window.saludarUsuario?.(null, window.userProfile);
        ELEMENTS.chatInput?.focus();
        return conv;
    },

    /** Devuelve la conversación activa, creándola si hace falta. */
    async ensureCurrent() {
        if (this.currentId) return this.currentId;
        if (!this.migrationReady) return null;

        const conv = await this.create('Nueva conversación');
        if (!conv) return null;
        this.currentId = conv.id;
        localStorage.setItem(ACTIVE_KEY, conv.id);
        this.renderSidebar();
        return conv.id;
    },

    // ── Búsqueda ───────────────────────────────────────────────────────────
    async search(q) {
        const term = String(q || '').trim();
        if (!term) {
            this.searchResults = null;
            this._updateClearButton();
            this.renderSidebar();
            return null;
        }
        if (!this._sb) return null;

        // Búsqueda local por título (instantánea)
        const porTitulo = this.list.filter(c =>
            c.titulo.toLowerCase().includes(term.toLowerCase())
        );

        // Búsqueda en el texto de los mensajes (BD)
        let porTexto = [];
        const { data, error } = await this._sb
            .from('mensajes')
            .select('id, texto, emisor, created_at, conversacion_id')
            .eq('alumno', this._userId)
            .ilike('texto', `%${term}%`)
            .order('created_at', { ascending: false })
            .limit(40);

        if (error) {
            console.warn('[Conversaciones] Búsqueda en mensajes falló:', error.message);
        } else {
            porTexto = (data || []).filter(m => !INTERNAL_SENDERS.includes(m.emisor));
        }

        this.searchResults = { term, porTitulo, porTexto };
        this._updateClearButton();
        this.renderSidebar();
        return this.searchResults;
    },

    /** Pone título a la conversación a partir de su primer mensaje. */
    async autoTitle(id, texto) {
        const conv = this.list.find(c => c.id === id);
        if (!conv) return;
        if (conv.titulo && conv.titulo !== 'Nueva conversación') return;

        const limpio = String(texto || '')
            .replace(/[*_`#>\[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!limpio) return;
        const titulo = limpio.length > 52 ? limpio.slice(0, 52).trim() + '…' : limpio;
        await this.rename(id, titulo);
    },

    // ── Barra lateral ──────────────────────────────────────────────────────
    _bindUI() {
        const sidebar = document.getElementById('chatSidebar');
        if (!sidebar) return;

        document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => this.toggleSidebar());
        document.getElementById('sidebarCloseBtn')?.addEventListener('click', () => this.toggleSidebar(false));
        document.getElementById('newConversationBtn')?.addEventListener('click', () => this.newConversation());
        document.getElementById('exportConversationBtn')?.addEventListener('click', () => {
            window.exportarChatDoc?.(this.currentId);
        });

        const searchInput = document.getElementById('conversationSearch');
        if (searchInput) {
            let timer = null;
            const programarBusqueda = valor => {
                this.filter = valor;
                this._updateClearButton();
                clearTimeout(timer);
                timer = setTimeout(() => this.search(this.filter), 300);
            };

            searchInput.addEventListener('input', e => programarBusqueda(e.target.value));

            // La "x" nativa de <input type="search"> no siempre dispara `input`
            // en todos los navegadores; `search` sí.
            searchInput.addEventListener('search', e => programarBusqueda(e.target.value));

            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    clearSearch();
                    searchInput.focus();
                }
            });
        }

        // Botón propio para limpiar: al vaciar el campo se vuelve al listado.
        document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
            clearSearch();
            document.getElementById('conversationSearch')?.focus();
        });

        this._updateClearButton();

        // Foco al abrir con teclado + cierre con Escape.
        sidebar.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.toggleSidebar(false);
                document.getElementById('sidebarToggleBtn')?.focus();
            }
        });

        // Estado inicial: abierta en escritorio, cerrada en móvil.
        const guardado = localStorage.getItem(SIDEBAR_KEY);
        const abrir = guardado === null ? window.innerWidth > 900 : guardado === 'true';
        this.toggleSidebar(abrir, { persist: false });
    },

    /** Cierra el cajón tras elegir un hilo, sin tocar la preferencia guardada. */
    _cerrarTrasElegir() {
        this.toggleSidebar(false, { persist: false });
        // Mantener un foco sensato para quien navegue con teclado: el botón
        // que vuelve a abrir el historial.
        document.getElementById('sidebarToggleBtn')?.focus({ preventScroll: true });
    },

    /** Muestra u oculta la "x" del buscador según haya texto o resultados. */
    _updateClearButton() {
        const btn = document.getElementById('clearSearchBtn');
        const input = document.getElementById('conversationSearch');
        if (!btn) return;

        const hayTexto = !!(input && input.value.trim());
        const hayResultados = !!this.searchResults;

        // `hidden` se respeta aunque el CSS use display:flex.
        btn.hidden = !(hayTexto || hayResultados);
    },

    toggleSidebar(force, { persist = true } = {}) {
        const sidebar = document.getElementById('chatSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const toggle = document.getElementById('sidebarToggleBtn');
        if (!sidebar) return;

        const abrir = typeof force === 'boolean'
            ? force
            : !sidebar.classList.contains('open');

        sidebar.classList.toggle('open', abrir);
        sidebar.setAttribute('aria-hidden', String(!abrir));
        overlay?.classList.toggle('visible', abrir && window.innerWidth <= 900);

        if (toggle) {
            toggle.setAttribute('aria-expanded', String(abrir));
            toggle.setAttribute('aria-label', abrir ? 'Ocultar historial' : 'Mostrar historial');
        }
        if (persist) localStorage.setItem(SIDEBAR_KEY, String(abrir));

        if (abrir) {
            document.getElementById('conversationSearch')?.focus({ preventScroll: true });
        }
    },

    _markActiveInSidebar() {
        document.querySelectorAll('#conversationList .conv-item').forEach(el => {
            const activa = el.dataset.id === this.currentId;
            el.classList.toggle('active', activa);
            el.setAttribute('aria-current', activa ? 'true' : 'false');
        });
    },

    renderSidebar() {
        const listEl = document.getElementById('conversationList');
        if (!listEl) return;

        listEl.innerHTML = '';

        // Modo degradado: la migración no está aplicada.
        if (!this.migrationReady) {
            const aviso = document.createElement('p');
            aviso.className = 'conv-empty';
            aviso.innerHTML =
                'El historial por conversaciones aún no está activo.<br>' +
                '<small>Falta aplicar <code>supabase/conversations_migration.sql</code>.</small>';
            listEl.appendChild(aviso);
            return;
        }

        // ── Resultados de búsqueda ──
        if (this.searchResults) {
            const { term, porTitulo, porTexto } = this.searchResults;

            // Cabecera con "Volver": la forma explícita de regresar al listado
            // de conversaciones con sus fechas.
            const cabeza = document.createElement('div');
            cabeza.className = 'conv-search-head';

            const etiqueta = document.createElement('span');
            etiqueta.className = 'conv-search-label';
            etiqueta.textContent = `Resultados para «${term}»`;

            const volver = document.createElement('button');
            volver.type = 'button';
            volver.className = 'conv-back-btn';
            volver.textContent = 'Volver';
            volver.setAttribute('aria-label', 'Volver al historial completo de conversaciones');
            volver.addEventListener('click', () => clearSearch());

            cabeza.appendChild(etiqueta);
            cabeza.appendChild(volver);
            listEl.appendChild(cabeza);

            if (porTitulo.length === 0 && porTexto.length === 0) {
                const vacio = document.createElement('p');
                vacio.className = 'conv-empty';
                vacio.textContent = `Sin resultados para “${term}”.`;
                listEl.appendChild(vacio);
                return;
            }

            if (porTitulo.length) {
                listEl.appendChild(this._groupHeader('Conversaciones'));
                porTitulo.forEach(c => listEl.appendChild(this._convItem(c)));
            }

            if (porTexto.length) {
                listEl.appendChild(this._groupHeader('Mensajes'));
                porTexto.slice(0, 20).forEach(m => {
                    const conv = this.list.find(c => c.id === m.conversacion_id);
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'conv-item conv-result';
                    btn.innerHTML = `
                        <span class="conv-result-text"></span>
                        <span class="conv-date"></span>`;
                    btn.querySelector('.conv-result-text').textContent =
                        this._highlight(m.texto, term);
                    btn.querySelector('.conv-date').textContent = conv?.titulo || '';
                    btn.addEventListener('click', async () => {
                        if (m.conversacion_id) {
                            clearSearch();
                            this._cerrarTrasElegir();
                            await this.setCurrent(m.conversacion_id, { render: true });
                        }
                    });
                    listEl.appendChild(btn);
                });
            }
            return;
        }

        // ── Lista normal ──
        if (this.list.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'conv-empty';
            vacio.textContent = 'Aún no tienes conversaciones guardadas.';
            listEl.appendChild(vacio);
            return;
        }

        this.list.forEach(c => listEl.appendChild(this._convItem(c)));
        this._markActiveInSidebar();
    },

    _groupHeader(texto) {
        const h = document.createElement('div');
        h.className = 'conv-group-title';
        h.textContent = texto;
        return h;
    },

    _highlight(texto, term) {
        const t = String(texto || '').replace(/\s+/g, ' ').trim();
        const i = t.toLowerCase().indexOf(String(term).toLowerCase());
        const frag = i === -1 ? t : t.slice(Math.max(0, i - 25));
        return frag.slice(0, 110) + (frag.length > 110 ? '…' : '');
    },

    _convItem(conv) {
        const item = document.createElement('div');
        item.className = 'conv-item';
        item.dataset.id = conv.id;
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');

        const titulo = document.createElement('span');
        titulo.className = 'conv-title';
        titulo.textContent = conv.titulo || 'Sin título';

        const meta = document.createElement('span');
        meta.className = 'conv-date';
        meta.textContent = this._formatDate(conv.updated_at || conv.created_at);

        const acciones = document.createElement('div');
        acciones.className = 'conv-actions';

        const renombrar = document.createElement('button');
        renombrar.type = 'button';
        renombrar.className = 'conv-action';
        renombrar.title = 'Renombrar conversación';
        renombrar.setAttribute('aria-label', `Renombrar ${conv.titulo || 'conversación'}`);
        renombrar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
        renombrar.addEventListener('click', async e => {
            e.stopPropagation();
            const nuevo = await window.promptCustom?.(
                'Nuevo nombre para la conversación:',
                conv.titulo || ''
            );
            if (nuevo == null) return;
            const ok = await this.rename(conv.id, nuevo);
            if (!ok) this._toast('No se pudo renombrar.');
        });

        const borrar = document.createElement('button');
        borrar.type = 'button';
        borrar.className = 'conv-action conv-action-danger';
        borrar.title = 'Eliminar conversación';
        borrar.setAttribute('aria-label', `Eliminar ${conv.titulo || 'conversación'}`);
        borrar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
        borrar.addEventListener('click', async e => {
            e.stopPropagation();
            const ok = await window.confirmCustom?.(
                `¿Eliminar “${conv.titulo}” y todos sus mensajes? No se puede deshacer.`
            );
            if (!ok) return;
            const hecho = await this.remove(conv.id);
            if (!hecho) this._toast('No se pudo eliminar la conversación.');
        });

        acciones.appendChild(renombrar);
        acciones.appendChild(borrar);

        item.appendChild(titulo);
        item.appendChild(meta);
        item.appendChild(acciones);

        // Al elegir una conversación se cierra el cajón para dejar ver el chat.
        // Sin persistir: es una acción automática, no una preferencia del usuario.
        const abrir = async () => {
            this._cerrarTrasElegir();
            await this.setCurrent(conv.id, { render: true });
        };
        item.addEventListener('click', abrir);
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrir();
            }
        });

        return item;
    },

    _formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        const hoy = new Date();
        const mismoDia = d.toDateString() === hoy.toDateString();
        if (mismoDia) {
            return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        if (d.toDateString() === ayer.toDateString()) return 'Ayer';
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    },

    _toast(msg) {
        console.warn('[Conversaciones]', msg);
        if (window.alertCustom) window.alertCustom(msg);
    }
};

function clearSearch() {
    const input = document.getElementById('conversationSearch');
    if (input) input.value = '';
    CONVERSATIONS.filter = '';
    CONVERSATIONS.searchResults = null;
    CONVERSATIONS._updateClearButton();
    // Volver a pintar el listado completo (con sus fechas). Sin esto la barra
    // se quedaba mostrando los resultados de la búsqueda anterior.
    CONVERSATIONS.renderSidebar();
}

// Mantener `updated_at` de la lista al día tras cada mensaje nuevo.
window.addEventListener('dtv:message-saved', () => {
    if (CONVERSATIONS.ready && CONVERSATIONS.migrationReady) {
        CONVERSATIONS.refresh().then(() => CONVERSATIONS.renderSidebar());
    }
});
