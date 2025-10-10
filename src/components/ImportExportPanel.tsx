import { useState } from 'react';
import { X, Download, Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import type { Workspace } from '../types';

interface ImportExportPanelProps {
  onClose: () => void;
}

export function ImportExportPanel({ onClose }: ImportExportPanelProps) {
  const { workspace, importWorkspace } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const [importData, setImportData] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(workspace, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-panel-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccess('JSON файл успешно экспортирован!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Заголовок', 'Тип', 'Приоритет', 'Теги', 'Дата создания', 'Колонка'];
    const rows = workspace.cards.map((card) => {
      const tab = workspace.tabs.find((t) => t.columns.some((col) => col.id === card.columnId));
      const column = tab?.columns.find((col) => col.id === card.columnId);
      return [
        card.id,
        `"${card.title.replace(/"/g, '""')}"`,
        card.type,
        card.priority,
        `"${card.tags.join(', ')}"`,
        card.createdAt,
        column?.title || '',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-panel-cards-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccess('CSV файл успешно экспортирован!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleImportJSON = () => {
    try {
      setError('');
      const data = JSON.parse(importData) as Workspace;
      
      // Validate data structure
      if (!data.tabs || !data.cards || !data.settings) {
        throw new Error('Неверный формат данных');
      }

      importWorkspace(data);
      setSuccess('Данные успешно импортированы!');
      setImportData('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      setError('Ошибка импорта: ' + (err as Error).message);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2>Импорт/Экспорт данных</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Export Section */}
          <div>
            <h3 className="mb-4">Экспорт данных</h3>
            <div className="space-y-3">
              <Button onClick={handleExportJSON} className="w-full justify-start" variant="outline">
                <FileJson className="mr-2 size-5" />
                <div className="flex-1 text-left">
                  <div>Экспортировать в JSON</div>
                  <p className="text-muted-foreground">
                    Полная копия всех данных (вкладки, карточки, настройки)
                  </p>
                </div>
                <Download className="ml-2 size-5" />
              </Button>

              <Button onClick={handleExportCSV} className="w-full justify-start" variant="outline">
                <FileSpreadsheet className="mr-2 size-5" />
                <div className="flex-1 text-left">
                  <div>Экспортировать карточки в CSV</div>
                  <p className="text-muted-foreground">
                    Таблица со всеми карточками для Excel/Google Sheets
                  </p>
                </div>
                <Download className="ml-2 size-5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Import Section */}
          <div>
            <h3 className="mb-4">Импорт данных</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Загрузить JSON файл</Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="mt-2 w-full cursor-pointer rounded-md border border-border bg-input-background px-3 py-2"
                />
              </div>

              <div className="text-center text-muted-foreground">или</div>

              <div>
                <Label htmlFor="import-text">Вставить JSON данные</Label>
                <Textarea
                  id="import-text"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder='{"id": "workspace-1", "name": "Моя Панель", ...}'
                  className="mt-2 min-h-32 font-mono"
                />
              </div>

              <Button
                onClick={handleImportJSON}
                disabled={!importData.trim()}
                className="w-full"
              >
                <Upload className="mr-2 size-4" />
                Импортировать данные
              </Button>

              <Alert>
                <AlertDescription>
                  <strong>Внимание:</strong> Импорт заменит все текущие данные. Перед импортом
                  рекомендуется сделать экспорт текущих данных.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <Separator />

          {/* JSON Schema Documentation */}
          <div>
            <h3 className="mb-4">JSON Schema</h3>
            <div className="rounded-lg bg-muted p-4">
              <pre className="overflow-x-auto text-xs">
{`{
  "id": "string",
  "name": "string",
  "tabs": [
    {
      "id": "string",
      "title": "string",
      "template": "school|cooking|personal|blank",
      "columns": [
        {
          "id": "string",
          "title": "string",
          "order": number,
          "cardIds": []
        }
      ],
      "order": number,
      "createdAt": "ISO 8601"
    }
  ],
  "cards": [
    {
      "id": "string",
      "title": "string",
      "description": "markdown",
      "type": "task|flashcard|recipe|note",
      "priority": "low|medium|high",
      "tags": ["string"],
      "columnId": "string",
      "order": number,
      ...
    }
  ],
  "settings": {
    "theme": "light|dark",
    "language": "ru|pl|en",
    "accentColor": "#hex",
    ...
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
