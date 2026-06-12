import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

const SUPPORTED = ['en', 'es'] as const;

function browserLang(): string {
  const lang = navigator.language.split('-')[0];
  return SUPPORTED.includes(lang as typeof SUPPORTED[number]) ? lang : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: localStorage.getItem('language') ?? browserLang(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Applies a language preference.
 * - `pref` non-null (explicit user choice): persist + activate.
 * - `pref` null ("auto"): clear stored preference, follow the browser.
 * Used on login to sync the DB language across devices and from SettingsPage.
 */
export function applyLanguage(pref: string | null) {
  if (pref && SUPPORTED.includes(pref as typeof SUPPORTED[number])) {
    localStorage.setItem('language', pref);
    if (i18n.language !== pref) i18n.changeLanguage(pref);
  } else {
    localStorage.removeItem('language');
    const lang = browserLang();
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }
}

export default i18n;
