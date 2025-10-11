import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FREE_AI_MODELS, PAID_AI_MODELS, OPENAI_MODELS, OLLAMA_MODELS } from '../data/aiModels';
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
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-600">
              ✓
            </span>
            Бесплатные модели (рекомендуется)
          </h4>
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
