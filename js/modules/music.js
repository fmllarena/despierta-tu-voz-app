import { ELEMENTS } from './elements.js';
import { AUDIOS_BOTIQUIN } from './config.js';

let currentAudio = null;
let currentAudioBtn = null;

export const MUSICA = window.MUSICA = {
    init: function () {
        this.renderMenu();
        this.setupListeners();
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

        // Cerrar al pulsar fuera
        window.addEventListener('click', (e) => {
            if (ELEMENTS.musicMenu && !ELEMENTS.musicMenu.contains(e.target) && e.target !== ELEMENTS.musicToggleBtn) {
                ELEMENTS.musicMenu.style.display = 'none';
                document.querySelectorAll('.music-item-container.active-submenu').forEach(el => el.classList.remove('active-submenu'));
            }
        });
    },

    seleccionarYReproducir: function (file, itemBtn) {
        reproducirAudioBotiquin(file, itemBtn, true);
        ELEMENTS.musicMenu.style.display = 'none';
    },

    detenerTodo: function () {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        if (currentAudioBtn) {
            setAudioBtnIcon(currentAudioBtn, '▶');
            currentAudioBtn = null;
        }
        this.actualizarUI();
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
