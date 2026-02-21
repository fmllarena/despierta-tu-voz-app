/**
 * DTV Config Module
 * Contiene constantes, configuraciones y estado global de la aplicación.
 */
export const MENSAJE_BIENVENIDA = window.MENSAJE_BIENVENIDA = `<p>Hola, ¡qué alegría que estés aquí! Soy tu Mentor Vocal.</p><br><p>Mi misión es acompañarte a descubrir todo el potencial de tu voz, desde la técnica hasta lo que sientes al cantar. Para empezar con buen pie... ¿hay algo específico que te haya traído hoy aquí o algún bloqueo que te gustaría trabajar conmigo?</p>`;

export const AUDIOS_BOTIQUIN = window.AUDIOS_BOTIQUIN = [
    { id: 'relajacion432', title: 'Relajación 432Hz', file: 'assets/audios/relajacion432.mp3', desc: 'Frecuencia de la naturaleza para calma profunda.' },
    { id: 'relajacion528', title: 'Relajación 528Hz', file: 'assets/audios/relajacion528.mp3', desc: 'Frecuencia de la transformación y reparación (ADN).' },
    { id: 'relajacion-animacion', title: 'Relajarse y animarse', file: 'assets/audios/relajacion-animacion.mp3', desc: 'Equilibrio entre calma y energía.' },
    { id: 'canciones-ancestrales', title: 'Canciones Ancestrales', file: 'assets/audios/canciones_ancestrales.mp3', desc: 'Conexión con la sabiduría de la voz original.' }
];

export let supabaseClient = window.supabaseClient = null;
export let userProfile = window.userProfile = null;
export let chatHistory = window.chatHistory = [];
export let isRecoveringPassword = window.isRecoveringPassword = false;
export let blogLibrary = window.blogLibrary = [];
