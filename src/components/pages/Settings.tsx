import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Palette, Globe, Bell, Database, Trash2, Sparkles, Save } from "lucide-react";
import { motion } from "motion/react";
import { getAISettings, saveAISettings, AI_MODELS, type AISettings } from "../../lib/ai-settings";
import { toast } from "sonner";

interface SettingsProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export function Settings({ theme, onThemeChange }: SettingsProps) {
  const storageAvailable = typeof window !== "undefined" && !!window.localStorage;
  const [aiSettings, setAISettings] = useState<AISettings>(() => getAISettings());
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (!storageAvailable) {
      return true;
    }
    return window.localStorage.getItem("notifications-enabled") !== "false";
  });

  useEffect(() => {
    if (!storageAvailable) {
      return;
    }
    window.localStorage.setItem("notifications-enabled", notificationsEnabled.toString());
  }, [notificationsEnabled, storageAvailable]);

  const handleSaveAISettings = () => {
    saveAISettings(aiSettings);
    toast.success("AI настройки сохранены");
  };

  const handleClearData = () => {
    if (storageAvailable) {
      window.localStorage.clear();
    }
    toast.success("Все данные очищены");
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 1000);
    }
  };
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1>Настройки</h1>
        <p className="text-muted-foreground">Управление параметрами приложения</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Внешний вид</CardTitle>
              </div>
              <CardDescription>Настройте визуальный стиль приложения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Тема</Label>
                <Select value={theme} onValueChange={(val: string) => onThemeChange(val as "light" | "dark")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Светлая</SelectItem>
                    <SelectItem value="dark">Тёмная</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Акцентный цвет</Label>
                <Select defaultValue="indigo">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indigo">Индиго</SelectItem>
                    <SelectItem value="blue">Синий</SelectItem>
                    <SelectItem value="purple">Фиолетовый</SelectItem>
                    <SelectItem value="green">Зелёный</SelectItem>
                    <SelectItem value="orange">Оранжевый</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Шрифт</Label>
                <Select defaultValue="inter">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="system">Системный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Высокая контрастность</Label>
                  <p className="text-muted-foreground">
                    Улучшает читаемость для людей с нарушениями зрения
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <CardTitle>AI Настройки</CardTitle>
              </div>
              <CardDescription>Настройка AI моделей и API ключей</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Провайдер AI</Label>
                <Select
                  value={aiSettings.provider}
                  onValueChange={(val: "openrouter" | "custom") =>
                    setAISettings({ ...aiSettings, provider: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {aiSettings.provider === "openrouter" && (
                <>
                  <div className="space-y-2">
                    <Label>OpenRouter API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-or-..."
                      value={aiSettings.openRouterApiKey}
                      onChange={(e) =>
                        setAISettings({ ...aiSettings, openRouterApiKey: e.target.value })
                      }
                    />
                    <p className="text-muted-foreground">
                      Получите ключ на{" "}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        openrouter.ai
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Модель</Label>
                    <Input
                      placeholder="meta-llama/llama-3.1-70b-instruct:free"
                      value={aiSettings.selectedModel}
                      list="openrouter-models"
                      onChange={(e) =>
                        setAISettings({ ...aiSettings, selectedModel: e.target.value })
                      }
                    />
                    <datalist id="openrouter-models">
                      {AI_MODELS.openrouter.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </datalist>
                    <p className="text-xs text-muted-foreground">
                      Укажите точное имя модели OpenRouter. Добавьте суффикс <code>:free</code>, если хотите бесплатную версию.
                    </p>
                  </div>
                </>
              )}

              {aiSettings.provider === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Input
                      placeholder="https://api.example.com/v1/chat/completions"
                      value={aiSettings.customApiUrl}
                      onChange={(e) =>
                        setAISettings({ ...aiSettings, customApiUrl: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="your-api-key"
                      value={aiSettings.customApiKey}
                      onChange={(e) =>
                        setAISettings({ ...aiSettings, customApiKey: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Модель</Label>
                    <Input
                      placeholder="gpt-4"
                      value={aiSettings.selectedModel}
                      onChange={(e) =>
                        setAISettings({ ...aiSettings, selectedModel: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <Button className="w-full gap-2" onClick={handleSaveAISettings}>
                <Save className="h-4 w-4" />
                Сохранить AI настройки
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Язык и регион</CardTitle>
              </div>
              <CardDescription>Выберите предпочитаемый язык</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Язык интерфейса</Label>
                <Select defaultValue="ru">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polski</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Часовой пояс</Label>
                <Select defaultValue="europe-moscow">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe-moscow">Москва (GMT+3)</SelectItem>
                    <SelectItem value="europe-warsaw">Варшава (GMT+1)</SelectItem>
                    <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Уведомления</CardTitle>
              </div>
              <CardDescription>Управление уведомлениями приложения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Включить уведомления</Label>
                  <p className="text-muted-foreground">
                    Показывать уведомления о действиях в приложении
                  </p>
                </div>
                <Switch 
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Задачи и проекты</Label>
                  <p className="text-muted-foreground">
                    Уведомления о новых и завершённых задачах
                  </p>
                </div>
                <Switch defaultChecked disabled={!notificationsEnabled} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Результаты поиска</Label>
                  <p className="text-muted-foreground">
                    Уведомления о новых результатах поиска OLX
                  </p>
                </div>
                <Switch defaultChecked disabled={!notificationsEnabled} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Аналитика и отчёты</Label>
                  <p className="text-muted-foreground">
                    Еженедельные сводки производительности
                  </p>
                </div>
                <Switch disabled={!notificationsEnabled} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Звуковые уведомления</Label>
                  <p className="text-muted-foreground">
                    Воспроизведение звука при уведомлениях
                  </p>
                </div>
                <Switch defaultChecked disabled={!notificationsEnabled} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Storage Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Хранилище</CardTitle>
              </div>
              <CardDescription>Управление локальными данными</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Использовано хранилища</span>
                  <span>2.4 MB / 10 MB</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: "24%" }} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Задачи и проекты</span>
                  <span>1.2 MB</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>История поиска</span>
                  <span>0.8 MB</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Настройки</span>
                  <span>0.4 MB</span>
                </div>
              </div>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="h-4 w-4" />
                    Очистить все данные
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие удалит все ваши задачи, проекты, историю поиска и настройки.
                      Это действие нельзя отменить.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground"
                      onClick={handleClearData}
                    >
                      Удалить всё
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>О приложении</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Версия</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Последнее обновление</span>
                <span>31 октября 2025</span>
              </div>
              <div className="flex justify-between">
                <span>Лицензия</span>
                <span>MIT</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
