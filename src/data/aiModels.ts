// AI Models configuration
// Updated: October 2025 - Using verified working free models from OpenRouter

export const FREE_AI_MODELS = [
  {
    provider: 'openrouter',
    name: 'Google Gemma 2 9B IT',
    model: 'google/gemma-2-9b-it:free',
    description: 'Быстрая и качественная бесплатная модель от Google',
    speed: 'fast',
  },
  {
    provider: 'openrouter',
    name: 'Mistral 7B Instruct',
    model: 'mistralai/mistral-7b-instruct:free',
    description: 'Надёжная модель от Mistral AI',
    speed: 'fast',
  },
  {
    provider: 'openrouter',
    name: 'Qwen 2.5 7B Instruct',
    model: 'qwen/qwen-2.5-7b-instruct:free',
    description: 'Новая модель от Alibaba, хороша для кода',
    speed: 'fast',
  },
  {
    provider: 'openrouter',
    name: 'Llama 3.2 3B Instruct',
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    description: 'Компактная версия Llama 3.2, очень быстрая',
    speed: 'very-fast',
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

export const OLLAMA_MODELS = [
  {
    provider: 'ollama',
    name: 'Llama 2',
    model: 'llama2',
    description: 'Универсальная модель, 7B параметров',
  },
  {
    provider: 'ollama',
    name: 'Mistral',
    model: 'mistral',
    description: 'Быстрая и качественная, 7B параметров',
  },
  {
    provider: 'ollama',
    name: 'CodeLlama',
    model: 'codellama',
    description: 'Специализирована для программирования',
  },
  {
    provider: 'ollama',
    name: 'Phi',
    model: 'phi',
    description: 'Маленькая и быстрая модель',
  },
  {
    provider: 'ollama',
    name: 'Neural Chat',
    model: 'neural-chat',
    description: 'Хороша для диалогов',
  },
];
