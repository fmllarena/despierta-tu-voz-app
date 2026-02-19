import { state } from './state.js';

export const TOUR = {
    currentStep: 0,
    isActive: false,
    elements: null,
    steps: [
        { target: null, title: "¡Bienvenido/a!", text: "Soy tu Mentor Vocal..." },
        { target: "#viajeBtn", title: "Tu Hoja de Ruta", text: "Aquí encontrarás los 5 Módulos..." }
        // ... rest of steps
    ],

    init() {
        if (localStorage.getItem('dtv_tour_seen') === 'true') return;
        // Logic to create tour DOM elements
    },

    start() {
        if (localStorage.getItem('dtv_tour_seen') === 'true') return;
        this.init();
        this.isActive = true;
        // ...
    },

    end() {
        this.isActive = false;
        localStorage.setItem('dtv_tour_seen', 'true');
    }
};
