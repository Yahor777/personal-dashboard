// AI Models configuration

export const FREE_AI_MODELS = [
  {
    provider: 'openrouter',
    name: 'Google Gemma 7B',
    model: 'google/gemma-7b-it:free',
    description: 'Бесплатная модель Google, хороша для общих задач',
    speed: 'fast',
  },
  {
    provider: 'openrouter',
    name: 'Mistral 7B',
    model: 'mistralai/mistral-7b-instruct:free',
    description: 'Быстрая и качественная бесплатная модель',
    speed: 'fast',
  },
  {
    provider: 'openrouter',
    name: 'Meta Llama 3 8B',
    model: 'meta-llama/llama-3-8b-instruct:free',
    description: 'Отличное качество, бесплатно',
    speed: 'medium',
  },
  {
    provider: 'openrouter',
    name: 'Nous Capybara 7B',
    model: 'nousresearch/nous-capybara-7b:free',
    description: 'Хороша для творческих задач',
    speed: 'fast',
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
