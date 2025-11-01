import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Sparkles, Send, Copy, Plus, FileText, CheckSquare, Lightbulb, Settings as SettingsIcon, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { getAISettings, sendAIMessage, AI_MODELS, saveAISettings } from "../../lib/ai-settings";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  onOpenSettings?: () => void;
}

const quickPrompts = [
  { icon: FileText, label: "Генерация описания", prompt: "Создай описание для карточки проекта" },
  { icon: CheckSquare, label: "Создать чек-лист", prompt: "Создай чек-лист для изучения React" },
  { icon: Lightbulb, label: "Идеи проектов", prompt: "Предложи 5 идей для веб-проектов" },
  { icon: Sparkles, label: "Улучшить текст", prompt: "Улучши этот текст:" },
];

export function AIAssistant({ onOpenSettings }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Привет! Я ваш AI-ассистент. Чем могу помочь сегодня?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiSettings, setAISettings] = useState(getAISettings());
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const settings = getAISettings();
      const response = await sendAIMessage(currentInput, settings);
      
      const aiMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      toast.success("Ответ получен");
    } catch (error) {
      const errorMessage: Message = {
        role: "error",
        content: error instanceof Error ? error.message : "Произошла ошибка при обращении к AI",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Ошибка при получении ответа");
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Скопировано в буфер обмена");
  };

  const handleModelChange = (model: string) => {
    setAISettings((prev) => {
      const next = { ...prev, selectedModel: model };
      saveAISettings(next);
      return next;
    });
    toast.success("Модель обновлена", {
      description: model,
    });
  };

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }
    toast.info("Откройте раздел Настройки в меню", {
      description: "Там можно подключить AI",
    });
  };

  const currentModels = aiSettings.provider === "openrouter" ? AI_MODELS.openrouter : AI_MODELS.custom;
  const isCustomModel =
    !!aiSettings.selectedModel &&
    !currentModels.some((model) => model.id === aiSettings.selectedModel);
  const hasAPIKey = aiSettings.provider === "openrouter" 
    ? !!aiSettings.openRouterApiKey 
    : !!(aiSettings.customApiKey && aiSettings.customApiUrl);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI Ассистент
          </h1>
          <p className="text-muted-foreground">
            Умный помощник для генерации контента и автоматизации задач
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={aiSettings.selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Выбрать модель" />
            </SelectTrigger>
            <SelectContent>
              {currentModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
              {isCustomModel && (
                <SelectItem value={aiSettings.selectedModel}>
                  {aiSettings.selectedModel} (custom)
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasAPIKey && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p>API ключ не настроен. Перейдите в Настройки для настройки AI.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenSettings}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Настройки
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Area */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="flex h-[600px] flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : message.role === "error"
                          ? "bg-destructive/10 border border-destructive/20"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "error" && (
                        <div className="mb-2 flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>Ошибка</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.role === "assistant" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted p-4">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground" />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-foreground"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-foreground"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Напишите сообщение..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={isTyping || !hasAPIKey}
                />
                <Button onClick={handleSend} disabled={isTyping || !hasAPIKey || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Prompts */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <motion.div
                    key={prompt.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                    >
                      <Icon className="h-4 w-4" />
                      {prompt.label}
                    </Button>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Context */}
          <Card>
            <CardHeader>
              <CardTitle>Контекст</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                Прикрепите карточку или проект для более точных ответов
              </p>
              <Button variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Прикрепить контекст
              </Button>
            </CardContent>
          </Card>

          {/* Recent Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Недавние темы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <div className="rounded-lg border p-2 transition-colors hover:bg-accent">
                  <p className="line-clamp-2">Создание чек-листа для проекта</p>
                  <span className="text-muted-foreground">10 мин назад</span>
                </div>
                <div className="rounded-lg border p-2 transition-colors hover:bg-accent">
                  <p className="line-clamp-2">Генерация описаний задач</p>
                  <span className="text-muted-foreground">1 час назад</span>
                </div>
                <div className="rounded-lg border p-2 transition-colors hover:bg-accent">
                  <p className="line-clamp-2">Идеи для новых проектов</p>
                  <span className="text-muted-foreground">2 часа назад</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Всего запросов</span>
                <Badge>42</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Сегодня</span>
                <Badge>8</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Сохранено</span>
                <Badge>15</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
