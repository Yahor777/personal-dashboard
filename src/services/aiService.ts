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
  private timeout: number = 30000; // 30 seconds timeout
  private maxRetries: number = 2;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<AIResponse> {
    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.chatWithTimeout(messages);
      } catch (error) {
        // Don't retry on certain errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (
            errorMessage.includes('api_key') ||
            errorMessage.includes('credits') ||
            errorMessage.includes('не настроен')
          ) {
            throw error;
          }
        }

        // Last attempt - throw error
        if (attempt === this.maxRetries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying request (attempt ${attempt + 2}/${this.maxRetries + 1})...`);
      }
    }

    // Fallback return (should never reach here)
    return {
      content: 'Произошла неизвестная ошибка',
      error: 'UNKNOWN_ERROR',
    };
  }

  private async chatWithTimeout(messages: Array<{ role: string; content: string }>): Promise<AIResponse> {
    return Promise.race([
      this.performChat(messages),
      new Promise<AIResponse>((_, reject) =>
        setTimeout(() => reject(new Error('Превышено время ожидания ответа (30 сек). Попробуйте снова или выберите другую модель.')), this.timeout)
      ),
    ]);
  }

  private async performChat(messages: Array<{ role: string; content: string }>): Promise<AIResponse> {
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
  const categoryContext = listingData.category 
    ? getCategoryContext(listingData.category) 
    : '';

  const prompt = `Проанализируй это объявление компьютерного компонента с OLX/Allegro:

**Товар:** ${listingData.title}
**Цена:** ${listingData.price} PLN
${listingData.category ? `**Категория:** ${listingData.category}` : ''}

**Описание продавца:**
${listingData.description}

${categoryContext}

Дай профессиональный анализ в формате markdown:

## 📊 Анализ цены
- Оцени, хорошая ли это цена для данного компонента
- Укажи примерный диапазон рыночных цен (если знаешь)
- Сравни с новыми аналогами

## ⚙️ Технические характеристики
- Какие характеристики указаны/не указаны
- Производительность для типичных задач
- Актуальность на текущий момент

## 🚩 Красные флаги (на что обратить внимание)
- Признаки майнинга (если GPU)
- Недостаток информации
- Подозрительные моменты в описании
- Что нужно проверить при покупке

## ✅ Рекомендация
- Покупать или нет (с обоснованием)
- Возможность торга
- Альтернативные варианты

Будь кратким, но информативным. Используй эмодзи для наглядности.`;

  const response = await aiService.chat([
    { role: 'system', content: 'Ты эксперт по компьютерным комплектующим и анализу объявлений. Даёшь профессиональные советы по покупке б/у компонентов, умеешь распознавать признаки проблем и справедливость цен.' },
    { role: 'user', content: prompt },
  ]);

  return response.content;
}

// Helper function for category-specific context
function getCategoryContext(category: string): string {
  const contexts: Record<string, string> = {
    gpu: `
**Справочная информация для GPU:**
- Обрати внимание на модель, память (VRAM), год выпуска
- Проверь признаки майнинга: слишком низкая цена, отсутствие гарантии, множество одинаковых карт у продавца
- RX 580 8GB: рыночная цена 200-300 PLN (зависит от состояния)
- GTX 1660 Super: 400-500 PLN
- RTX 3060: 800-1000 PLN`,
    cpu: `
**Справочная информация для CPU:**
- Обрати внимание на поколение, частоту, количество ядер/потоков
- Проверь совместимость с материнскими платами (сокет)
- CPU редко выходят из строя, но проверь наличие всех ножек/контактов`,
    ram: `
**Справочная информация для RAM:**
- Проверь тип (DDR4/DDR5), частоту, тайминги, объем
- Убедись в совместимости с материнской платой
- Цена за GB: DDR4 ~15-25 PLN/GB, DDR5 дороже`,
    ssd: `
**Справочная информация для SSD:**
- Обрати внимание на интерфейс (SATA/NVMe), объем, скорость чтения/записи
- Проверь остаточный ресурс (TBW - Total Bytes Written)
- NVMe быстрее SATA, но дороже`,
  };

  return contexts[category] || '';
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
