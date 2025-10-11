import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Trash2, Plus, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { AIService } from '../services/aiService';
import type { AIMessage } from '../types';

interface AIAssistantPanelProps {
  onClose: () => void;
}

// Quick action templates
const quickActions = [
  { icon: '📝', label: 'Резюме текста', prompt: 'Сделай краткое резюме следующего текста:' },
  { icon: '✏️', label: 'Упростить', prompt: 'Перепиши этот текст проще и понятнее:' },
  { icon: '🎴', label: 'Создать карточки', prompt: 'Создай flashcards (вопрос-ответ) из этого материала:' },
  { icon: '📋', label: 'План изучения', prompt: 'Составь план изучения этой темы:' },
  { icon: '🧮', label: 'Решить задачу', prompt: 'Помоги решить эту задачу:' },
  { icon: '🛒', label: 'Список покупок', prompt: 'Создай список покупок для этого рецепта:' },
  { icon: '🏪', label: 'Анализ OLX', prompt: 'Проанализируй это объявление с OLX. Стоит ли покупать? Какие есть риски?' },
  { icon: '💰', label: 'Оценка цены', prompt: 'Оцени, справедлива ли эта цена для данного компонента ПК:' },
];

export function AIAssistantPanel({ onClose }: AIAssistantPanelProps) {
  const { workspace, aiConversations, currentConversationId, addAIMessage, createAIConversation, deleteAIConversation, setCurrentConversation } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentConversation = aiConversations.find(c => c.id === currentConversationId);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Create conversation if none exists
    let convId = currentConversationId;
    if (!convId) {
      convId = useStore.getState().createAIConversation('Новый чат');
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    useStore.getState().addAIMessage(convId!, {
      role: 'user',
      content: userMessage,
    });

    try {
      // Create AI service instance
      const aiService = new AIService({
        provider: workspace.settings.aiProvider || 'none',
        apiKey: workspace.settings.aiApiKey,
        model: workspace.settings.aiModel,
        ollamaUrl: workspace.settings.ollamaUrl,
      });

      // Get conversation history
      const currentConv = useStore.getState().aiConversations.find(c => c.id === convId);
      const messages = currentConv?.messages.map(m => ({
        role: m.role,
        content: m.content,
      })) || [];

      // Call AI
      const response = await aiService.chat(messages);
      
      // Add AI response
      useStore.getState().addAIMessage(convId!, {
        role: 'assistant',
        content: response.content,
      });
    } catch (error) {
      console.error('AI error:', error);
      useStore.getState().addAIMessage(convId!, {
        role: 'assistant',
        content: 'Извините, произошла ошибка. Проверьте настройки AI или попробуйте позже.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt + '\n\n');
  };

  const handleNewChat = () => {
    const newId = useStore.getState().createAIConversation('Новый чат');
    setCurrentConversation(newId);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2>{t('aiAssistant')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewChat}>
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-64 border-r border-border bg-muted/30 p-2">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {aiConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setCurrentConversation(conv.id)}
                  className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-accent ${
                    currentConversationId === conv.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex-1 truncate">
                    <div className="truncate">{conv.title}</div>
                    <p className="truncate text-muted-foreground">
                      {conv.messages.length} сообщений
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      deleteAIConversation(conv.id);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </button>
              ))}
              {aiConversations.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Нет чатов</p>
                  <p className="mt-2">Начните новый разговор</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Quick Actions */}
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="p-6">
              <h3 className="mb-4">Быстрые действия</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="flex-1">{action.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-muted/50 p-4">
                <h4 className="mb-2 flex items-center gap-2">
                  <Zap className="size-4" />
                  Возможности AI
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Создание резюме и конспектов</li>
                  <li>• Генерация flashcards для изучения</li>
                  <li>• 🏪 Анализ объявлений с OLX/Allegro</li>
                  <li>• 💰 Оценка цен на компоненты ПК</li>
                  <li>• Помощь с домашними заданиями</li>
                  <li>• Составление планов обучения</li>
                  <li>• Перевод и упрощение текста</li>
                </ul>
              </div>

              {!workspace.settings.aiProvider || workspace.settings.aiProvider === 'none' ? (
                <div className="mt-4 rounded-lg bg-yellow-500/10 p-4 text-yellow-600">
                  <p className="font-semibold mb-2">⚠️ AI не настроен</p>
                  <p className="text-sm">Перейдите в Настройки → AI для подключения:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• <strong>OpenRouter</strong> - доступ к GPT-4, Claude и другим моделям</li>
                    <li>• <strong>OpenAI</strong> - прямой доступ к GPT моделям</li>
                    <li>• <strong>Ollama</strong> - локальные модели (llama2, mistral и др.)</li>
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {currentConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <Badge variant="secondary" className="mb-2">
                            <Sparkles className="mr-1 size-3" />
                            AI
                          </Badge>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`mt-2 ${
                            message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg bg-muted p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 animate-pulse" />
                          <span>AI думает...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Напишите сообщение... (Enter для отправки)"
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-muted-foreground">
              💡 Совет: используйте Shift+Enter для новой строки
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}