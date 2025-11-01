// @ts-nocheck
import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { X, Send, Sparkles, Trash2, Plus, Zap, Copy, Check, Settings2, Paperclip, FileText, Image as ImageIcon, Download, BookmarkPlus, ClipboardPlus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  {
    model: 'openai/gpt-oss-20b:free',
    name: 'GPT OSS 20B',
    speed: 'Средняя',
    supportsFiles: false,
  },
  {
    model: 'deepseek/deepseek-chat-v3.1:free',
    name: 'DeepSeek Chat v3.1',
    speed: 'Средняя',
    supportsFiles: false,
  },
  {
    model: 'alibaba/tongyi-deepresearch-30b-a3b:free',
    name: 'Tongyi DeepResearch 30B',
    speed: 'Медленная, очень умная',
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

type FavoritePrompt = {
  id: string;
  title: string;
  prompt: string;
};

export const AIAssistantPanel = memo(function AIAssistantPanel({ onClose }: AIAssistantPanelProps) {
  const { workspace, aiConversations, currentConversationId, addAIMessage, createAIConversation, deleteAIConversation, setCurrentConversation, currentTabId, addCard } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Array<{name: string; size: number; type: string; preview?: string}>>([]);
  const [panelWidth, setPanelWidth] = useState(768); // Default 768px (max-w-3xl)
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [favoritePrompts, setFavoritePrompts] = useState<FavoritePrompt[]>(() => {
    try {
      const raw = localStorage.getItem('ai-favorite-prompts');
      if (!raw) return [];
      return JSON.parse(raw) as FavoritePrompt[];
    } catch (error) {
      console.error('Failed to load favorite prompts', error);
      return [];
    }
  });

  // Memoized values
  const currentConversation = useMemo(() => 
    aiConversations.find(c => c.id === currentConversationId), 
    [aiConversations, currentConversationId]
  );
  
  const currentModel = useMemo(() => 
    FREE_AI_MODELS.find((m: AIModel) => m.model === workspace.settings.aiModel), 
    [workspace.settings.aiModel]
  );
  
  const supportsFiles = useMemo(() => 
    currentModel?.supportsFiles || false, 
    [currentModel]
  );
  
  const currentTab = useMemo(() => 
    workspace.tabs.find((tab) => tab.id === currentTabId) || null, 
    [workspace.tabs, currentTabId]
  );
  
  const defaultColumnId = useMemo(() => 
    currentTab?.columns[0]?.id ?? null, 
    [currentTab]
  );

  const canSendMessage = useMemo(() => 
    input.trim().length > 0 && !isLoading, 
    [input, isLoading]
  );

  const hasAttachedFiles = useMemo(() => 
    attachedFiles.length > 0, 
    [attachedFiles]
  );

  const totalMessagesCount = useMemo(() => 
    currentConversation?.messages.length || 0, 
    [currentConversation?.messages]
  );

  useEffect(() => {
    try {
      localStorage.setItem('ai-favorite-prompts', JSON.stringify(favoritePrompts));
    } catch (error) {
      console.error('Failed to save favorite prompts', error);
    }
  }, [favoritePrompts]);

  // Memoized callbacks
  const addFavoritePrompt = useCallback((title: string, prompt: string) => {
    if (!title.trim() || !prompt.trim()) {
      toast.error('Название и текст промпта не должны быть пустыми');
      return;
    }
    const newPrompt: FavoritePrompt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      prompt: prompt.trim(),
    };
    setFavoritePrompts((prev) => [newPrompt, ...prev].slice(0, 20));
    toast.success('Промпт сохранён');
  }, []);

  const removeFavoritePrompt = useCallback((id: string) => {
    setFavoritePrompts((prev) => prev.filter((item) => item.id !== id));
    toast.info('Промпт удалён');
  }, []);

  const handleSaveCurrentPrompt = useCallback(() => {
    if (!input.trim()) {
      toast.error('Введите текст, который хотите сохранить');
      return;
    }
    const title = window.prompt('Название промпта', input.substring(0, 40) || 'Мой промпт');
    if (title) {
      addFavoritePrompt(title, input);
    }
  }, [input, addFavoritePrompt]);

  const handleExportConversation = useCallback(() => {
    if (!currentConversation) {
      toast.error('Нет сообщений для экспорта');
      return;
    }
    const content = currentConversation.messages
      .map((msg) => `${msg.role === 'user' ? '👤 Пользователь' : '🤖 AI'} (${new Date(msg.timestamp).toLocaleString()}):\n${msg.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-conversation-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Диалог экспортирован');
  }, [currentConversation]);

  const handleSaveMessageToKanban = useCallback((message: AIMessage) => {
    if (!defaultColumnId) {
      toast.error('Нет активной доски или колонок для сохранения');
      return;
    }
    const title = message.content.split('\n')[0].slice(0, 60) || 'Ответ AI';
    addCard({
      title,
      description: message.content,
      type: 'note',
      priority: 'medium',
      tags: ['ai', 'assistant'],
      reminders: [],
      attachments: [],
      images: [],
      checklist: [],
      comments: [],
      columnId: defaultColumnId,
    });
    toast.success('Добавлено в Kanban');
  }, [defaultColumnId, addCard]);

  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt + '\n\n');
  }, []);

  const handleNewChat = useCallback(() => {
    const newId = useStore.getState().createAIConversation('Новый чат');
    setCurrentConversation(newId);
  }, [setCurrentConversation]);

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
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
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [supportsFiles, attachedFiles]);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  }, [attachedFiles]);

  const handleSendMessage = useCallback(async () => {
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
        model: (workspace.settings.aiProvider === 'openrouter' && workspace.settings.aiCustomModel)
          ? workspace.settings.aiCustomModel
          : workspace.settings.aiModel,
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
  }, [input, attachedFiles, currentConversationId, workspace.settings]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Auto-expand panel if code is detected in messages
    if (currentConversation?.messages) {
      const hasCode = currentConversation.messages.some(msg => 
        msg.role === 'assistant' && msg.content.includes('```')
      );
      if (hasCode && panelWidth < 1024) {
        setPanelWidth(1024); // Expand to 1024px when code is detected
      }
    }
  }, [currentConversation?.messages, panelWidth]);

  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Limit width between 400px and 95% of screen
      const minWidth = 400;
      const maxWidth = window.innerWidth * 0.95;
      setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  return (
    <div 
      ref={panelRef}
      data-panel="true"
      className="fixed inset-y-0 right-0 z-50 flex flex-col border-l border-border bg-background shadow-2xl"
      style={{ width: window.innerWidth <= 768 ? '100vw' : `${panelWidth}px` }}
    >
      {/* Resize handle - только на desktop */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors hidden md:block group"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-12 bg-primary/20 group-hover:bg-primary/40 rounded-full flex items-center justify-center transition-all">
          <div className="w-0.5 h-6 bg-primary/60 rounded-full"></div>
        </div>
      </div>

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
      <div className="flex items-center justify-between border-b border-border p-3 md:p-4 gap-2 pt-safe">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <Sparkles className="size-4 md:size-5 text-primary shrink-0" />
          <h2 className="text-sm md:text-base truncate">{t('aiAssistant')}</h2>
          <Badge variant="outline" className="text-xs hidden md:inline-flex">Ctrl+/</Badge>
          
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
              <SelectTrigger className="w-[160px] md:w-[220px] h-8 text-xs shrink-0">
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
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleNewChat} className="h-8 w-8 md:h-9 md:w-auto p-0 md:px-3">
            <Plus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
            onClick={handleSaveCurrentPrompt}
            title="Сохранить текущий текст как промпт"
          >
            <BookmarkPlus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
            onClick={handleExportConversation}
            title="Экспортировать диалог"
          >
            <Download className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 md:h-9 md:w-9">
            <X className="size-4 md:size-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar - скрываем на мобильных */}
        <div className="hidden md:flex w-64 border-r border-border bg-muted/30 p-2">
          <ScrollArea className="h-full w-full pb-safe">
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
                    <div className="truncate text-sm">{conv.title}</div>
                    <p className="truncate text-xs text-muted-foreground">
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
                <div className="p-4 text-center text-muted-foreground text-sm">
                  <p>Нет чатов</p>
                  <p className="mt-2 text-xs">Начните новый разговор</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Quick Actions / Favorites */}
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="p-4 md:p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="mb-3 md:mb-4 text-base md:text-lg">Быстрые действия</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-2 md:gap-3 rounded-lg border border-border bg-card p-3 md:p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                    >
                      <span className="text-xl md:text-2xl shrink-0">{action.icon}</span>
                      <span className="flex-1 text-sm md:text-base">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {favoritePrompts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base md:text-lg flex items-center gap-2">
                    <BookmarkPlus className="size-4" />
                    Избранные промпты
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {favoritePrompts.map((prompt) => (
                      <Card key={prompt.id} className="border-border hover:border-primary transition-all">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-sm line-clamp-1">{prompt.title}</CardTitle>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFavoritePrompt(prompt.id)}>
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs text-muted-foreground">
                          <p className="line-clamp-3 whitespace-pre-wrap">{prompt.prompt}</p>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleQuickAction(prompt.prompt)} className="flex-1">
                              Вставить
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigator.clipboard.writeText(prompt.prompt).then(() => toast.success('Промпт скопирован'))}
                            >
                              <ClipboardPlus className="size-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-3 md:p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm md:text-base">
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
                <div className="rounded-lg bg-yellow-500/10 p-4 text-yellow-600">
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
                <ScrollArea className="h-full pb-safe">
                  <div className="p-3 md:p-4 space-y-3 md:space-y-4" ref={scrollRef}>
                    {currentConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 md:p-4 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {message.role === 'assistant' && (
                                <Badge variant="secondary" className="mb-2 text-xs">
                                  <Sparkles className="mr-1 size-3" />
                                  AI
                                </Badge>
                              )}
                              {message.role === 'assistant' ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                      // Custom styling for code blocks
                                      code: ({ className, children, ...props }: any) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !match ? (
                                          <code className="bg-muted px-1 py-0.5 rounded text-xs md:text-sm" {...props}>
                                            {children}
                                          </code>
                                        ) : (
                                          <code className={className} {...props}>
                                            {children}
                                          </code>
                                        );
                                      },
                                      pre: ({ children, ...props }: any) => (
                                        <pre className="overflow-x-auto max-w-full text-xs md:text-sm" data-scroll-x {...props}>
                                          {children}
                                        </pre>
                                      ),
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap text-sm md:text-base break-words">{message.content}</p>
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
                            {message.role === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => handleSaveMessageToKanban(message)}
                                title="Сохранить ответ в Kanban"
                              >
                                <FileText className="size-3" />
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
          <div className="border-t border-border p-3 md:p-4 bg-background">
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 md:mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2 md:px-3 py-1.5 md:py-2">
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="size-6 md:size-8 rounded object-cover" />
                    ) : (
                      <FileText className="size-3 md:size-4" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-xs font-medium truncate max-w-[120px]">{file.name}</span>
                      <span className="text-[9px] md:text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 md:h-6 md:w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="size-2.5 md:size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className={`shrink-0 flex items-center justify-center h-10 w-10 md:size-10 rounded-md transition-colors disabled:opacity-50 ${
                  supportsFiles 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary active:scale-95' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-border'
                }`}
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
                <Paperclip className="size-4 md:size-5" />
              </button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Напишите сообщение..."
                className="flex-1 text-sm md:text-base h-10"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 md:w-auto p-0 md:px-4 active:scale-95"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-[10px] md:text-xs text-muted-foreground line-clamp-2 md:line-clamp-1">
              💡 <span className="hidden md:inline">Shift+Enter для новой строки | </span>📎 {supportsFiles 
                ? `Файлы поддерживаются (${attachedFiles.length}/5)` 
                : 'Для файлов выберите Gemini'}
              {attachedFiles.length > 0 && ` | ${attachedFiles.length} файл(ов)`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
