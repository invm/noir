import en from './en.json';
import i18next from 'i18next';

i18next.init({
  resources: { en },
  lng: 'en',
  fallbackLng: 'en',
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false,
  },
});

const t = i18next.t.bind(i18next);

export { t };
