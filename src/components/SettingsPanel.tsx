import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
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
                  onValueChange={(v) => handleThemeChange(v as Theme)}
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
                  onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
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
              onValueChange={(v) => updateSettings({ language: v as Language })}
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
            <h3 className="mb-4">AI Ассистент</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Включить AI</Label>
                  <p className="text-muted-foreground">
                    Умные функции и помощник
                  </p>
                </div>
                <Switch
                  checked={workspace.settings.aiEnabled || false}
                  onCheckedChange={(checked) => updateSettings({ aiEnabled: checked })}
                />
              </div>

              {workspace.settings.aiEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Провайдер AI</Label>
                    <Select
                      value={workspace.settings.aiProvider || 'ollama'}
                      onValueChange={(v) => updateSettings({ aiProvider: v as any })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ollama">Ollama (локально)</SelectItem>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                        <SelectItem value="local">Local Mock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {workspace.settings.aiProvider === 'openrouter' && (
                    <div className="space-y-2">
                      <Label htmlFor="ai-key">API Key</Label>
                      <Input
                        id="ai-key"
                        type="password"
                        value={workspace.settings.aiApiKey || ''}
                        onChange={(e) => updateSettings({ aiApiKey: e.target.value })}
                        placeholder="sk-..."
                      />
                      <p className="text-muted-foreground">
                        Получите бесплатный ключ на openrouter.ai
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground">
                      💡 <strong>Ollama:</strong> Скачайте с ollama.ai для локальной работы
                    </p>
                  </div>
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
                onCheckedChange={(checked) => updateSettings({ notifications: checked })}
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
                Всего карточек: {workspace.cards.length}
              </p>
              <p className="text-muted-foreground">
                Всего вкладок: {workspace.tabs.length}
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
