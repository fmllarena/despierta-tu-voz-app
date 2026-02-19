import { ELEMENTS } from './elements.js';
import { state } from './state.js';
import { LOGO_URL } from './config.js';

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

/**
 * Exporta el chat actual a un documento .doc
 */
export async function exportarChatDoc() {
    try {
        const { data: mensajes } = await state.supabase
            .from('mensajes')
            .select('*')
            .eq('alumno', state.userProfile.user_id)
            .order('created_at', { ascending: false });

        if (!mensajes) return;

        // Filtrar mensajes de la sesión actual (desde el último resumen diario)
        const indexUltimoResumen = mensajes.findIndex(m => m.emisor === 'resumen_diario');
        const mensajesFinales = indexUltimoResumen === -1 ? mensajes : mensajes.slice(0, indexUltimoResumen);
        mensajesFinales.reverse();

        let htmlBody = `
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #8e7d6d; padding-bottom: 20px; margin-bottom: 30px; }
                    .metadata { margin-bottom: 20px; font-size: 10pt; color: #666; }
                    .message-box { margin-bottom: 15px; padding: 10px; border-radius: 5px; }
                    .label { font-weight: bold; font-size: 9pt; display: block; margin-bottom: 5px; }
                    .mentor-label { color: #8e7d6d; }
                    .usuario-label { color: #2c3e50; }
                    .content { font-size: 11pt; white-space: pre-wrap; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${LOGO_URL}" width="100">
                    <h1 style="color:#8e7d6d; font-size:18pt;">Bitácora de Alquimia Vocal</h1>
                </div>
                <div class='metadata'>
                    Alumno: ${state.userProfile.nombre || state.userProfile.email}<br>
                    Fecha: ${new Date().toLocaleDateString('es-ES')}
                </div>
        `;

        mensajesFinales.forEach(msg => {
            if (msg.emisor === 'resumen_diario' || msg.emisor === 'sistema') return;
            const isMentor = msg.emisor === 'ia';
            const cleanText = msg.texto.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

            htmlBody += `
                <div class='message-box'>
                    <span class='label ${isMentor ? 'mentor-label' : 'usuario-label'}'>${isMentor ? 'MENTOR VOCAL' : 'ALUMNO'}</span>
                    <div class='content'>${cleanText}</div>
                </div>
            `;
        });

        htmlBody += `</body></html>`;
        const blob = new Blob(['\ufeff', htmlBody], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sesion_DTV_${state.userProfile.nombre || 'Alquimia'}.doc`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Error exportando doc:", e);
        alertCustom("Hubo un error al preparar tu documento.");
    }
}

window.exportarChatDoc = exportarChatDoc;
