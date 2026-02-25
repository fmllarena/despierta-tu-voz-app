export const TOUR = window.TOUR = {
    currentStep: 0,
    isActive: false,
    elements: null,
    steps: [
        {
            target: null,
            title: "¡Bienvenido/a!",
            text: "Soy tu Mentor Vocal. Vamos a realizar un breve recorrido para que sepas cómo puedo acompañarte en tu transformación."
        },
        {
            target: "#inspiracionBtn",
            title: "Inspiración del Día",
            text: "Cada día recibirás una frase motivadora personalizada según tu progreso (planes Pro/Transforma) o frases de grandes músicos si estás en el plan Explora."
        },
        {
            target: "#viajeBtn",
            title: "Tu Hoja de Ruta",
            text: "Aquí encontrarás los 5 Módulos de Sanación Vocal. Es el corazón de tu proceso de desbloqueo y crecimiento."
        },
        {
            target: "#progresoBtn",
            title: "Tu Evolución",
            text: "En este apartado registro tus hitos, cambios emocionales y el progreso técnico que vamos logrando juntos."
        },
        {
            target: "#botiquinBtn",
            title: "S.O.S Vocal",
            text: "¿Nervios antes de cantar o un bloqueo repentino? Pulsa aquí para recibir calma y pautas inmediatas."
        },
        {
            target: "#musicToggleBtn",
            title: "Música de Alquimia",
            text: "Elige una frecuencia sonora para que te acompañe mientras chateas. ¡La música no se detendrá aunque navegues por la app!"
        },
        {
            target: "#sesionBtn",
            title: "Tutorías Privadas",
            text: "Gestiona aquí tus encuentros personales 1/1 conmigo para profundizar en tu voz y mentalidad."
        },
        {
            target: "#upgradeBtn",
            title: "Mejorar Plan",
            text: "Sube de nivel para desbloquear la memoria profunda ilimitada y funciones exclusivas de acompañamiento."
        },
        {
            target: "#ajustesBtn",
            title: "A tu Medida",
            text: "Cambia mi idioma, ajusta mi personalidad (más técnico o motivador) y define tus objetivos semanales."
        },
        {
            target: "#mainHelpBtn",
            title: "Guía Rápida",
            text: "Si alguna vez olvidas para qué sirve un icono, esta señal te mostrará un resumen visual de cada función."
        },
        {
            target: "#chatMentoriaInput",
            title: "Caja de Chat",
            text: "Escríbeme aquí tus dudas, sensaciones tras ensayar o simplemente cómo te sientes hoy. ¡Estoy aquí para ti!"
        },
        {
            target: "#micBtn",
            title: "Habla conmigo",
            text: "Si no te apetece escribir, pulsa el micro y transcribiré tus palabras para que nuestra charla sea más fluida."
        },
        {
            target: "#quickUploadBtn",
            title: "Tus Archivos",
            text: "Haz clic aquí para compartir conmigo una partitura en PDF o un audio de tu ensayo. Lo analizaré para darte feedback específico."
        },
        {
            target: "#quickPhoneticsBtn",
            title: "Maestría en Idiomas",
            text: "¿Dudas con la letra? Selecciona un idioma y te explicaré la fonética paso a paso, con audios para que escuches la pronunciación correcta."
        },
        {
            target: "#logoutBtn",
            title: "Guardar y Salir",
            text: "<strong>MUY IMPORTANTE</strong>: Cierra sesión siempre aquí para que pueda procesar y guardar todo nuestro avance."
        }
    ],

    init() {
        if (localStorage.getItem('dtv_tour_seen') === 'true') return;

        // Crear elementos del DOM si no existen
        if (!document.getElementById('dtvTourOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'dtvTourOverlay';
            overlay.className = 'dtv-tour-overlay';

            overlay.innerHTML = `
                <div id="dtvTourSpotlight" class="dtv-tour-spotlight"></div>
                <div id="dtvTourBubble" class="dtv-tour-bubble">
                    <div class="dtv-tour-content">
                        <h4 id="dtvTourTitle"></h4>
                        <p id="dtvTourText"></p>
                    </div>
                    <div class="dtv-tour-footer">
                        <span id="dtvTourProgress" class="dtv-tour-progress"></span>
                        <div class="dtv-tour-nav">
                            <button id="dtvTourPrev" class="dtv-tour-btn btn-prev">Ant.</button>
                            <button id="dtvTourNext" class="dtv-tour-btn btn-next">Sig.</button>
                        </div>
                    </div>
                    <a id="dtvTourSkip" class="dtv-tour-skip">Saltar tutorial</a>
                </div>
            `;
            document.body.appendChild(overlay);

            // Listeners
            document.getElementById('dtvTourNext').addEventListener('click', () => this.next());
            document.getElementById('dtvTourPrev').addEventListener('click', () => this.prev());
            document.getElementById('dtvTourSkip').addEventListener('click', () => this.end());
            window.addEventListener('resize', () => { if (this.isActive) this.render(); });
        }

        this.elements = {
            overlay: document.getElementById('dtvTourOverlay'),
            spotlight: document.getElementById('dtvTourSpotlight'),
            bubble: document.getElementById('dtvTourBubble'),
            title: document.getElementById('dtvTourTitle'),
            text: document.getElementById('dtvTourText'),
            progress: document.getElementById('dtvTourProgress'),
            btnPrev: document.getElementById('dtvTourPrev'),
            btnNext: document.getElementById('dtvTourNext')
        };
    },

    start() {
        this.init();
        if (localStorage.getItem('dtv_tour_seen') === 'true') return;

        console.log("🚀 Iniciando Tour de Bienvenida...");
        this.isActive = true;
        this.elements.overlay.classList.add('active');
        this.currentStep = 0;
        this.render();
    },

    render() {
        const step = this.steps[this.currentStep];
        const targetEl = step.target ? document.querySelector(step.target) : null;

        // Si el target existe pero no es visible, saltar al siguiente (o anterior si venimos de atrás)
        if (step.target && (!targetEl || targetEl.offsetParent === null)) {
            console.log("Paso " + this.currentStep + " saltado (elemento oculto)");
            if (this.currentStep > 0 && this._direction === 'prev') {
                this.prev();
            } else {
                this.next();
            }
            return;
        }

        // Actualizar contenido
        this.elements.title.innerText = step.title;
        this.elements.text.innerHTML = step.text;

        // El paso 0 no cuenta en el total de 10 pasos para el texto (X/10)
        const displayIndex = this.currentStep;
        const totalSteps = this.steps.length - 1;
        this.elements.progress.innerText = displayIndex === 0 ? "" : displayIndex + " / " + totalSteps;

        // Botones
        this.elements.btnPrev.style.display = this.currentStep === 0 ? 'none' : 'block';
        this.elements.btnNext.innerText = this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Siguiente';

        // Posicionar Spotlight
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const padding = 5;
            this.elements.spotlight.style.width = (rect.width + padding * 2) + "px";
            this.elements.spotlight.style.height = (rect.height + padding * 2) + "px";
            this.elements.spotlight.style.top = (rect.top - padding) + "px";
            this.elements.spotlight.style.left = (rect.left - padding) + "px";
            this.elements.spotlight.style.opacity = "1";
            this.elements.bubble.classList.remove('centered');
            this.positionBubble(rect);
        } else {
            // Paso central (Bienvenida)
            this.elements.spotlight.style.width = "0";
            this.elements.spotlight.style.height = "0";
            this.elements.spotlight.style.top = "50%";
            this.elements.spotlight.style.left = "50%";
            this.elements.spotlight.style.opacity = "0";
            this.elements.bubble.classList.add('centered');
            this.elements.bubble.style.top = "50%";
            this.elements.bubble.style.left = "50%";
        }

        this.elements.bubble.classList.add('active');
    },

    positionBubble(targetRect) {
        const bubble = this.elements.bubble;
        const bubbleWidth = bubble.offsetWidth || 300;
        const bubbleHeight = bubble.offsetHeight || 150;
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        let top, left;
        bubble.className = 'dtv-tour-bubble active'; // Reset arrows

        // Estrategia: intentar debajo, si no arriba, si no a los lados
        if (targetRect.bottom + bubbleHeight + 20 < viewHeight) {
            // Debajo
            top = targetRect.bottom + 20;
            left = Math.max(10, Math.min(viewWidth - bubbleWidth - 10, targetRect.left + targetRect.width / 2 - bubbleWidth / 2));
            bubble.classList.add('arrow-top');
        } else if (targetRect.top - bubbleHeight - 20 > 0) {
            // Arriba
            top = targetRect.top - bubbleHeight - 20;
            left = Math.max(10, Math.min(viewWidth - bubbleWidth - 10, targetRect.left + targetRect.width / 2 - bubbleWidth / 2));
            bubble.classList.add('arrow-bottom');
        } else {
            // Fallback: Centro si no hay espacio
            top = viewHeight / 2 - bubbleHeight / 2;
            left = viewWidth / 2 - bubbleWidth / 2;
        }

        bubble.style.top = top + "px";
        bubble.style.left = left + "px";
    },

    next() {
        this._direction = 'next';
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.render();
        } else {
            this.end();
        }
    },

    prev() {
        this._direction = 'prev';
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    },

    end() {
        this.isActive = false;
        this.elements.overlay.classList.remove('active');
        localStorage.setItem('dtv_tour_seen', 'true');
        console.log("Tour finalizado.");
    }
};
