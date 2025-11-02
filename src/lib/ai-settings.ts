export interface AISettings {
  provider: "openrouter" | "custom";
  openRouterApiKey: string;
  customApiKey: string;
  customApiUrl: string;
  selectedModel: string;
  savedModels: string[];
}

const STORAGE_KEY = "ai-settings";

const createDefaultSettings = (): AISettings => ({
  provider: "openrouter",
  openRouterApiKey: "",
  customApiKey: "",
  customApiUrl: "",
  selectedModel: "openai/gpt-3.5-turbo",
  savedModels: [],
});

const normalizeSettings = (input?: Partial<AISettings>): AISettings => {
  const defaults = createDefaultSettings();
  if (!input) {
    return defaults;
  }

  const sanitize = (value?: unknown) => (typeof value === "string" ? value.trim() : "");

  const savedModels = Array.isArray(input.savedModels)
    ? Array.from(
        new Set(
          input.savedModels
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      )
    : [];

  const selectedModelRaw = sanitize(input.selectedModel);
  const selectedModel = selectedModelRaw || savedModels[0] || defaults.selectedModel;

  return {
    provider: input.provider === "custom" ? "custom" : "openrouter",
    openRouterApiKey: sanitize(input.openRouterApiKey),
    customApiKey: sanitize(input.customApiKey),
    customApiUrl: sanitize(input.customApiUrl),
    selectedModel,
    savedModels,
  };
};

export function getAISettings(): AISettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return createDefaultSettings();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return normalizeSettings(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to parse AI settings:", e);
    }
  }
  return createDefaultSettings();
}

export function saveAISettings(settings: AISettings): AISettings {
  const normalized = normalizeSettings(settings);
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export async function sendAIMessage(message: string, settings: AISettings): Promise<string> {
  const normalized = normalizeSettings(settings);

  if (!normalized.selectedModel) {
    throw new Error("Не выбрана модель AI. Укажите модель в настройках.");
  }

  if (normalized.provider === "openrouter") {
    if (!normalized.openRouterApiKey) {
      throw new Error("OpenRouter API ключ не настроен. Перейдите в Настройки.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${normalized.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      },
      body: JSON.stringify({
        model: normalized.selectedModel,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Ошибка при обращении к OpenRouter API");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Нет ответа от AI";
  } else {
    // Custom API
    if (!normalized.customApiKey || !normalized.customApiUrl) {
      throw new Error("Custom API настройки не заполнены. Перейдите в Настройки.");
    }

    const response = await fetch(normalized.customApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${normalized.customApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: normalized.selectedModel,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error("Ошибка при обращении к Custom API");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Нет ответа от AI";
  }
}
