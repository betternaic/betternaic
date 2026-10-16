import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fil from './locales/fil.json';

// English strings live inline as t('key', 'English text') defaults, so only
// the Filipino file needs maintaining. A missing Filipino key falls back to
// the English default.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { common: {} }, fil: { common: fil } },
    supportedLngs: ['en', 'fil'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', lng => {
  document.documentElement.lang = lng.startsWith('fil') ? 'fil' : 'en';
});

export default i18n;
