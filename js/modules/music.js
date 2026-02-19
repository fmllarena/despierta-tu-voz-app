import { ELEMENTS } from './elements.js';
import { AUDIOS_BOTIQUIN } from './config.js';

export let currentAudio = null;
export let currentAudioBtn = null;

export const MUSICA = {
    init: function () {
        this.renderMenu();
        this.setupListeners();
    },

    renderMenu: function () {
        if (!ELEMENTS.musicListItems) return;
        ELEMENTS.musicListItems.innerHTML = AUDIOS_BOTIQUIN.map(audio => `
            <button class="music-item" onclick="window.MUSICA.seleccionarYReproducir('${audio.file}', this)">
                <div class="music-info">
                    <strong>${audio.title}</strong>
                    <span class="music-desc">${audio.desc}</span>
                </div>
                <span class="music-status-icon">▶</span>
            </button>
        `).join('');
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
            }
        });
    },

    seleccionarYReproducir: function (file, btn) {
        // Encontrar info del audio
        const audioInfo = AUDIOS_BOTIQUIN.find(a => a.file === file);

        if (currentAudio && currentAudio.src.includes(file)) {
            if (currentAudio.paused) {
                currentAudio.play();
                this.actualizarUI();
            } else {
                currentAudio.pause();
                this.actualizarUI();
            }
            return;
        }

        // Si es uno nuevo, detener anterior
        this.detenerTodo();

        currentAudio = new Audio(file);
        currentAudio.loop = true;
        currentAudioBtn = btn;

        currentAudio.play();
        this.actualizarUI();

        // Feedback visual en el botón principal
        if (ELEMENTS.musicToggleBtn) {
            ELEMENTS.musicToggleBtn.classList.add('playing');
        }
    },

    actualizarUI: function () {
        // Resetear todos los botones de la lista
        const items = document.querySelectorAll('.music-item');
        items.forEach(item => {
            item.classList.remove('active');
            item.querySelector('.music-status-icon').innerText = '▶';
        });

        if (currentAudio && !currentAudio.paused) {
            if (currentAudioBtn) {
                currentAudioBtn.classList.add('active');
                currentAudioBtn.querySelector('.music-status-icon').innerText = '⏸';
            }
            ELEMENTS.musicToggleBtn.classList.add('playing');
        } else {
            if (currentAudioBtn) {
                currentAudioBtn.querySelector('.music-status-icon').innerText = '▶';
            }
            ELEMENTS.musicToggleBtn.classList.remove('playing');
        }
    },

    detenerTodo: function () {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        currentAudioBtn = null;
        this.actualizarUI();
        if (ELEMENTS.musicToggleBtn) {
            ELEMENTS.musicToggleBtn.classList.remove('playing');
        }
    }
};

// Exponer a window para los onclicks de HTML
window.MUSICA = MUSICA;
