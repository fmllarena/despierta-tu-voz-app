/**
 * DTV PWA Module
 * - Registra el service worker (instalación + uso offline básico).
 * - Gestiona la actualización: avisa al usuario cuando hay versión nueva.
 * - Muestra un botón "Instalar app" cuando el navegador lo permite.
 *
 * Sin service worker no hay instalación real ni caché offline; este módulo
 * es el que activa ambos.
 */

const SW_URL = '/service-worker.js';

let deferredPrompt = null;
let registrando = false;

/* ── Registro del service worker ─────────────────────────────────────────── */
async function registrar() {
    if (registrando) return null;
    registrando = true;

    if (!('serviceWorker' in navigator)) {
        console.info('[PWA] Este navegador no soporta service workers.');
        return null;
    }
    // El SW requiere contexto seguro (https o localhost).
    if (location.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        console.info('[PWA] Se necesita HTTPS para registrar el service worker.');
        return null;
    }

    try {
        const registro = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
        console.log('✅ [PWA] Service worker registrado:', registro.scope);

        // Actualización disponible → avisar y ofrecer recarga.
        registro.addEventListener('updatefound', () => {
            const nuevo = registro.installing;
            if (!nuevo) return;
            nuevo.addEventListener('statechange', () => {
                if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
                    mostrarAvisoActualizacion(nuevo);
                }
            });
        });

        return registro;
    } catch (e) {
        console.warn('[PWA] No se pudo registrar el service worker:', e?.message || e);
        return null;
    }
}

/** Comprueba si hay una versión nueva esperando y ofrece recargar. */
function mostrarAvisoActualizacion(worker) {
    if (document.getElementById('dtvUpdateBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'dtvUpdateBanner';
    banner.setAttribute('role', 'status');
    banner.style.cssText =
        'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;' +
        'background:#2b2621;color:#f3ede3;padding:12px 16px;border-radius:12px;' +
        'font:14px/1.4 system-ui,sans-serif;display:flex;gap:12px;align-items:center;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:92vw';

    const texto = document.createElement('span');
    texto.textContent = 'Hay una versión nueva de la app.';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Actualizar';
    btn.style.cssText =
        'background:#d4af37;color:#1f1a16;border:0;border-radius:8px;' +
        'padding:6px 12px;font-weight:600;cursor:pointer;min-height:34px';
    btn.addEventListener('click', () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
        location.reload();
    });

    banner.appendChild(texto);
    banner.appendChild(btn);
    document.body.appendChild(banner);
}

/* ── Instalación ─────────────────────────────────────────────────────────── */
function crearBotonInstalar() {
    if (document.getElementById('dtvInstallBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'dtvInstallBtn';
    btn.type = 'button';
    btn.textContent = 'Instalar app';
    btn.setAttribute('aria-label', 'Instalar la aplicación en este dispositivo');
    btn.style.cssText =
        'position:fixed;right:14px;bottom:14px;z-index:2147482500;' +
        'background:#8e7d6d;color:#fff;border:0;border-radius:999px;' +
        'padding:10px 18px;font:600 14px/1 system-ui,sans-serif;cursor:pointer;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.2);min-height:40px';

    btn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        try {
            await deferredPrompt.userChoice;
        } catch (_) { /* el usuario canceló */ }
        deferredPrompt = null;
        btn.remove();
    });

    document.body.appendChild(btn);
}

window.addEventListener('beforeinstallprompt', e => {
    // Evitamos el mini-infobar por defecto y mostramos nuestro botón.
    e.preventDefault();
    deferredPrompt = e;
    crearBotonInstalar();
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.getElementById('dtvInstallBtn')?.remove();
    console.log('✅ [PWA] App instalada.');
    window.dtvAnnounce?.('Aplicación instalada correctamente.');
});

/* ── Arranque ────────────────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registrar);
} else {
    registrar();
}

// Al volver el foco, comprobar si hay actualizaciones pendientes.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.getRegistration().then(r => r?.update().catch(() => { }));
    }
});

export default { registrar };
