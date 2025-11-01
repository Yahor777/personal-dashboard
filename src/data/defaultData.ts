import type { Workspace } from "../types";

export const defaultWorkspace: Workspace = {
  id: "default-workspace",
  name: "MySpaceHub",
  tabs: [
    {
      id: "tab-demo-1",
      title: "Учёба",
      template: "school",
      order: 0,
      createdAt: "2025-10-10T12:00:00.000Z",
      columns: [
        { id: "col-1-1", title: "К изучению", order: 0, cardIds: [] },
        { id: "col-1-2", title: "В процессе", order: 1, cardIds: [] },
        { id: "col-1-3", title: "Выполнено", order: 2, cardIds: [] },
      ],
    },
    {
      id: "tab-demo-2",
      title: "Рецепты",
      template: "cooking",
      order: 1,
      createdAt: "2025-10-10T12:00:00.000Z",
      columns: [
        { id: "col-2-1", title: "Попробовать", order: 0, cardIds: [] },
        { id: "col-2-2", title: "Список покупок", order: 1, cardIds: [] },
        { id: "col-2-3", title: "Приготовлено", order: 2, cardIds: [] },
      ],
    },
    {
      id: "tab-demo-3",
      title: "Личное",
      template: "personal",
      order: 2,
      createdAt: "2025-10-10T12:00:00.000Z",
      columns: [
        { id: "col-3-1", title: "Идеи", order: 0, cardIds: [] },
        { id: "col-3-2", title: "В работе", order: 1, cardIds: [] },
        { id: "col-3-3", title: "Готово", order: 2, cardIds: [] },
      ],
    },
  ],
  cards: [],
  settings: {
    theme: "dark",
    language: "ru",
    accentColor: "#6366f1",
    fontFamily: "Inter",
    highContrast: false,
    notifications: true,
    onboardingCompleted: false,
    aiEnabled: true,
    aiProvider: "none",
    aiModel: "google/gemini-2.0-flash-exp:free",
    ollamaUrl: "http://localhost:11434",
    enableScrollButtons: true,
  },
  createdAt: "2025-10-10T12:00:00.000Z",
  updatedAt: "2025-10-10T12:00:00.000Z",
};
