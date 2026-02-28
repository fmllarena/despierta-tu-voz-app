console.log("🔵 config.js: Módulo CARGADO.");
/**
 * DTV Config Module
 * Contiene constantes, configuraciones y estado global de la aplicación.
 */
export const MENSAJE_BIENVENIDA = window.MENSAJE_BIENVENIDA = `<p>Hola, ¡qué alegría que estés aquí! Soy tu Mentor Vocal.</p><br><p>Mi misión es acompañarte a descubrir todo el potencial de tu voz, desde la técnica hasta lo que sientes al cantar. Para empezar con buen pie... ¿hay algo específico que te haya traído hoy aquí o algún bloqueo que te gustaría trabajar conmigo?</p>`;

export const LOGO_URL = 'https://despiertatuvoz.com/wp-content/uploads/2024/12/LOGO-BLANCO-WEBP-ACTUAL.webp';

export const TIER_NAMES = window.TIER_NAMES = {
    'free': 'Explora',
    'pro': 'Profundiza',
    'premium': 'Transforma',
    'transforma': 'Transforma',
    'profundiza': 'Profundiza'
};

export const AUDIOS_BOTIQUIN = window.AUDIOS_BOTIQUIN = [
    {
        isCategory: true,
        title: 'Relajación',
        id: 'cat-relajacion',
        items: [
            { id: 'relajacion432', title: 'Relajación 432Hz', file: 'assets/audios/relajacion432.mp3', desc: 'Frecuencia de la naturaleza para calma profunda.' },
            { id: 'relajacion528', title: 'Relajación 528Hz', file: 'assets/audios/relajacion528.mp3', desc: 'Frecuencia de la transformación y reparación (ADN).' },
            { id: 'relajacion-animacion', title: 'Relajarse y animarse', file: 'assets/audios/relajacion-animacion.mp3', desc: 'Equilibrio entre calma y energía.' },
            { id: 'nube-calma', title: 'Nube de Calma', file: 'assets/audios/Nube de Calma.mp3', desc: 'Meditación guiada para relajar la mente y el cuerpo.' }
        ]
    },
    {
        isCategory: true,
        title: 'Chill out',
        id: 'cat-chillout',
        items: [
            { id: 'dentro-de-mi', title: 'Dentro de mí', file: 'assets/audios/Dentro de mi.mp3', desc: 'Un viaje interior sereno.' },
            { id: 'conocete', title: 'Conócete', file: 'assets/audios/conocete.mp3', desc: 'Espacio para la introspección.' }
        ]
    },
    { id: 'canciones-ancestrales', title: 'Canciones Ancestrales', file: 'assets/audios/canciones_ancestrales.mp3', desc: 'Conexión con la sabiduría de la voz original.' },
    {
        isCategory: true,
        title: 'Ecos del Tíbet',
        id: 'cat-tibet',
        items: [
            { id: 'ecos-tibet', title: 'Ecos del Tíbet', file: 'assets/audios/Ecos del Tíbet.mp3', desc: 'Sonidos inmersivos para la concentración.' },
            { id: 'esencia-natural', title: 'Esencia Natural', file: 'assets/audios/Esencia Natural.mp3', desc: 'Conexión pura con el entorno zen.' }
        ]
    }
];

export let supabaseClient = window.supabaseClient = null;
export let userProfile = window.userProfile = null;
export let chatHistory = window.chatHistory = [];
export let isRecoveringPassword = window.isRecoveringPassword = false;
export let blogLibrary = window.blogLibrary = [];

