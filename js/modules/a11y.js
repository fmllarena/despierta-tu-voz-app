/**
 * DTV Accessibility Module
 * Mejoras de accesibilidad aplicadas en tiempo de ejecución:
 *  - Etiquetas accesibles para botones que solo muestran un icono.
 *  - Foco atrapado dentro de los modales y cierre con Escape.
 *  - Región "live" para anunciar cambios importantes a lectores de pantalla.
 *  - Estado de los botones de envío/parada.
 *
 * No modifica la lógica de negocio: solo el árbol de accesibilidad.
 */

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

let lastFocused = null;

/* ── Región live ─────────────────────────────────────────────────────────── */
function ensureLiveRegion() {
    let region = document.getElementById('dtvLiveRegion');
    if (!region) {
        region = document.createElement('div');
        region.id = 'dtvLiveRegion';
        region.className = 'sr-only';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        document.body.appendChild(region);
    }
    return region;
}

export function announce(message) {
    if (!message) return;
    const region = ensureLiveRegion();
    // Un pequeño retardo fuerza a los lectores a releer aunque el texto se repita.
    region.textContent = '';
    setTimeout(() => { region.textContent = String(message); }, 60);
}
window.dtvAnnounce = announce;

/* ── Utilidades de modales ───────────────────────────────────────────────── */
function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }
    // Un modal oculto por display:none en el padre tampoco cuenta.
    return el.getClientRects().length > 0;
}

function visibleModals() {
    return [...document.querySelectorAll('.modal, [role="dialog"]')]
        .filter(isVisible)
        // El propio overlay de auth no es un modal con trampa de foco estándar.
        .sort((a, b) => Number(a.style.zIndex || 0) - Number(b.style.zIndex || 0));
}

function focusablesIn(container) {
    return [...container.querySelectorAll(FOCUSABLE)]
        .filter(el => isVisible(el) && !el.hasAttribute('disabled') && el.tabIndex !== -1);
}

/* ── Etiquetas accesibles ────────────────────────────────────────────────── */
const LABEL_MAP = {
    musicToggleBtn: 'Música ambiental',
    logoutBtn: 'Cerrar sesión',
    mainHelpBtn: 'Ayuda de la pantalla principal',
    inspiracionBtn: 'Inspiración del día',
    viajeBtn: 'Mi viaje',
    progresoBtn: 'Mi progreso',
    botiquinBtn: 'Botiquín de emergencia',
    savedMessagesBtn: 'Mensajes guardados',
    sesionBtn: 'Sesiones 1 a 1',
    upgradeBtn: 'Mejorar plan',
    ajustesBtn: 'Ajustes',
    sendBtn: 'Enviar mensaje',
    stopBtn: 'Detener la respuesta',
    micBtn: 'Transcribir voz a texto',
    singBtn: 'Analizar mi canto',
    quickUploadBtn: 'Añadir partitura o audio',
    quickPhoneticsBtn: 'Ayuda de fonética',
    sidebarToggleBtn: 'Mostrar historial de conversaciones',
    sidebarCloseBtn: 'Cerrar historial',
    newConversationBtn: 'Nueva conversación',
    exportConversationBtn: 'Descargar esta conversación',
    headerExportBtn: 'Descargar la conversación en Word'
};

function labelButtons() {
    // 1. Botones conocidos por id.
    for (const [id, label] of Object.entries(LABEL_MAP)) {
        const btn = document.getElementById(id);
        if (btn && !btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', label);
        }
    }

    // 2. Cualquier botón cuyo contenido visible sea solo un icono.
    document.querySelectorAll('button').forEach(btn => {
        if (btn.getAttribute('aria-label')) return;
        if (btn.getAttribute('aria-labelledby')) return;

        const text = (btn.textContent || '').trim();
        const hasImg = !!btn.querySelector('img, svg');
        if (text.length > 0 || !hasImg) {
            // Si tiene texto, ya tiene nombre accesible.
            if (text.length > 0) return;
        }

        const title = btn.getAttribute('title');
        const imgAlt = btn.querySelector('img')?.getAttribute('alt');
        const label = title || imgAlt;
        if (label) btn.setAttribute('aria-label', label);
    });
}

/* ── Trampa de foco + Escape ─────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
    const modals = visibleModals();
    if (modals.length === 0) return;

    const modal = modals[modals.length - 1];

    if (e.key === 'Escape') {
        // Se deja a cada modal su propio cierre; aquí solo el foco.
        if (!modal.dataset.a11yEscape) {
            e.preventDefault();
            modal.style.display = 'none';
            if (lastFocused && typeof lastFocused.focus === 'function') {
                lastFocused.focus();
            }
        }
        return;
    }

    if (e.key !== 'Tab') return;

    const focusables = focusablesIn(modal);
    if (!focusables.length) {
        e.preventDefault();
        return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activo = document.activeElement;

    if (e.shiftKey) {
        if (activo === first || !modal.contains(activo)) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (activo === last || !modal.contains(activo)) {
            e.preventDefault();
            first.focus();
        }
    }
}, true);

/* ── Observador: recordar el foco antes de abrir un modal ────────────────── */
const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
        if (m.type !== 'attributes' || m.attributeName !== 'style') continue;
        const el = m.target;
        if (!el.classList || !el.classList.contains('modal')) continue;

        const visible = isVisible(el);
        if (visible) {
            if (!el.contains(document.activeElement)) {
                lastFocused = document.activeElement;
                const first = focusablesIn(el)[0];
                if (first) {
                    // Esperar a que termine de mostrarse.
                    setTimeout(() => { if (isVisible(el)) first.focus(); }, 30);
                }
            }
        } else if (el.contains(document.activeElement)) {
            if (lastFocused && typeof lastFocused.focus === 'function') {
                lastFocused.focus();
            }
        }
    }
});

function start() {
    ensureLiveRegion();
    labelButtons();

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style'],
        subtree: true
    });

    // Reetiquetar cuando el DOM cambie (botones generados dinámicamente).
    const bodyObserver = new MutationObserver(() => {
        clearTimeout(start._t);
        start._t = setTimeout(labelButtons, 200);
    });
    bodyObserver.observe(document.getElementById('chatBox') || document.body, {
        childList: true,
        subtree: true
    });

    // Anuncios de estado para lectores de pantalla.
    window.addEventListener('dtv:message-saved', e => {
        if (e.detail?.emisor === 'ia') announce('Respuesta del mentor lista.');
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}

export default { announce, start };
