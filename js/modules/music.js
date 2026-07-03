import { ELEMENTS } from './elements.js';
import { AUDIOS_BOTIQUIN } from './config.js';

let currentAudio = null;
let currentAudioBtn = null;
let playlist = [];
let playlistIndex = -1;
let isPlayAll = false;

export const MUSICA = window.MUSICA = {
    init: function () {
        this.renderMenu();
        this.setupListeners();
        this.cargarVolumen();
    },

    renderMenu: function () {
        if (!ELEMENTS.musicListItems) return;
        ELEMENTS.musicListItems.innerHTML = AUDIOS_BOTIQUIN.map(audio => {
            if (audio.isCategory) {
                return `
                <div class="music-item-container">
                    <button class="music-item category" onclick="MUSICA.toggleSubmenu(this, event)">
                        <div class="music-info">
                            <strong>${audio.title}</strong>
                        </div>
                    </button>
                    <div class="music-submenu">
                        ${audio.items.map(subItem => `
                            <button class="music-item" onclick="MUSICA.seleccionarYReproducir('${subItem.file}', this)">
                                <div class="music-info">
                                    <strong>${subItem.title}</strong>
                                    <span class="music-desc">${subItem.desc}</span>
                                </div>
                                <span class="music-status-icon">▶</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                `;
            } else {
                return `
                <button class="music-item" onclick="MUSICA.seleccionarYReproducir('${audio.file}', this)">
                    <div class="music-info">
                        <strong>${audio.title}</strong>
                        <span class="music-desc">${audio.desc}</span>
                    </div>
                    <span class="music-status-icon">▶</span>
                </button>
                `;
            }
        }).join('');
    },

    toggleSubmenu: function (btn, event) {
        event.stopPropagation();
        const container = btn.parentElement;

        // Cierra otros submenús abiertos
        document.querySelectorAll('.music-item-container.active-submenu').forEach(el => {
            if (el !== container) el.classList.remove('active-submenu');
        });

        container.classList.toggle('active-submenu');
    },

    setupListeners: function () {
        // Toggle menú
        ELEMENTS.musicToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = ELEMENTS.musicMenu.style.display === 'flex';
            ELEMENTS.musicMenu.style.display = isVisible ? 'none' : 'flex';
        });

        // Detener música
        ELEMENTS.stopMusicBtn?.addEventListener('click', () => {
            this.detenerTodo();
            ELEMENTS.musicMenu.style.display = 'none';
        });

        // Control de volumen
        ELEMENTS.volumeSlider?.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            if (currentAudio) currentAudio.volume = vol;
            localStorage.setItem('dtv_volume', vol);
        });

        // Reproducir todo
        ELEMENTS.playAllBtn?.addEventListener('click', () => {
            this.reproducirTodo();
            ELEMENTS.musicMenu.style.display = 'none';
        });

        // Cerrar al pulsar fuera
        window.addEventListener('click', (e) => {
            if (ELEMENTS.musicMenu && !ELEMENTS.musicMenu.contains(e.target) && e.target !== ELEMENTS.musicToggleBtn) {
                ELEMENTS.musicMenu.style.display = 'none';
                document.querySelectorAll('.music-item-container.active-submenu').forEach(el => el.classList.remove('active-submenu'));
            }
        });
    },

    seleccionarYReproducir: function (file, itemBtn) {
        isPlayAll = false;
        playlist = [];
        playlistIndex = -1;
        reproducirAudioBotiquin(file, itemBtn, true);
        ELEMENTS.musicMenu.style.display = 'none';
    },

    obtenerListaCompleta: function () {
        const flat = [];
        AUDIOS_BOTIQUIN.forEach(item => {
            if (item.isCategory && item.items) {
                item.items.forEach(sub => flat.push(sub));
            } else {
                flat.push(item);
            }
        });
        return flat;
    },

    reproducirTodo: function () {
        const lista = this.obtenerListaCompleta();
        if (!lista.length) return;
        isPlayAll = true;
        playlist = lista;
        playlistIndex = 0;
        this.reproducirPlaylistActual();
    },

    reproducirPlaylistActual: function () {
        if (!isPlayAll || playlistIndex < 0 || playlistIndex >= playlist.length) return;
        const item = playlist[playlistIndex];
        const tempBtn = document.createElement('button');
        tempBtn.className = 'music-item';
        tempBtn.innerHTML = `<span class="music-status-icon">▶</span>`;
        const statusIcon = tempBtn.querySelector('.music-status-icon');
        reproducirAudioBotiquin(item.file, tempBtn, true);
        const isActive = currentAudio && currentAudio.src.includes(item.file.split('/').pop());

        // Sobrescribir onended para pasar a la siguiente
        if (currentAudio) {
            currentAudio.loop = false;
            const originalEnded = currentAudio.onended;
            currentAudio.onended = () => {
                setAudioBtnIcon(tempBtn, '▶');
                currentAudio = null;
                currentAudioBtn = null;
                if (isPlayAll) {
                    playlistIndex = (playlistIndex + 1) % playlist.length;
                    this.reproducirPlaylistActual();
                }
                MUSICA.actualizarUI();
            };
        }

        // Mostrar en el toggle qué canción suena
        const toggleImg = ELEMENTS.musicToggleBtn?.querySelector('img');
        if (toggleImg) toggleImg.src = 'assets/ondas-sonoras.png';
        ELEMENTS.musicToggleBtn?.classList.add('playing');
        ELEMENTS.musicToggleBtn.title = `🎵 ${item.title}`;
    },

    detenerTodo: function () {
        isPlayAll = false;
        playlist = [];
        playlistIndex = -1;
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        if (currentAudioBtn) {
            setAudioBtnIcon(currentAudioBtn, '▶');
            currentAudioBtn = null;
        }
        if (ELEMENTS.musicToggleBtn) ELEMENTS.musicToggleBtn.title = 'Música ambiental';
        this.actualizarUI();
    },

    cargarVolumen: function () {
        const saved = localStorage.getItem('dtv_volume');
        if (saved !== null) {
            const vol = parseFloat(saved);
            if (ELEMENTS.volumeSlider) ELEMENTS.volumeSlider.value = vol;
            if (currentAudio) currentAudio.volume = vol;
        }
    },

    actualizarUI: function () {
        const toggleImg = ELEMENTS.musicToggleBtn?.querySelector('img');
        if (currentAudio && !currentAudio.paused) {
            ELEMENTS.musicToggleBtn?.classList.add('playing');
            if (toggleImg) toggleImg.src = 'assets/ondas-sonoras.png';
        } else {
            ELEMENTS.musicToggleBtn?.classList.remove('playing');
            if (toggleImg) toggleImg.src = 'assets/musica.png';
        }

        document.querySelectorAll('.music-item').forEach(btn => {
            const onclickText = btn.getAttribute('onclick') || "";
            const match = onclickText.match(/'([^']+)'/);
            if (!match) return;

            const file = match[1];
            const fileName = file.split('/').pop();
            const isActive = currentAudio && currentAudio.src.includes(fileName);

            btn.classList.toggle('active', isActive && !currentAudio.paused);
            setAudioBtnIcon(btn, (isActive && !currentAudio.paused) ? '⏸' : '▶');
        });
    }
};

export function setAudioBtnIcon(btn, icon) {
    if (!btn) return;
    const statusIcon = btn.querySelector('.music-status-icon');
    if (statusIcon) {
        statusIcon.innerHTML = icon;
    } else {
        btn.innerHTML = icon;
    }
}

export function reproducirAudioBotiquin(file, btn, isFromGlobalMenu = false) {
    const loopBtn = isFromGlobalMenu ? null : btn.parentElement.querySelector('.audio-loop-btn');
    const isLooping = loopBtn ? loopBtn.classList.contains('active') : true;
    const fileName = file.split('/').pop();

    if (currentAudio && currentAudio.src.includes(fileName)) {
        if (currentAudio.paused) {
            currentAudio.loop = isLooping;
            currentAudio.play().catch(e => console.error("Error play:", e));
            setAudioBtnIcon(btn, '⏸');
        } else {
            currentAudio.pause();
            setAudioBtnIcon(btn, '▶');
        }
        MUSICA.actualizarUI();
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        if (currentAudioBtn) setAudioBtnIcon(currentAudioBtn, '▶');
    }

    currentAudio = new Audio(file);
    currentAudio.loop = isLooping;
    currentAudio.volume = parseFloat(localStorage.getItem('dtv_volume') || '0.5');
    currentAudioBtn = btn;

    currentAudio.play()
        .then(() => {
            setAudioBtnIcon(btn, '⏸');
            MUSICA.actualizarUI();
        })
        .catch(err => {
            console.error("Error reproduciendo archivo:", err);
            setAudioBtnIcon(btn, '❌');
            setTimeout(() => setAudioBtnIcon(btn, '▶'), 2000);
            MUSICA.actualizarUI();
        });

    currentAudio.onended = () => {
        if (!currentAudio.loop) {
            setAudioBtnIcon(btn, '▶');
            currentAudio = null;
            currentAudioBtn = null;
        }
        MUSICA.actualizarUI();
    };

    currentAudio.onerror = (e) => {
        setAudioBtnIcon(btn, '⚠️');
        MUSICA.actualizarUI();
    };
}

export function toggleLoop(btn) {
    btn.classList.toggle('active');
    if (currentAudio && currentAudioBtn === btn.parentElement.querySelector('.audio-play-btn')) {
        currentAudio.loop = btn.classList.contains('active');
    }
}

// Exponer a window para compatibilidad
window.reproducirAudioBotiquin = reproducirAudioBotiquin;
window.toggleLoop = toggleLoop;
window.MUSICA = MUSICA;

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MUSICA.init());
} else {
    MUSICA.init();
}
