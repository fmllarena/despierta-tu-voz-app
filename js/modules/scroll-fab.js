const TOLERANCIA = 48;

function resolver(ref) {
    if (!ref) return null;
    if (typeof ref === 'function') return resolver(ref());
    if (typeof ref === 'string') return document.querySelector(ref);
    return ref;
}

export function initScrollFab(opciones = {}) {
    const {
        boton = '#scrollFabBtn',
        scroller = null,
        ancla = null,
        destinoAbajo = null,
        destinoArriba = null,
        margen = 12
    } = opciones;

    const fab = resolver(boton);
    if (!fab) return null;

    const scrollerEl = resolver(scroller);
    const anclaEl = resolver(ancla);
    const usaVentana = !scrollerEl;

    let pendiente = false;
    let temporizador = null;

    function hayDesborde() {
        if (usaVentana) {
            return document.documentElement.scrollHeight - window.innerHeight > TOLERANCIA;
        }
        return scrollerEl.scrollHeight - scrollerEl.clientHeight > TOLERANCIA;
    }

    function bordeInferior() {
        if (usaVentana) return window.innerHeight;
        return scrollerEl.getBoundingClientRect().bottom;
    }

    function enElFinal() {
        const destino = resolver(destinoAbajo);
        if (destino) {
            return destino.getBoundingClientRect().bottom <= bordeInferior() + TOLERANCIA;
        }
        if (usaVentana) {
            return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - TOLERANCIA;
        }
        return scrollerEl.scrollTop + scrollerEl.clientHeight >= scrollerEl.scrollHeight - TOLERANCIA;
    }

    function posicionar() {
        if (!anclaEl || usaVentana) return;
        const rectAncla = anclaEl.getBoundingClientRect();
        const rectScroller = scrollerEl.getBoundingClientRect();
        const hueco = rectAncla.bottom - rectScroller.bottom;
        fab.style.bottom = `${Math.max(0, Math.round(hueco + margen))}px`;
    }

    function actualizar() {
        pendiente = false;
        posicionar();
        if (!hayDesborde()) {
            fab.classList.remove('visible');
            fab.setAttribute('aria-hidden', 'true');
            return;
        }
        fab.classList.add('visible');
        fab.removeAttribute('aria-hidden');
        if (enElFinal()) {
            fab.dataset.direccion = 'arriba';
            fab.textContent = '↑';
            fab.title = 'Ir al inicio de la conversación';
            fab.setAttribute('aria-label', 'Ir al inicio de la conversación');
        } else {
            fab.dataset.direccion = 'abajo';
            fab.textContent = '↓';
            fab.title = 'Ir al final de la conversación';
            fab.setAttribute('aria-label', 'Ir al final de la conversación');
        }
    }

    function pedirActualizacion() {
        if (pendiente) return;
        pendiente = true;
        window.requestAnimationFrame(actualizar);
    }

    function irAbajo() {
        const destino = resolver(destinoAbajo);
        if (destino) {
            destino.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else if (usaVentana) {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        } else {
            scrollerEl.scrollTo({ top: scrollerEl.scrollHeight, behavior: 'smooth' });
        }
        window.setTimeout(pedirActualizacion, 400);
    }

    function irArriba() {
        const destino = resolver(destinoArriba);
        if (destino) {
            destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (usaVentana) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            scrollerEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.setTimeout(pedirActualizacion, 400);
    }

    fab.addEventListener('click', () => {
        if (fab.dataset.direccion === 'arriba') irArriba();
        else irAbajo();
    });

    const objetivoScroll = usaVentana ? window : scrollerEl;
    objetivoScroll.addEventListener('scroll', pedirActualizacion, { passive: true });
    window.addEventListener('resize', pedirActualizacion);

    const observado = usaVentana ? document.body : scrollerEl;
    if (observado && typeof MutationObserver !== 'undefined') {
        new MutationObserver(() => {
            window.clearTimeout(temporizador);
            temporizador = window.setTimeout(pedirActualizacion, 150);
        }).observe(observado, { childList: true, subtree: true });
    }

    if (typeof ResizeObserver !== 'undefined') {
        const medida = usaVentana ? document.body : scrollerEl;
        if (medida) new ResizeObserver(pedirActualizacion).observe(medida);
    }

    if (anclaEl) fab.classList.add('anclado');

    actualizar();
    window.setTimeout(pedirActualizacion, 300);

    return { elemento: fab, actualizar, irAbajo, irArriba };
}

function autoInit() {
    const fab = document.querySelector('[data-scroll-fab]');
    if (!fab) return;
    initScrollFab({
        boton: fab,
        scroller: fab.dataset.scroller || null,
        ancla: fab.dataset.ancla || null,
        destinoAbajo: fab.dataset.destinoAbajo || null,
        destinoArriba: fab.dataset.destinoArriba || null
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
} else {
    autoInit();
}
