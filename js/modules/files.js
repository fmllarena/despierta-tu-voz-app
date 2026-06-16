/**
 * DTV - Files Module
 * Handles file selection, Base64 conversion, and UI previews for multi-modal analysis.
 */

import { ELEMENTS } from './elements.js';

export const FILES = window.FILES = {
    selectedFile: null,

    init() {
        if (!ELEMENTS.chatInputArea) return;

        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'dtvFileInput';
        fileInput.accept = '.pdf, .mp3, .wav, .m4a, .png, .jpg, .jpeg';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Create Preview Container (keep this as it's useful)
        const previewContainer = document.createElement('div');
        previewContainer.id = 'filePreviewContainer';
        previewContainer.className = 'file-preview-container';
        previewContainer.style.display = 'none';
        ELEMENTS.chatInputArea.parentNode.insertBefore(previewContainer, ELEMENTS.chatInputArea);

        // Events - Use both the old one (if it exists) and the new quick button
        const clipBtn = document.getElementById('clipBtn') || ELEMENTS.quickUploadBtn;
        if (clipBtn) {
            clipBtn.addEventListener('click', () => fileInput.click());
        }

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });
    },

    handleFileSelection(file) {
        // En Vercel Hobby el límite de payload es 4.5MB. 
        // El Base64 añade un 33%, así que el límite seguro es ~3.4MB.
        const MAX_SIZE = 3.5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            alert('El archivo es demasiado grande para el plan actual (máx 3.5MB). Por favor, usa un clip más corto o comprime el PDF.');
            return;
        }

        this.selectedFile = file;
        this.renderPreview();
    },

    renderPreview() {
        const container = document.getElementById('filePreviewContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="file-preview-item">
                <span class="file-icon">${this.getFileIcon(this.selectedFile.type)}</span>
                <span class="file-name">${this.selectedFile.name}</span>
                <button class="remove-file-btn">✕</button>
            </div>
        `;
        container.style.display = 'flex';

        container.querySelector('.remove-file-btn').addEventListener('click', () => {
            this.clearFile();
        });
    },

    getFileIcon(type) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('audio')) return '🎵';
        if (type.includes('image')) return '🖼️';
        return '📁';
    },

    clearFile() {
        this.selectedFile = null;
        const container = document.getElementById('filePreviewContainer');
        if (container) container.style.display = 'none';
        const fileInput = document.getElementById('dtvFileInput');
        if (fileInput) fileInput.value = '';
    },

    async getFileData() {
        if (!this.selectedFile) return null;

        if (this.selectedFile.type === 'application/pdf') {
            try {
                const arrayBuffer = await this.selectedFile.arrayBuffer();
                if (!window.pdfjsLib) {
                    throw new Error("Librería PDF.js no cargada en el cliente.");
                }
                const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const maxPages = Math.min(pdf.numPages, 6); // Límite de 6 páginas
                const pages = [];

                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    // Usar escala 1.0 para mantener el peso bajo y evitar límites de Vercel (Hobby 1MB, Pro 4.5MB)
                    const viewport = page.getViewport({ scale: 1.0 });

                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');

                    await page.render({ canvasContext: ctx, viewport }).promise;

                    // Convertir canvas a JPEG de calidad media-alta (0.8)
                    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                    pages.push({
                        mimeType: 'image/jpeg',
                        data: base64,
                        name: `${this.selectedFile.name} (Pág ${i})`
                    });
                }
                return pages;
            } catch (err) {
                console.error("Error al procesar PDF en el navegador:", err);
                throw new Error("No se pudo procesar el archivo PDF. Inténtalo de nuevo o sube una imagen de la partitura.");
            }
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = reader.result.split(',')[1];
                resolve({
                    mimeType: this.selectedFile.type || 'application/octet-stream',
                    data: base64Data,
                    name: this.selectedFile.name
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(this.selectedFile);
        });
    }
};
