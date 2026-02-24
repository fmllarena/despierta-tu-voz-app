/**
 * DTV - Pronunciation Module
 * Handles [PRONUNCIAR] tags in chat and plays synchronized audio using Google TTS.
 */

export const PRONUNCIATION = {
    init() {
        // This module will be called from main.js when parsing messages
    },

    /**
     * Extracts [PRONUNCIAR: word, lang] and replaces it with a Play button
     */
    parseTags(html) {
        // Regex más flexible: permite espacios, mayúsculas/minúsculas y variaciones tras el idioma
        const regex = /\[PRONUNCIAR:\s*([^,\]]+),\s*([^\]]+?)\s*\]/gi;
        return html.replace(regex, (match, word, lang) => {
            const cleanWord = word.trim();
            const cleanLang = lang.trim().toLowerCase();
            return `
                <div class="pronunciation-widget">
                    <button class="play-pronunciation-btn" 
                            onclick="window.playPronunciation('${cleanWord}', '${cleanLang}')">
                        <span>🔊 Escuchar pronunciación:</span> <strong>${cleanWord}</strong>
                    </button>
                </div>
            `;
        });
    },

    async play(text, lang) {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    languageCode: this.getLanguageCode(lang)
                })
            });

            const data = await response.json();
            if (data.audioContent) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                audio.play();
            } else {
                console.error("Error en TTS:", data.error);
                alert("No he podido generar el audio en este momento.");
            }
        } catch (err) {
            console.error("Error llamando a TTS:", err);
        }
    },

    getLanguageCode(lang) {
        const maps = {
            'en': 'en-US',
            'english': 'en-US',
            'inglés': 'en-US',
            'de': 'de-DE',
            'alemán': 'de-DE',
            'german': 'de-DE',
            'it': 'it-IT',
            'italiano': 'it-IT',
            'italian': 'it-IT',
            'fr': 'fr-FR',
            'francés': 'fr-FR',
            'french': 'fr-FR',
            'pt': 'pt-PT',
            'portugués': 'pt-PT',
            'portuguese': 'pt-PT',
            'es': 'es-ES',
            'español': 'es-ES',
            'spanish': 'es-ES'
        };
        return maps[lang] || 'en-US';
    }
};

// Global helper for the onclick handler
window.playPronunciation = (text, lang) => {
    PRONUNCIATION.play(text, lang);
};
