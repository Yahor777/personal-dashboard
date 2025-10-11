// AI Service для работы с разными провайдерами

import type { AIProvider } from '../types';

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  ollamaUrl?: string;
}

interface AIResponse {
  content: string;
  error?: string;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<AIResponse> {
    switch (this.config.provider) {
      case 'openrouter':
        return this.callOpenRouter(messages);
      case 'openai':
        return this.callOpenAI(messages);
      case 'ollama':
        return this.callOllama(messages);
      case 'none':
      default:
        return {
          content: 'AI не настроен. Пожалуйста, выберите провайдера в настройках.',
          error: 'NO_PROVIDER',
        };
    }
  }

  private async callOpenRouter(messages: Array<{ role: string; content: string }>): Promise<AIResponse> {
    if (!this.config.apiKey) {
      return {
        content: 'API ключ OpenRouter не настроен. Получите его на openrouter.ai',
        error: 'NO_API_KEY',
      };
    }

    const model = this.config.model || 'google/gemma-7b-it:free';

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Personal Dashboard',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter error:', errorData);
        
        // Более детальная ошибка
        if (response.status === 401) {
          return {
            content: `Неверный API ключ OpenRouter. Проверьте ключ в настройках или создайте новый на openrouter.ai`,
            error: 'INVALID_API_KEY',
          };
        } else if (response.status === 402) {
          return {
            content: `Недостаточно кредитов на OpenRouter. Пополните баланс или используйте бесплатную модель (с :free в конце)`,
            error: 'INSUFFICIENT_CREDITS',
          };
        } else if (response.status === 429) {
          return {
            content: `Слишком много запросов. Подождите немного и попробуйте снова.`,
            error: 'RATE_LIMIT',
          };
        }
        
        return {
          content: `Ошибка OpenRouter (${response.status}): ${errorData.error?.message || 'Неизвестная ошибка'}. Модель: ${model}`,
          error: 'API_ERROR',
        };
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || 'Пустой ответ от AI',
      };
    } catch (error) {
      console.error('OpenRouter error:', error);
      return {
        content: 'Ошибка подключения к OpenRouter. Проверьте интернет-соединение.',
        error: 'NETWORK_ERROR',
      };
    }
  }

  private async callOpenAI(messages: Array<{ role: string; content: string }>): Promise<AIResponse> {
    if (!this.config.apiKey) {
      return {
        content: 'API ключ OpenAI не настроен. Получите его на platform.openai.com',
        error: 'NO_API_KEY',
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        return {
          content: `Ошибка OpenAI: ${response.status}. Проверьте API ключ.`,
          error: 'API_ERROR',
        };
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || 'Пустой ответ от AI',
      };
    } catch (error) {
      console.error('OpenAI error:', error);
      return {
        content: 'Ошибка подключения к OpenAI.',
        error: 'NETWORK_ERROR',
      };
    }
  }

  private async callOllama(messages: Array<{ role: string; content: string }>): Promise<AIResponse> {
    const ollamaUrl = this.config.ollamaUrl || 'http://localhost:11434';

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'llama2',
          messages: messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        return {
          content: `Ошибка Ollama: ${response.status}. Убедитесь, что Ollama запущен.`,
          error: 'API_ERROR',
        };
      }

      const data = await response.json();
      return {
        content: data.message?.content || 'Пустой ответ от Ollama',
      };
    } catch (error) {
      console.error('Ollama error:', error);
      return {
        content: 'Не удалось подключиться к Ollama. Убедитесь, что он запущен на ' + ollamaUrl,
        error: 'NETWORK_ERROR',
      };
    }
  }
}

// Функция для анализа OLX объявления через AI
export async function analyzeOLXListing(
  listingData: {
    title: string;
    price: number;
    description: string;
    category?: string;
  },
  aiService: AIService
): Promise<string> {
  const prompt = `Проанализируй это объявление с OLX:

Название: ${listingData.title}
Цена: ${listingData.price} PLN
${listingData.category ? `Категория: ${listingData.category}` : ''}

Описание:
${listingData.description}

Дай краткий анализ:
1. Плюсы и минусы
2. Справедлива ли цена?
3. На что обратить внимание
4. Рекомендация (покупать или нет)`;

  const response = await aiService.chat([
    { role: 'system', content: 'Ты помощник по анализу объявлений. Давай краткие и полезные советы.' },
    { role: 'user', content: prompt },
  ]);

  return response.content;
}

// Функция для генерации flashcards
export async function generateFlashcards(text: string, aiService: AIService): Promise<string> {
  const prompt = `Создай flashcards (карточки для запоминания) из этого текста:

${text}

Формат:
Q: [Вопрос]
A: [Ответ]

Создай 5-10 карточек с самыми важными понятиями.`;

  const response = await aiService.chat([
    { role: 'system', content: 'Ты помощник для создания учебных материалов.' },
    { role: 'user', content: prompt },
  ]);

  return response.content;
}
