// AI Models configuration
// Updated: October 11, 2025 - Powerful working free models on OpenRouter
// All models verified and confirmed available

export const FREE_AI_MODELS = [
  {
    provider: 'openrouter',
    name: 'Meta Llama 3.1 70B ⭐',
    model: 'meta-llama/llama-3.1-70b-instruct:free',
    description: '🚀 70B параметров! Мощнейшая бесплатная модель от Meta. Отлично для сложных задач и рассуждений',
    speed: 'medium',
    parameters: '70B',
  },
  {
    provider: 'openrouter',
    name: 'Meta Llama 3.1 8B',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    description: '💪 8B параметров. Быстрая и мощная модель от Meta, хороша для сложных задач',
    speed: 'fast',
    parameters: '8B',
  },
  {
    provider: 'openrouter',
    name: 'Google Gemma 2 27B',
    model: 'google/gemma-2-27b-it:free',
    description: '🧠 27B параметров. Продвинутая модель от Google для текста и анализа',
    speed: 'medium',
    parameters: '27B',
  },
  {
    provider: 'openrouter',
    name: 'Google Gemma 2 9B IT',
    model: 'google/gemma-2-9b-it:free',
    description: '⚡ 9B параметров. Быстрая и качественная модель от Google',
    speed: 'very-fast',
    parameters: '9B',
  },
  {
    provider: 'openrouter',
    name: 'Mistral 7B Instruct',
    model: 'mistralai/mistral-7b-instruct:free',
    description: '💻 7B параметров. Надёжная модель от Mistral AI, специализация - код',
    speed: 'fast',
    parameters: '7B',
  },
  {
    provider: 'openrouter',
    name: 'Qwen 2.5 7B Instruct',
    model: 'qwen/qwen-2.5-7b-instruct:free',
    description: '🐧 7B параметров. Модель от Alibaba, отлично справляется с программированием',
    speed: 'fast',
    parameters: '7B',
  },
  {
    provider: 'openrouter',
    name: 'Microsoft Phi-3 Medium 128K',
    model: 'microsoft/phi-3-medium-128k-instruct:free',
    description: '🔬 14B параметров. Модель от Microsoft с большим контекстом (128K токенов)',
    speed: 'medium',
    parameters: '14B',
  },
  {
    provider: 'openrouter',
    name: 'Nous Hermes 3 8B',
    model: 'nousresearch/hermes-3-llama-3.1-8b:free',
    description: '🎭 8B параметров. Креативная модель, отлично для storytelling и ролевых игр',
    speed: 'fast',
    parameters: '8B',
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
