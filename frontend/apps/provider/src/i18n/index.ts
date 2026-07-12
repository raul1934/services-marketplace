import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { deviceLanguage, loadSavedLanguage, setApiLocale } from '@chamafacil/shared';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  // v3 avoids requiring Intl.PluralRules (absent in Hermes/Expo Go); our keys
  // don't use ICU plural categories, so behaviour is unchanged.
  compatibilityJSON: 'v3',
});

// Keep the API's X-Locale header in sync with the UI language so the backend
// localizes validation and business-rule errors to match.
setApiLocale(i18n.language);
i18n.on('languageChanged', (lng) => setApiLocale(lng));

// Re-apply a previously chosen language (overrides the device-locale default).
loadSavedLanguage().then((saved) => {
  if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
});

export default i18n;
