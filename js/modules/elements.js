console.log("🔵 elements.js: Módulo CARGADO.");
/**
 * DTV UI Elements Module
 * Contiene todas las referencias al DOM utilizadas en la aplicación.
 * Se usan getters para asegurar que se obtengan los elementos más recientes si el DOM cambia.
 */
export const ELEMENTS = window.ELEMENTS = {
    get chatBox() { return document.getElementById('chatBox'); },
    get chatInput() { return document.getElementById('chatMentoriaInput'); },
    get chatInputArea() { return document.querySelector('.input-area'); },
    get sendBtn() { return document.getElementById('sendBtn'); },
    get micBtn() { return document.getElementById('micBtn'); },
    get authOverlay() { return document.getElementById('authOverlay'); },
    get authError() { return document.getElementById('authError'); },
    get mainHelpBtn() { return document.getElementById('mainHelpBtn'); },
    get mainHelpTooltip() { return document.getElementById('mainHelpTooltip'); },
    get headerButtons() { return document.querySelector('.header-buttons'); },
    navButtons: {
        get inspiracion() { return document.getElementById('inspiracionBtn'); },
        get viaje() { return document.getElementById('viajeBtn'); },
        get progreso() { return document.getElementById('progresoBtn'); },
        get botiquin() { return document.getElementById('botiquinBtn'); },
        get logout() { return document.getElementById('logoutBtn'); }
    },
    get loginFields() { return document.getElementById('loginFields'); },
    get forgotPasswordLink() { return document.getElementById('forgotPasswordLink'); },
    get resetPasswordContainer() { return document.getElementById('resetPasswordContainer'); },
    get updatePasswordBtn() { return document.getElementById('updatePasswordBtn'); },
    get upgradeBtn() { return document.getElementById('upgradeBtn'); },
    get whatsappReportBtn() { return document.getElementById('whatsappReportBtn'); },
    get upgradeModal() { return document.getElementById('upgradeModal'); },
    get closeUpgrade() { return document.querySelector('.close-upgrade'); },
    get sesionBtn() { return document.getElementById('sesionBtn'); },
    get sesionModal() { return document.getElementById('sesionModal'); },
    get closeSesion() { return document.getElementById('closeSesion'); },
    get sessionQuotaInfo() { return document.getElementById('sessionQuotaInfo'); },
    get book30Btn() { return document.getElementById('book30Btn'); },
    get book60Btn() { return document.getElementById('book60Btn'); },
    get buyExtra30Btn() { return document.getElementById('buyExtra30Btn'); },
    get buyExtra60Btn() { return document.getElementById('buyExtra60Btn'); },

    // Payment Modal (In-App)
    get paymentModal() { return document.getElementById('paymentModal'); },
    get closePayment() { return document.getElementById('closePayment'); },
    get paymentForm() { return document.getElementById('payment-form'); },
    get paymentElement() { return document.getElementById('payment-element'); },
    get submitPayment() { return document.getElementById('submit-payment'); },
    get paymentSpinner() { return document.getElementById('payment-spinner'); },
    get paymentMessage() { return document.getElementById('payment-message'); },
    get buttonText() { return document.getElementById('button-text'); },

    get ajustesBtn() { return document.getElementById('ajustesBtn'); },
    get settingsModal() { return document.getElementById('settingsModal'); },
    get closeSettings() { return document.querySelector('.close-settings'); },
    get saveSettingsBtn() { return document.getElementById('saveSettingsBtn'); },
    get clearHistoryBtn() { return document.getElementById('clearHistoryBtn'); },
    get settingsUserName() { return document.getElementById('settingsUserName'); },
    get settingsUserTier() { return document.getElementById('settingsUserTier'); },
    get focusSlider() { return document.getElementById('focusSlider'); },
    get personalitySlider() { return document.getElementById('personalitySlider'); },
    get lengthSlider() { return document.getElementById('lengthSlider'); },
    get languageSelect() { return document.getElementById('languageSelect'); },
    get weeklyGoalInput() { return document.getElementById('weeklyGoalInput'); },
    get upgradeSettingsBtn() { return document.getElementById('upgradeSettingsBtn'); },

    // Legal Modal
    get legalModal() { return document.getElementById('legalModal'); },
    get checkTerms() { return document.getElementById('checkTerms'); },
    get checkMedical() { return document.getElementById('checkMedical'); },
    get confirmLegalBtn() { return document.getElementById('confirmLegalBtn'); },
    get cancelLegalBtn() { return document.getElementById('cancelLegalBtn'); },

    // Soporte Híbrido
    get supportBubble() { return document.getElementById('supportBubble'); },
    get supportModal() { return document.getElementById('supportModal'); },
    get supportChatBox() { return document.getElementById('supportChatBox'); },
    get supportInput() { return document.getElementById('supportInput'); },
    get sendSupportBtn() { return document.getElementById('sendSupportBtn'); },
    get whatsappSupportLink() { return document.getElementById('whatsappSupportLink'); },
    get closeSupport() { return document.querySelector('.close-support'); },

    // Modal de Inspiración
    get inspiracionModal() { return document.getElementById('inspiracionModal'); },
    get inspiracionFrase() { return document.querySelector('.inspiracion-frase'); },
    get inspiracionAutor() { return document.querySelector('.inspiracion-autor'); },
    get closeInspiracion() { return document.getElementById('closeInspiracion'); },

    // Botiquín Modal
    get botiquinModal() { return document.getElementById('botiquinModal'); },
    get botiquinContent() { return document.getElementById('botiquinContent'); },
    get closeBotiquin() { return document.querySelector('.close-botiquin'); },

    // Preferencias Modal
    get openPreferencesBtn() { return document.getElementById('openPreferencesBtn'); },
    get preferencesModal() { return document.getElementById('preferencesModal'); },
    get closePreferences() { return document.querySelector('.close-preferences'); },
    get marketingToggle() { return document.getElementById('marketingToggle'); },
    get lifecycleToggle() { return document.getElementById('lifecycleToggle'); },
    get savePreferencesBtn() { return document.getElementById('savePreferencesBtn'); },
    get prefStatusMessage() { return document.getElementById('prefStatusMessage'); },
    get deleteAccountBtn() { return document.getElementById('deleteAccountBtn'); },

    // Alert Custom
    get customAlert() { return document.getElementById('customAlert'); },
    get alertMessage() { return document.getElementById('alertMessage'); },
    get alertConfirmBtn() { return document.getElementById('alertConfirmBtn'); },
    get promoTermsBox() { return document.getElementById('promoTermsBox'); },

    // Top Bar Music Player
    get musicToggleBtn() { return document.getElementById('musicToggleBtn'); },
    get musicMenu() { return document.getElementById('musicMenu'); },
    get musicListItems() { return document.getElementById('musicListItems'); },
    get stopMusicBtn() { return document.getElementById('stopMusicBtn'); },

    // Quick Actions
    get quickUploadBtn() { return document.getElementById('quickUploadBtn'); },
    get quickPhoneticsBtn() { return document.getElementById('quickPhoneticsBtn'); },
    get phoneticsMenu() { return document.getElementById('phoneticsMenu'); }
};
