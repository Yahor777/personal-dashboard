import type { Language } from "../types";

type Translations = Record<string, string>;

const baseTranslations: Record<Language, Translations> = {
  ru: {
    "sidebar.dashboard": "Главная",
    "sidebar.tasks": "Задачи",
    "sidebar.analytics": "Аналитика",
    "sidebar.settings": "Настройки",
    "actions.save": "Сохранить",
    "actions.cancel": "Отмена",
    "auth.login": "Войти",
    "auth.logout": "Выйти",
    "auth.register": "Регистрация",
  },
  pl: {
    "sidebar.dashboard": "Pulpit",
    "sidebar.tasks": "Zadania",
    "sidebar.analytics": "Analityka",
    "sidebar.settings": "Ustawienia",
    "actions.save": "Zapisz",
    "actions.cancel": "Anuluj",
    "auth.login": "Zaloguj",
    "auth.logout": "Wyloguj",
    "auth.register": "Rejestracja",
  },
  en: {
    "sidebar.dashboard": "Dashboard",
    "sidebar.tasks": "Tasks",
    "sidebar.analytics": "Analytics",
    "sidebar.settings": "Settings",
    "actions.save": "Save",
    "actions.cancel": "Cancel",
    "auth.login": "Log In",
    "auth.logout": "Log Out",
    "auth.register": "Register",
  },
};

const fallbackLocale: Language = "en";

export function useTranslation(locale: Language = fallbackLocale) {
  const dictionary = baseTranslations[locale] ?? baseTranslations[fallbackLocale];

  const t = (key: string): string => {
    if (dictionary[key]) {
      return dictionary[key];
    }
    const fallback = baseTranslations[fallbackLocale][key];
    return fallback ?? key;
  };

  return { t };
}