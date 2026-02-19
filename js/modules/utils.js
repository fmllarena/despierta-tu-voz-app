import { ELEMENTS } from './elements.js';

/**
 * Muestra una alerta personalizada en lugar del alert nativo.
 * @param {string} mensaje 
 */
export function alertCustom(mensaje) {
    if (!ELEMENTS.customAlert || !ELEMENTS.alertMessage) {
        console.warn("CustomAlert no encontrado, usando alert nativo.");
        alert(mensaje);
        return;
    }
    ELEMENTS.alertMessage.innerText = mensaje;
    ELEMENTS.customAlert.style.display = 'flex';
}

/**
 * Convierte una cadena Base64 en un Blob.
 */
export function b64toBlob(b64, type = '', sliceSize = 512) {
    const byteChars = atob(b64);
    const byteArrays = [];
    for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
        const slice = byteChars.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type });
}

/**
 * Hace scroll al final del contenedor de chat.
 * @param {HTMLElement} element 
 */
export function scrollToBottom(element) {
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}
