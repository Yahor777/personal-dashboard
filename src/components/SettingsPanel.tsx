import { X, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { AIModelSelector } from './AIModelSelector';
import { toast } from 'sonner';
import type { Language, Theme } from '../types';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { workspace, updateSettings, resetWorkspace } = useStore();
  const { t } = useTranslation(workspace.settings.language);

  const handleThemeChange = (theme: Theme) => {
    updateSettings({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const handleReset = () => {
    if (confirm('Сбросить все данные? Это действие нельзя отменить.')) {
      resetWorkspace();
      onClose();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2>{t('settings')}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Appearance */}
          <div>
            <h3 className="mb-4">Внешний вид</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('theme')}</Label>
                <Select
                  value={workspace.settings.theme}
                  onValueChange={(v: string) => handleThemeChange(v as Theme)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('themeLight')}</SelectItem>
                    <SelectItem value="dark">{t('themeDark')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('highContrast')}</Label>
                  <p className="text-muted-foreground">
                    Улучшает читаемость
                  </p>
                </div>
                <Switch
                  checked={workspace.settings.highContrast}
                  onCheckedChange={(checked: boolean) => updateSettings({ highContrast: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t('accentColor')}</Label>
                <input
                  type="color"
                  value={workspace.settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded border border-border"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Language */}
          <div>
            <h3 className="mb-4">{t('language')}</h3>
            <Select
              value={workspace.settings.language}
              onValueChange={(v: string) => updateSettings({ language: v as Language })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский 🇷🇺</SelectItem>
                <SelectItem value="pl">Polski 🇵🇱</SelectItem>
                <SelectItem value="en">English 🇬🇧</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* User Settings */}
          <div>
            <h3 className="mb-4">Персонализация</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="user-name">Имя пользователя</Label>
                <Input
                  id="user-name"
                  value={workspace.settings.userName || ''}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  placeholder="Твоё имя"
                  className="w-48"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* AI Settings */}
          <div>
            <h3 className="mb-4">🤖 AI Ассистент</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Провайдер AI</Label>
                <Select
                  value={workspace.settings.aiProvider || 'none'}
                  onValueChange={(v: string) => {
                    // Auto-migrate from broken models (404 errors from OpenRouter)
                    const currentModel = workspace.settings.aiModel;
                    const brokenModels = [
                      'google/gemini-flash-1.5:free',
                      'meta-llama/llama-3.2-11b-vision-instruct:free',
                      'meta-llama/llama-3.1-8b-instruct:free',
                      'microsoft/phi-3-medium-128k-instruct:free'
                    ];
                    
                    if (!currentModel || brokenModels.includes(currentModel)) {
                      updateSettings({ 
                        aiProvider: v as any,
                        aiModel: 'google/gemma-2-9b-it:free'
                      });
                    } else {
                      updateSettings({ aiProvider: v as any });
                    }
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не использовать</SelectItem>
                    <SelectItem value="openrouter">OpenRouter (GPT, Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                    <SelectItem value="ollama">Ollama (локально)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {workspace.settings.aiProvider && workspace.settings.aiProvider !== 'none' && (
                <>
                  {/* API Key для OpenRouter и OpenAI */}
                  {(workspace.settings.aiProvider === 'openrouter' || workspace.settings.aiProvider === 'openai') && (
                    <div className="space-y-2">
                      <Label htmlFor="ai-key">API Key</Label>
                      <Input
                        id="ai-key"
                        type="password"
                        value={workspace.settings.aiApiKey || ''}
                        onChange={(e) => updateSettings({ aiApiKey: e.target.value })}
                        placeholder={workspace.settings.aiProvider === 'openai' ? 'sk-...' : 'sk-or-v1-...'}
                      />
                      <p className="text-xs text-muted-foreground">
                        {workspace.settings.aiProvider === 'openrouter' 
                          ? '🔗 Получите на openrouter.ai (есть бесплатные модели)'
                          : '🔗 Получите на platform.openai.com'}
                      </p>
                    </div>
                  )}

                  {/* Выбор модели */}
                  <div className="space-y-2">
                    <Label>Модель AI</Label>
                    <AIModelSelector
                      provider={workspace.settings.aiProvider}
                      currentModel={workspace.settings.aiModel}
                      onSelectModel={(model: string) => updateSettings({ aiModel: model })}
                    />
                  </div>

                  {/* Ollama URL */}
                  {workspace.settings.aiProvider === 'ollama' && (
                    <div className="space-y-2">
                      <Label htmlFor="ollama-url">Ollama URL</Label>
                      <Input
                        id="ollama-url"
                        value={workspace.settings.ollamaUrl || ''}
                        onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                        placeholder="http://localhost:11434"
                      />
                      <div className="rounded-lg bg-blue-500/10 p-3 text-sm text-blue-600">
                        <p className="font-semibold mb-1">🚀 Установка Ollama:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Скачайте с ollama.ai</li>
                          <li>Установите и запустите</li>
                          <li>В терминале: <code className="bg-blue-500/20 px-1 rounded">ollama run llama2</code></li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Информация о провайдере */}
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
                    {workspace.settings.aiProvider === 'openrouter' && (
                      <>
                        <p className="font-semibold">✨ OpenRouter плюсы:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Доступ к GPT-4, Claude, Llama и другим моделям</li>
                          <li>• Есть бесплатные модели для начала</li>
                          <li>• Единый API для всех моделей</li>
                        </ul>
                      </>
                    )}
                    {workspace.settings.aiProvider === 'openai' && (
                      <>
                        <p className="font-semibold">✨ OpenAI:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Официальные модели GPT</li>
                          <li>• Высокое качество ответов</li>
                          <li>• Требуется API ключ с балансом</li>
                        </ul>
                      </>
                    )}
                    {workspace.settings.aiProvider === 'ollama' && (
                      <>
                        <p className="font-semibold">✨ Ollama плюсы:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Полностью локально и бесплатно</li>
                          <li>• Не нужен API ключ</li>
                          <li>• Работает без интернета</li>
                          <li>• Конфиденциальность данных</li>
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Кнопка сохранения настроек AI */}
                  <Button 
                    onClick={() => {
                      toast.success('Настройки AI сохранены!', {
                        description: `Провайдер: ${workspace.settings.aiProvider}, Модель: ${workspace.settings.aiModel || 'не выбрана'}`
                      });
                    }}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить настройки AI
                  </Button>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div>
            <h3 className="mb-4">{t('notifications')}</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label>Включить уведомления</Label>
                <p className="text-muted-foreground">
                  Напоминания о задачах и сроках
                </p>
              </div>
              <Switch
                checked={workspace.settings.notifications}
                onCheckedChange={(checked: boolean) => updateSettings({ notifications: checked })}
              />
            </div>
          </div>

          <Separator />

          {/* Storage Info */}
          <div>
            <h3 className="mb-4">Хранилище</h3>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Данные сохраняются локально в браузере
              </p>
              <p className="text-muted-foreground">
                Всего карточек: {(workspace.cards || []).length}
              </p>
              <p className="text-muted-foreground">
                Всего вкладок: {(workspace.tabs || []).length}
              </p>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h3 className="mb-4 text-destructive">Опасная зона</h3>
            <Button variant="destructive" onClick={handleReset} className="w-full">
              Сбросить все данные
            </Button>
            <p className="mt-2 text-muted-foreground">
              Это удалит все вкладки, карточки и настройки. Перед сбросом сделайте экспорт данных.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <p className="text-center text-muted-foreground">
          Моя Панель v1.0
        </p>
      </div>
    </div>
  );
}
