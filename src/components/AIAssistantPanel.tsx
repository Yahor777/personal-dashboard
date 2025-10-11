import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Trash2, Plus, Zap, Copy, Check, Settings2, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AIService } from '../services/aiService';
// AI Models configuration
const FREE_AI_MODELS: Array<{
  model: string;
  name: string;
  speed: string;
  supportsFiles: boolean;
}> = [
  {
    model: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    speed: 'Быстрая, поддержка файлов',
    supportsFiles: true,
  },
  {
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    speed: 'Очень быстрая',
    supportsFiles: false,
  },
  {
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B',
    speed: 'Быстрая',
    supportsFiles: false,
  },
  {
    model: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    speed: 'Быстрая',
    supportsFiles: false,
  },
  {
    model: 'microsoft/phi-3-mini-128k-instruct:free',
    name: 'Phi-3 Mini',
    speed: 'Быстрая',
    supportsFiles: false,
  },
];

type AIModel = typeof FREE_AI_MODELS[number];
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { toast } from 'sonner';
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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Array<{name: string; size: number; type: string; preview?: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentConversation = aiConversations.find(c => c.id === currentConversationId);
  const currentModel = FREE_AI_MODELS.find((m: AIModel) => m.model === workspace.settings.aiModel);
  const supportsFiles = currentModel?.supportsFiles || false;

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

    // Build message content with files info
    let messageContent = userMessage;
    if (attachedFiles.length > 0) {
      messageContent += '\n\n📎 Прикрепленные файлы:\n';
      attachedFiles.forEach(file => {
        messageContent += `- ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n`;
      });
      messageContent += '\n(Примечание: Отправка файлов к AI будет реализована в следующей версии)';
    }

    // Add user message
    useStore.getState().addAIMessage(convId!, {
      role: 'user',
      content: messageContent,
    });

    // Clear attached files after sending
    setAttachedFiles([]);

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
      
      // Determine error message
      let errorMessage = 'Извините, произошла ошибка при обращении к AI.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Add error message
      useStore.getState().addAIMessage(convId!, {
        role: 'assistant',
        content: `⚠️ ${errorMessage}\n\n💡 Советы:\n• Проверьте настройки AI в Settings\n• Убедитесь, что API ключ действителен\n• Проверьте подключение к интернету\n• Попробуйте другую модель`,
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

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success('Сообщение скопировано');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      toast.error('Не удалось скопировать');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!supportsFiles) {
      toast.error('Текущая модель не поддерживает файлы', {
        description: 'Выберите Gemini 2.0 Flash для работы с файлами',
      });
      return;
    }

    // Limit to 5 files total
    if (attachedFiles.length + files.length > 5) {
      toast.error('Максимум 5 файлов одновременно');
      return;
    }

    // Process files
    const processedFiles: Array<{name: string; size: number; type: string; preview?: string}> = [];
    
    for (const file of files) {
      // Check size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Файл ${file.name} слишком большой`, {
          description: 'Максимум 10 МБ на файл',
        });
        continue;
      }

      const fileData: {name: string; size: number; type: string; preview?: string} = {
        name: file.name,
        size: file.size,
        type: file.type,
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        try {
          const preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          fileData.preview = preview;
        } catch (error) {
          console.error('Failed to generate preview:', error);
        }
      }

      processedFiles.push(fileData);
    }

    if (processedFiles.length > 0) {
      setAttachedFiles([...attachedFiles, ...processedFiles]);
      toast.success(`Прикреплено: ${processedFiles.length} файл(ов)`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.doc,.docx,.json,.md"
        className="hidden"
        onChange={handleFileSelect}
      />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-primary" />
          <h2>{t('aiAssistant')}</h2>
          <Badge variant="outline" className="text-xs">Ctrl+/</Badge>
          
          {/* Model Selector */}
          {workspace.settings.aiProvider === 'openrouter' && (
            <Select
              value={workspace.settings.aiModel || FREE_AI_MODELS[0].model}
              onValueChange={(model: string) => {
                useStore.getState().updateSettings({ aiModel: model });
                toast.success('Модель изменена');
                
                // Clear files if new model doesn't support them
                const newModel = FREE_AI_MODELS.find((m: AIModel) => m.model === model);
                if (!newModel?.supportsFiles && attachedFiles.length > 0) {
                  setAttachedFiles([]);
                  toast.info('Файлы удалены (новая модель не поддерживает файлы)');
                }
              }}
            >
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                {FREE_AI_MODELS.map((model: AIModel) => (
                  <SelectItem key={model.model} value={model.model} className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-muted-foreground text-[10px]">{model.speed}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Quick Actions */}
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="p-6 overflow-y-auto">
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
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4" ref={scrollRef}>
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {message.role === 'assistant' && (
                              <Badge variant="secondary" className="mb-2">
                                <Sparkles className="mr-1 size-3" />
                                AI
                              </Badge>
                            )}
                            {message.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight]}
                                  components={{
                                    // Custom styling for code blocks
                                    code: ({ className, children, ...props }: any) => {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return !match ? (
                                        <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                                          {children}
                                        </code>
                                      ) : (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="size-3 text-green-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>
                          )}
                        </div>
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
              </div>
            </>
          )}

          {/* Input */}
          <div className="border-t border-border p-4">
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="size-8 rounded object-cover" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className="shrink-0 flex items-center justify-center size-10 rounded-md bg-primary/20 hover:bg-primary/30 text-primary border-2 border-primary/50 transition-colors disabled:opacity-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (supportsFiles) {
                    fileInputRef.current?.click();
                  } else {
                    toast.warning('📎 Загрузка файлов недоступна', {
                      description: 'Выберите модель с поддержкой файлов: Gemini 2.0 Flash поддерживает изображения и документы.',
                      duration: 5000,
                    });
                  }
                }}
                title={supportsFiles 
                  ? 'Прикрепить файл (поддерживается текущей моделью)' 
                  : 'Прикрепить файл (недоступно для текущей модели)'}
                disabled={isLoading}
              >
                <Paperclip className="size-5" />
              </button>
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
            <p className="mt-2 text-xs text-muted-foreground">
              💡 Shift+Enter для новой строки | 📎 {supportsFiles 
                ? `Файлы поддерживаются (${attachedFiles.length}/5)` 
                : 'Для файлов выберите Gemini 2.0 Flash'}
              {attachedFiles.length > 0 && ` | ${attachedFiles.length} файл(ов) прикреплено`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}