import type { Language } from '../types';

export const translations = {
  ru: {
    // Navigation
    dashboard: 'Главная',
    settings: 'Настройки',
    export: 'Экспорт',
    import: 'Импорт',
    analytics: 'Аналитика',
    aiAssistant: 'AI Ассистент',
    
    // Actions
    add: 'Добавить',
    edit: 'Редактировать',
    delete: 'Удалить',
    save: 'Сохранить',
    cancel: 'Отменить',
    search: 'Поиск',
    filter: 'Фильтр',
    create: 'Создать',
    duplicate: 'Дублировать',
    
    // Tabs
    newTab: 'Новая вкладка',
    renameTab: 'Переименовать вкладку',
    deleteTab: 'Удалить вкладку',
    tabSettings: 'Настройки вкладки',
    
    // Templates
    templateSchool: 'Учёба',
    templateCooking: 'Готовка',
    templatePersonal: 'Личное',
    templateBlank: 'Пустой',
    templatePcRepair: 'ПК Ремонт',
    templateMarketplace: 'Маркетплейс',
    
    // Columns
    newColumn: 'Новая колонка',
    renameColumn: 'Переименовать колонку',
    deleteColumn: 'Удалить колонку',
    
    // Cards
    newCard: 'Новая карточка',
    cardTitle: 'Название',
    cardDescription: 'Описание',
    cardType: 'Тип',
    cardPriority: 'Приоритет',
    cardTags: 'Теги',
    cardDueDate: 'Срок',
    cardAttachments: 'Вложения',
    cardChecklist: 'Чек-лист',
    cardComments: 'Комментарии',
    
    // Card Types
    typeTask: 'Задача',
    typeFlashcard: 'Карточка',
    typeRecipe: 'Рецепт',
    typeNote: 'Заметка',
    typePcComponent: 'ПК Компонент',
    
    // Priority
    priorityLow: 'Низкий',
    priorityMedium: 'Средний',
    priorityHigh: 'Высокий',
    
    // Settings
    theme: 'Тема',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    language: 'Язык',
    accentColor: 'Акцентный цвет',
    fontFamily: 'Шрифт',
    highContrast: 'Высокая контрастность',
    notifications: 'Уведомления',
    
    // Empty states
    emptyTab: 'Нет вкладок. Создайте первую вкладку!',
    emptyColumn: 'Нет карточек. Добавьте новую карточку.',
    emptySearch: 'Ничего не найдено.',
    
    // Onboarding
    onboardingStep1: 'Шаг 1: Создайте вкладку',
    onboardingStep2: 'Шаг 2: Добавьте карточку',
    onboardingStep3: 'Шаг 3: Перетащите карточку',
    onboardingComplete: 'Готово!',
    
    // Analytics
    totalCards: 'Всего карточек',
    completedCards: 'Выполнено',
    completionRate: 'Прогресс',
    timeSpent: 'Время',
    
    // Smart features
    generateChecklist: 'Генерировать чек-лист',
    createFlashcards: 'Создать карточки',
    extractIngredients: 'Извлечь ингредиенты',
    startPomodoro: 'Запустить Pomodoro',
  },
  
  pl: {
    dashboard: 'Pulpit',
    settings: 'Ustawienia',
    export: 'Eksport',
    import: 'Import',
    analytics: 'Analityka',
    
    add: 'Dodaj',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz',
    cancel: 'Anuluj',
    search: 'Szukaj',
    filter: 'Filtr',
    create: 'Utwórz',
    duplicate: 'Duplikuj',
    
    newTab: 'Nowa zakładka',
    renameTab: 'Zmień nazwę zakładki',
    deleteTab: 'Usuń zakładkę',
    tabSettings: 'Ustawienia zakładki',
    
    templateSchool: 'Szkoła',
    templateCooking: 'Gotowanie',
    templatePersonal: 'Osobiste',
    templateBlank: 'Puste',
    
    newColumn: 'Nowa kolumna',
    renameColumn: 'Zmień nazwę kolumny',
    deleteColumn: 'Usuń kolumnę',
    
    newCard: 'Nowa karta',
    cardTitle: 'Tytuł',
    cardDescription: 'Opis',
    cardType: 'Typ',
    cardPriority: 'Priorytet',
    cardTags: 'Tagi',
    cardDueDate: 'Termin',
    cardAttachments: 'Załączniki',
    cardChecklist: 'Lista kontrolna',
    cardComments: 'Komentarze',
    
    typeTask: 'Zadanie',
    typeFlashcard: 'Fiszka',
    typeRecipe: 'Przepis',
    typeNote: 'Notatka',
    
    priorityLow: 'Niski',
    priorityMedium: 'Średni',
    priorityHigh: 'Wysoki',
    
    theme: 'Motyw',
    themeLight: 'Jasny',
    themeDark: 'Ciemny',
    language: 'Język',
    accentColor: 'Kolor akcentu',
    fontFamily: 'Czcionka',
    highContrast: 'Wysoki kontrast',
    notifications: 'Powiadomienia',
    
    emptyTab: 'Brak zakładek. Utwórz pierwszą zakładkę!',
    emptyColumn: 'Brak kart. Dodaj nową kartę.',
    emptySearch: 'Nic nie znaleziono.',
    
    onboardingStep1: 'Krok 1: Utwórz zakładkę',
    onboardingStep2: 'Krok 2: Dodaj kartę',
    onboardingStep3: 'Krok 3: Przeciągnij kartę',
    onboardingComplete: 'Gotowe!',
    
    totalCards: 'Wszystkie karty',
    completedCards: 'Ukończone',
    completionRate: 'Postęp',
    timeSpent: 'Czas',
    
    generateChecklist: 'Generuj listę kontrolną',
    createFlashcards: 'Utwórz fiszki',
    extractIngredients: 'Wyodrębnij składniki',
    startPomodoro: 'Uruchom Pomodoro',
  },
  
  en: {
    dashboard: 'Dashboard',
    settings: 'Settings',
    export: 'Export',
    import: 'Import',
    analytics: 'Analytics',
    
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    create: 'Create',
    duplicate: 'Duplicate',
    
    newTab: 'New Tab',
    renameTab: 'Rename Tab',
    deleteTab: 'Delete Tab',
    tabSettings: 'Tab Settings',
    
    templateSchool: 'School',
    templateCooking: 'Cooking',
    templatePersonal: 'Personal',
    templateBlank: 'Blank',
    
    newColumn: 'New Column',
    renameColumn: 'Rename Column',
    deleteColumn: 'Delete Column',
    
    newCard: 'New Card',
    cardTitle: 'Title',
    cardDescription: 'Description',
    cardType: 'Type',
    cardPriority: 'Priority',
    cardTags: 'Tags',
    cardDueDate: 'Due Date',
    cardAttachments: 'Attachments',
    cardChecklist: 'Checklist',
    cardComments: 'Comments',
    
    typeTask: 'Task',
    typeFlashcard: 'Flashcard',
    typeRecipe: 'Recipe',
    typeNote: 'Note',
    
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    accentColor: 'Accent Color',
    fontFamily: 'Font',
    highContrast: 'High Contrast',
    notifications: 'Notifications',
    
    emptyTab: 'No tabs. Create your first tab!',
    emptyColumn: 'No cards. Add a new card.',
    emptySearch: 'Nothing found.',
    
    onboardingStep1: 'Step 1: Create a tab',
    onboardingStep2: 'Step 2: Add a card',
    onboardingStep3: 'Step 3: Drag a card',
    onboardingComplete: 'Done!',
    
    totalCards: 'Total Cards',
    completedCards: 'Completed',
    completionRate: 'Progress',
    timeSpent: 'Time',
    
    generateChecklist: 'Generate Checklist',
    createFlashcards: 'Create Flashcards',
    extractIngredients: 'Extract Ingredients',
    startPomodoro: 'Start Pomodoro',
  },
};

export const useTranslation = (language: Language) => {
  const t = (key: keyof typeof translations.ru): string => {
    return translations[language][key] || translations.en[key] || key;
  };
  
  return { t };
};
