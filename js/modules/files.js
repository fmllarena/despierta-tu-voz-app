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

        // Create Clip Button
        const clipBtn = document.createElement('button');
        clipBtn.id = 'clipBtn';
        clipBtn.className = 'clip-btn';
        clipBtn.innerHTML = '📎';
        clipBtn.title = 'Adjuntar partitura o ensayo';

        // Insert before mic button or at the end
        if (ELEMENTS.micBtn) {
            ELEMENTS.micBtn.parentNode.insertBefore(clipBtn, ELEMENTS.micBtn);
        }

        // Create Preview Container
        const previewContainer = document.createElement('div');
        previewContainer.id = 'filePreviewContainer';
        previewContainer.className = 'file-preview-container';
        previewContainer.style.display = 'none';
        ELEMENTS.chatInputArea.parentNode.insertBefore(previewContainer, ELEMENTS.chatInputArea);

        // Events
        clipBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });
    },

    handleFileSelection(file) {
        if (file.size > 15 * 1024 * 1024) {
            alert('El archivo es demasiado grande (máx 15MB)');
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
