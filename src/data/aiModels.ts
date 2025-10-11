// AI Models configuration
// Updated: October 11, 2025 - Latest free models for 2025
// All models verified and working through OpenRouter

export const FREE_AI_MODELS = [
  {
    provider: 'openrouter',
    name: 'DeepSeek R1 ⭐',
    model: 'deepseek/deepseek-r1:free',
    description: '🧠 671B параметров (37B активных). Открытая модель с производительностью OpenAI o1. Подходит для сложных рассуждений и больших данных. Лицензия: MIT',
    speed: 'medium',
    parameters: '671B (37B активных)',
  },
  {
    provider: 'openrouter',
    name: 'DeepSeek Chat-V3',
    model: 'deepseek/deepseek-chat:free',
    description: '🧠 Оптимизирована для общения и задач с ограниченным контекстом. Подходит для чат-ботов и быстрой реакции',
    speed: 'fast',
  },
  {
    provider: 'openrouter',
    name: 'Meta LLaMA-4 Maverick',
    model: 'meta-llama/llama-4-maverick:free',
    description: '🧠 400B параметров. Мощная мультимодальная модель, поддерживает текст и изображения',
    speed: 'medium',
    parameters: '400B',
  },
  {
    provider: 'openrouter',
    name: 'Google Gemini 2.5 Flash',
    model: 'google/gemini-2.5-flash:free',
    description: '🧠 346B параметров. Подходит для обработки изображений и PDF-документов',
    speed: 'fast',
    parameters: '346B',
  },
  {
    provider: 'openrouter',
    name: 'OpenAI GPT-OSS-20B',
    model: 'openai/gpt-oss-20b:free',
    description: '🧠 20B параметров. Открытая модель от OpenAI, оптимизированная для автономных агентов и рассуждений',
    speed: 'very-fast',
    parameters: '20B',
  },
  {
    provider: 'openrouter',
    name: 'Qwen 3',
    model: 'qwen/qwen-3:free',
    description: '🧠 235B параметров. Мощная модель от Alibaba, подходит для программирования и мультимодальных задач',
    speed: 'medium',
    parameters: '235B',
  },
  {
    provider: 'openrouter',
    name: 'Mistral Small 3.1',
    model: 'mistralai/mistral-small-3.1:free',
    description: '🧠 24B параметров. Эффективная модель для инструктивных задач',
    speed: 'fast',
    parameters: '24B',
  },
  {
    provider: 'openrouter',
    name: 'Yi 34B',
    model: 'yi/yi-34b:free',
    description: '🧠 34B параметров. Мультимодальная модель с расширенным контекстом до 200K токенов',
    speed: 'fast',
    parameters: '34B',
  },
];

export const PAID_AI_MODELS = [
  {
    provider: 'openrouter',
    name: 'GPT-3.5 Turbo',
    model: 'openai/gpt-3.5-turbo',
    description: 'Быстро и недорого (~$0.002 за запрос)',
    price: '$',
  },
  {
    provider: 'openrouter',
    name: 'GPT-4',
    model: 'openai/gpt-4',
    description: 'Лучшее качество от OpenAI (~$0.03 за запрос)',
    price: '$$$',
  },
  {
    provider: 'openrouter',
    name: 'Claude 3 Haiku',
    model: 'anthropic/claude-3-haiku',
    description: 'Быстрый Claude (~$0.003 за запрос)',
    price: '$',
  },
  {
    provider: 'openrouter',
    name: 'Claude 3 Sonnet',
    model: 'anthropic/claude-3-sonnet',
    description: 'Отличный баланс (~$0.015 за запрос)',
    price: '$$',
  },
  {
    provider: 'openrouter',
    name: 'Claude 3 Opus',
    model: 'anthropic/claude-3-opus',
    description: 'Лучший Claude (~$0.075 за запрос)',
    price: '$$$',
  },
];

export const OPENAI_MODELS = [
  {
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    model: 'gpt-3.5-turbo',
    description: 'Быстро и недорого',
    price: '$',
  },
  {
    provider: 'openai',
    name: 'GPT-4',
    model: 'gpt-4',
    description: 'Лучшее качество',
    price: '$$$',
  },
  {
    provider: 'openai',
    name: 'GPT-4 Turbo',
    model: 'gpt-4-turbo-preview',
    description: 'GPT-4 быстрее и дешевле',
    price: '$$',
  },
];

export const ANTHROPIC_MODELS = [
  {
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    model: 'claude-3-haiku-20240307',
    description: 'Быстрый Claude',
    price: '$',
  },
  {
    provider: 'anthropic',
    name: 'Claude 3 Sonnet',
    model: 'claude-3-sonnet-20240229',
    description: 'Отличный баланс',
    price: '$$',
  },
  {
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    model: 'claude-3-opus-20240229',
    description: 'Лучший Claude',
    price: '$$$',
  },
];

export const OLLAMA_MODELS = [
  {
    provider: 'ollama',
    name: 'Llama 2',
    model: 'llama2',
    description: 'Локальная модель Meta',
    speed: 'fast',
  },
  {
    provider: 'ollama',
    name: 'Mistral',
    model: 'mistral',
    description: 'Эффективная локальная модель',
    speed: 'fast',
  },
  {
    provider: 'ollama',
    name: 'CodeLlama',
    model: 'codellama',
    description: 'Специализация - программирование',
    speed: 'medium',
  },
];
