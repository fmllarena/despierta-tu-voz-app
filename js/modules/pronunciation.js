/**
 * DTV - Pronunciation Module
 * Handles [PRONUNCIAR] tags in chat and plays synchronized audio using Google TTS.
 */

export const PRONUNCIATION = window.PRONUNCIATION = {
    init() {
        // This module will be called from main.js when parsing messages
    },

    /**
     * Extracts [PRONUNCIAR: word, lang] and replaces it with a Play button
     */
    parseTags(html) {
        // Regex super robusta: maneja [, [[, \[, espacios variados y mayúsculas
        const regex = /\\?\[{1,2}\s*PRONUNCIAR:\s*([^,\]]+),\s*([^\]]+?)\s*\\?\]{1,2}/gi;

        return html.replace(regex, (match, word, lang) => {
            const cleanWord = word.trim();
            const cleanLang = lang.trim().toLowerCase();

            // Escapamos comillas simples para el onclick
            const safeWord = cleanWord.replace(/'/g, "\\'");
            const safeLang = cleanLang.replace(/'/g, "\\'");

            return `
                <div class="pronunciation-widget" style="display:flex; align-items:center; gap:5px; margin: 8px 0; flex-wrap: wrap;">
                    <button class="play-pronunciation-btn" 
                            onclick="window.playPronunciation('${safeWord}', '${safeLang}', 1.0)"
                            style="cursor:pointer; background:#f8f9fa; border:1px solid #ddd; border-top-left-radius:18px; border-bottom-left-radius:18px; padding:6px 14px; font-size:0.9em; display:flex; align-items:center; gap:8px; margin-right: -5px;">
                        <span>🔊 Escuchar </span> <strong>${cleanWord}</strong>
                    </button>
                    <button class="slow-pronunciation-btn" 
                            onclick="window.playPronunciation('${safeWord}', '${safeLang}', 0.7)"
                            title="Escuchar más lento"
                            style="cursor:pointer; background:#fdfaf5; border:1px solid #ddd; border-left: none; border-top-right-radius:18px; border-bottom-right-radius:18px; padding:6px 10px; font-size:0.9em; display:flex; align-items:center;">
                        <span>🐌</span>
                    </button>
                </div>
            `;
        });
    },

    async play(text, lang, speed = 1.0) {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    languageCode: this.getLanguageCode(lang),
                    speakingRate: speed
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
window.playPronunciation = (text, lang, speed) => {
    PRONUNCIATION.play(text, lang, speed);
};
