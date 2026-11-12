import { ELEMENTS } from './elements.js?v=7.3';
import { state } from './state.js';
import { alertCustom } from './utils.js';

const BUCKET = 'chat-backgrounds';
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_LADO = 1600;
const CALIDAD_JPEG = 0.85;
const VELO_DEFAULT = 30;
const VELO_EXTRA_OSCURO = 0.15;
const CACHE_KEY = 'dtv_fondo_chat';
const COLOR_POR_DEFECTO = '#fdfaf5';

function gradienteVelo(proporcion) {
    if (!proporcion || proporcion <= 0) return 'none';
    const valor = Math.min(0.9, proporcion).toFixed(3);
    return `linear-gradient(rgba(0, 0, 0, ${valor}), rgba(0, 0, 0, ${valor}))`;
}

function normalizar(datos = {}) {
    const tipo = datos.tipo === 'color' || datos.tipo === 'foto' ? datos.tipo : 'ninguno';
    const color = /^#[0-9a-f]{6}$/i.test(datos.color || '') ? datos.color.toLowerCase() : '';
    const url = typeof datos.url === 'string' && datos.url ? datos.url : '';
    let velo = Number.parseInt(datos.velo, 10);
    if (Number.isNaN(velo)) velo = VELO_DEFAULT;
    return {
        tipo,
        color,
        url,
        velo: Math.min(90, Math.max(0, velo))
    };
}

function esOscuro() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function aplicarVariables(datos) {
    const root = document.documentElement;
    const veloClaro = datos.velo / 100;
    const veloOscuro = Math.min(0.9, veloClaro + VELO_EXTRA_OSCURO);
    const hayColor = datos.tipo === 'color' && datos.color;
    const hayFoto = datos.tipo === 'foto' && datos.url;

    if (hayColor) root.style.setProperty('--fondo-chat-color', datos.color);
    else root.style.removeProperty('--fondo-chat-color');

    if (hayFoto) root.style.setProperty('--fondo-chat-imagen', `url("${datos.url}")`);
    else root.style.removeProperty('--fondo-chat-imagen');

    const velo = hayColor || hayFoto ? gradienteVelo(veloClaro) : 'none';
    const veloDark = hayColor || hayFoto ? gradienteVelo(veloOscuro) : 'none';
    root.style.setProperty('--fondo-chat-velo', velo);
    root.style.setProperty('--fondo-chat-velo-dark', veloDark);
}

function guardarCache(datos) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(datos));
    } catch (e) {
        console.warn('No se pudo guardar la caché del fondo:', e);
    }
}

function leerCache() {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    } catch (e) {
        return null;
    }
}

function redimensionar(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
            const ancho = Math.max(1, Math.round(img.width * escala));
            const alto = Math.max(1, Math.round(img.height * escala));
            const canvas = document.createElement('canvas');
            canvas.width = ancho;
            canvas.height = alto;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, ancho, alto);
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('No se pudo procesar la imagen.'));
            }, 'image/jpeg', CALIDAD_JPEG);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('No se pudo leer la imagen.'));
        };
        img.src = objectUrl;
    });
}

