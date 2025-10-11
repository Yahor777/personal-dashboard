import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
// AI Models data
const FREE_AI_MODELS = [
    {
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B',
        description: 'Быстрая и качественная модель для повседневных задач',
        price: 'FREE',
        speed: 'Fast'
    },
    {
        model: 'google/gemma-2-9b-it:free',
        name: 'Gemma 2 9B',
        description: 'Мощная модель от Google для сложных задач',
        price: 'FREE',
        speed: 'Medium'
    },
    {
        model: 'mistralai/mistral-7b-instruct:free',
        name: 'Mistral 7B',
        description: 'Универсальная модель с хорошим балансом',
        price: 'FREE',
        speed: 'Fast'
    }
];

const PAID_AI_MODELS = [
    {
        model: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Топовая модель для профессиональной работы',
        price: '$3/1M tokens'
    },
    {
        model: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Самая продвинутая модель OpenAI',
        price: '$10/1M tokens'
    }
];

const OPENAI_MODELS = [
    {
        model: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        description: 'Самая мощная модель OpenAI',
        price: '$10/1M tokens'
    },
    {
        model: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Быстрая и доступная модель',
        price: '$0.5/1M tokens'
    }
];

const OLLAMA_MODELS = [
    {
        model: 'llama2',
        name: 'Llama 2',
        description: 'Локальная модель Meta',
        price: 'Local'
    },
    {
        model: 'mistral',
        name: 'Mistral',
        description: 'Быстрая локальная модель',
        price: 'Local'
    }
];
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { useState } from 'react';
import type { AIProvider } from '../types';

interface AIModelSelectorProps {
  provider: AIProvider;
  currentModel?: string;
  onSelectModel: (model: string) => void;
}

export function AIModelSelector({ provider, currentModel, onSelectModel }: AIModelSelectorProps) {
  const [showPaid, setShowPaid] = useState(false);

  if (provider === 'none') return null;

  const renderModelCard = (model: any, isCurrent: boolean) => (
    <button
      key={model.model}
      onClick={() => onSelectModel(model.model)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isCurrent
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-accent'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{model.name}</p>
            {model.price && (
              <Badge variant="outline" className="text-xs">
                {model.price}
              </Badge>
            )}
            {model.speed && (
              <Badge variant="secondary" className="text-xs">
                {model.speed}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {model.description}
          </p>
          <code className="text-xs text-muted-foreground mt-1 block">
            {model.model}
          </code>
        </div>
        {isCurrent && (
          <Check className="size-5 text-primary flex-shrink-0" />
        )}
      </div>
    </button>
  );

  if (provider === 'openrouter') {
    return (
      <div className="space-y-3">
        {/* Info banner */}
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm">
          <p className="font-semibold text-primary mb-2">🔑 Как получить БЕСПЛАТНЫЙ API ключ OpenRouter</p>
          <ol className="text-muted-foreground text-xs space-y-1 list-decimal list-inside">
            <li>Перейдите на{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-primary hover:underline font-medium">
                openrouter.ai/keys
              </a>
            </li>
            <li>Войдите через Google/GitHub или создайте аккаунт</li>
            <li>Нажмите "Create Key" → Скопируйте ключ (sk-or-v1-...)</li>
            <li>Вставьте в поле "API Key" выше</li>
            <li>Бесплатные модели дают $1-5 кредитов в день! 🎉</li>
          </ol>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-600">
              ✓
            </span>
            Бесплатные модели (рекомендуется)
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            Эти модели полностью бесплатны для использования:
          </p>
          <div className="space-y-2">
            {FREE_AI_MODELS.map((model) =>
              renderModelCard(model, model.model === currentModel)
            )}
          </div>
        </div>

        <Collapsible open={showPaid} onOpenChange={setShowPaid}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              {showPaid ? '▼' : '▶'} Платные модели (требуется баланс)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {PAID_AI_MODELS.map((model) =>
              renderModelCard(model, model.model === currentModel)
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  if (provider === 'openai') {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold mb-2">Модели OpenAI</h4>
        {OPENAI_MODELS.map((model) =>
          renderModelCard(model, model.model === currentModel)
        )}
      </div>
    );
  }

  if (provider === 'ollama') {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold mb-2">Локальные модели Ollama</h4>
        {OLLAMA_MODELS.map((model) =>
          renderModelCard(model, model.model === currentModel)
        )}
        <div className="mt-3 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-600">
          <p>💡 Установите модели командой:</p>
          <code className="block mt-1 bg-blue-500/20 px-2 py-1 rounded">
            ollama pull llama2
          </code>
        </div>
      </div>
    );
  }

  return null;
}
