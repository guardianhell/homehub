import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import idTranslation from "./locales/id.json";
import enTranslation from "./locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    id: { translation: idTranslation },
    en: { translation: enTranslation },
  },
  lng: "id",
  fallbackLng: "id",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