export const CHAT_BACKGROUND = window.CHAT_BACKGROUND = {
    aplicarPerfil(perfil) {
        if (!perfil) return;
        const datos = normalizar({
            tipo: perfil.fondo_chat_tipo,
            color: perfil.fondo_chat_color,
            url: perfil.fondo_chat_url,
            velo: perfil.fondo_chat_velo
        });
        aplicarVariables(datos);
        guardarCache(datos);
    },

    datosDeControles() {
        const tipo = ELEMENTS.fondoTipoSelect?.value || 'ninguno';
        const color = ELEMENTS.fondoColorInput?.value || COLOR_POR_DEFECTO;
        const url = window.userProfile?.fondo_chat_url || '';
        const velo = ELEMENTS.fondoVeloSlider
            ? parseInt(ELEMENTS.fondoVeloSlider.value, 10)
            : VELO_DEFAULT;
        return normalizar({ tipo, color, url, velo });
    },

    previsualizar() {
        const preview = ELEMENTS.fondoPreview;
        if (!preview) return;
        const datos = this.datosDeControles();
        const velo = datos.tipo === 'color' || datos.tipo === 'foto'
            ? gradienteVelo(datos.velo / 100 + (esOscuro() ? VELO_EXTRA_OSCURO : 0))
            : 'none';
        const imagen = datos.tipo === 'foto' && datos.url ? `url("${datos.url}")` : 'none';
        preview.style.backgroundColor = datos.tipo === 'color' && datos.color ? datos.color : 'transparent';
        preview.style.backgroundImage = velo === 'none' ? imagen : `${velo}, ${imagen}`;
    },

    refrescarControles(perfil) {
        const fuente = perfil || window.userProfile || {};
        const datos = normalizar({
            tipo: fuente.fondo_chat_tipo,
            color: fuente.fondo_chat_color,
            url: fuente.fondo_chat_url,
            velo: fuente.fondo_chat_velo
        });
        if (ELEMENTS.fondoTipoSelect) ELEMENTS.fondoTipoSelect.value = datos.tipo;
        if (ELEMENTS.fondoColorInput) ELEMENTS.fondoColorInput.value = datos.color || COLOR_POR_DEFECTO;
        if (ELEMENTS.fondoColorValue) ELEMENTS.fondoColorValue.textContent = datos.color || COLOR_POR_DEFECTO;
        if (ELEMENTS.fondoVeloSlider) ELEMENTS.fondoVeloSlider.value = datos.velo;
        if (ELEMENTS.removeFondoFotoBtn) {
            ELEMENTS.removeFondoFotoBtn.style.display = datos.url ? 'inline-block' : 'none';
        }
        this.marcarSwatch(datos.color);
        this.visibilizarGrupos(datos.tipo);
        this.previsualizar();
    },

    marcarSwatch(color) {
        const swatches = ELEMENTS.fondoSwatches?.querySelectorAll('.fondo-swatch');
        if (!swatches) return;
        swatches.forEach(swatch => {
            swatch.classList.toggle('activo', (swatch.dataset.color || '').toLowerCase() === color);
        });
    },

    visibilizarGrupos(tipo) {
        if (ELEMENTS.fondoColorGroup) ELEMENTS.fondoColorGroup.hidden = tipo !== 'color';
        if (ELEMENTS.fondoFotoGroup) ELEMENTS.fondoFotoGroup.hidden = tipo !== 'foto';
    },

    async subirFoto(file) {
        if (!file) return;
        if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
            alertCustom('Selecciona una imagen JPG, PNG o WEBP.');
            return;
        }
        if (file.size > MAX_BYTES) {
            alertCustom('La imagen no puede superar 2 MB.');
            return;
        }

        const db = window.__supabase || state.supabase;
        try {
            const { data: { user } } = await db.auth.getUser();
            if (!user) return alertCustom('Debes iniciar sesión.');

            const blob = await redimensionar(file);
            const timestamp = Date.now();
            const path = `${user.id}/fondo_${timestamp}.jpg`;

            const { error: uploadError } = await db.storage
                .from(BUCKET)
                .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            const { data: oldFiles } = await db.storage.from(BUCKET).list(user.id);
            if (oldFiles?.length) {
                const oldPaths = oldFiles
                    .filter(f => f.name !== `fondo_${timestamp}.jpg`)
                    .map(f => `${user.id}/${f.name}`);
                if (oldPaths.length) await db.storage.from(BUCKET).remove(oldPaths);
            }

            const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
            const publicUrl = urlData.publicUrl + '?t=' + timestamp;

            const { error: updateError } = await db
                .from('user_profiles')
                .update({ fondo_chat_url: publicUrl, fondo_chat_tipo: 'foto' })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            if (window.userProfile) {
                window.userProfile.fondo_chat_url = publicUrl;
                window.userProfile.fondo_chat_tipo = 'foto';
            }
            if (ELEMENTS.fondoTipoSelect) ELEMENTS.fondoTipoSelect.value = 'foto';
            if (ELEMENTS.removeFondoFotoBtn) ELEMENTS.removeFondoFotoBtn.style.display = 'inline-block';

            this.aplicarPerfil(window.userProfile);
            this.visibilizarGrupos('foto');
            this.previsualizar();
            alertCustom('Fondo del chat actualizado.');
        } catch (err) {
            console.error('Error subiendo el fondo del chat:', err);
            alertCustom('Error al subir el fondo: ' + err.message);
        }
    },

    async quitarFoto() {
        const db = window.__supabase || state.supabase;
        try {
            const { data: { user } } = await db.auth.getUser();
            if (!user) return;

            const { data: files } = await db.storage.from(BUCKET).list(user.id);
            if (files?.length) {
                await db.storage.from(BUCKET).remove(files.map(f => `${user.id}/${f.name}`));
            }

            await db
                .from('user_profiles')
                .update({ fondo_chat_url: null, fondo_chat_tipo: 'ninguno' })
                .eq('user_id', user.id);

            if (window.userProfile) {
                window.userProfile.fondo_chat_url = null;
                window.userProfile.fondo_chat_tipo = 'ninguno';
            }
            if (ELEMENTS.fondoTipoSelect) ELEMENTS.fondoTipoSelect.value = 'ninguno';
            if (ELEMENTS.fondoFotoInput) ELEMENTS.fondoFotoInput.value = '';
            if (ELEMENTS.removeFondoFotoBtn) ELEMENTS.removeFondoFotoBtn.style.display = 'none';

            this.aplicarPerfil(window.userProfile);
            this.visibilizarGrupos('ninguno');
            this.previsualizar();
            alertCustom('Fondo del chat quitado.');
        } catch (err) {
            console.error('Error quitando el fondo del chat:', err);
            alertCustom('Error al quitar el fondo: ' + err.message);
        }
    },

    setup() {
        ELEMENTS.fondoTipoSelect?.addEventListener('change', () => {
            const tipo = ELEMENTS.fondoTipoSelect.value;
            this.visibilizarGrupos(tipo);
            this.previsualizar();
        });

        ELEMENTS.fondoSwatches?.addEventListener('click', (e) => {
            const swatch = e.target.closest('.fondo-swatch');
            if (!swatch) return;
            const color = swatch.dataset.color;
            if (!color) return;
            if (ELEMENTS.fondoColorInput) ELEMENTS.fondoColorInput.value = color;
            if (ELEMENTS.fondoColorValue) ELEMENTS.fondoColorValue.textContent = color;
            this.marcarSwatch(color.toLowerCase());
            this.previsualizar();
        });

        ELEMENTS.fondoColorInput?.addEventListener('input', () => {
            const color = ELEMENTS.fondoColorInput.value;
            if (ELEMENTS.fondoColorValue) ELEMENTS.fondoColorValue.textContent = color;
            this.marcarSwatch(color.toLowerCase());
            this.previsualizar();
        });

        ELEMENTS.fondoVeloSlider?.addEventListener('input', () => this.previsualizar());

        ELEMENTS.fondoFotoInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            e.target.value = '';
            await this.subirFoto(file);
        });

        ELEMENTS.removeFondoFotoBtn?.addEventListener('click', () => this.quitarFoto());
    }
};

function initFondoCache() {
    const cache = leerCache();
    if (cache) aplicarVariables(normalizar(cache));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFondoCache);
} else {
    initFondoCache();
}
