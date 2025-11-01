export interface AISettings {
  provider: "openrouter" | "custom";
  openRouterApiKey: string;
  customApiKey: string;
  customApiUrl: string;
  selectedModel: string;
}

export const AI_MODELS = {
  openrouter: [
    { id: "openai/gpt-4-turbo-preview", name: "GPT-4 Turbo" },
    { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    { id: "anthropic/claude-3-opus", name: "Claude 3 Opus" },
    { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet" },
    { id: "google/gemini-pro", name: "Gemini Pro" },
    { id: "meta-llama/llama-3-70b-instruct", name: "Llama 3 70B" },
  ],
  custom: [
    { id: "custom-gpt-4", name: "Custom GPT-4" },
    { id: "custom-model", name: "Custom Model" },
  ],
};

const STORAGE_KEY = "ai-settings";

export function getAISettings(): AISettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      provider: "openrouter",
      openRouterApiKey: "",
      customApiKey: "",
      customApiUrl: "",
      selectedModel: "openai/gpt-3.5-turbo",
    };
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse AI settings:", e);
    }
  }
  return {
    provider: "openrouter",
    openRouterApiKey: "",
    customApiKey: "",
    customApiUrl: "",
    selectedModel: "openai/gpt-3.5-turbo",
  };
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function sendAIMessage(message: string, settings: AISettings): Promise<string> {
  if (!settings.selectedModel) {
    throw new Error("Не выбрана модель AI. Укажите модель в настройках.");
  }

  if (settings.provider === "openrouter") {
    if (!settings.openRouterApiKey) {
      throw new Error("OpenRouter API ключ не настроен. Перейдите в Настройки.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      },
      body: JSON.stringify({
        model: settings.selectedModel,
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
    if (!settings.customApiKey || !settings.customApiUrl) {
      throw new Error("Custom API настройки не заполнены. Перейдите в Настройки.");
    }

    const response = await fetch(settings.customApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.customApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: settings.selectedModel,
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
