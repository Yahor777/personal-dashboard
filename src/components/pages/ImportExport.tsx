import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Download, Upload, FileJson, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export function ImportExport() {
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [importData, setImportData] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleExport = (format: "json" | "csv") => {
    const mockData = {
      tasks: [
        { id: 1, title: "Изучить React", status: "В процессе" },
        { id: 2, title: "Создать проект", status: "Выполнено" },
      ],
      projects: [
        { id: 1, name: "Dashboard", progress: 65 },
        { id: 2, name: "API", progress: 45 },
      ],
      searches: [
        { query: "RTX 4070", source: "OLX", results: 12 },
      ],
    };

    if (format === "json") {
      const json = JSON.stringify(mockData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      setNotification({ type: "success", message: "Данные успешно экспортированы в JSON" });
    } else {
      // Simple CSV export
      const csv = "type,id,name,value\ntask,1,Изучить React,В процессе\ntask,2,Создать проект,Выполнено";
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      setNotification({ type: "success", message: "Данные успешно экспортированы в CSV" });
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleImport = () => {
    try {
      if (!importData.trim()) {
        setNotification({ type: "error", message: "Пожалуйста, вставьте данные для импорта" });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      const parsed = JSON.parse(importData);
      console.log("Imported data:", parsed);
      setNotification({
        type: "success",
        message: `Успешно импортировано: ${Object.keys(parsed).length} категорий данных`,
      });
      setImportData("");
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        type: "error",
        message: "Ошибка при импорте: неверный формат JSON",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1>Импорт / Экспорт</h1>
        <p className="text-muted-foreground">
          Управление резервным копированием и переносом данных
        </p>
      </div>

      {/* Notifications */}
      {notification && (
        <Alert variant={notification.type === "error" ? "destructive" : "default"}>
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-500" />
                <CardTitle>Экспорт данных</CardTitle>
              </div>
              <CardDescription>Сохраните все данные приложения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Выберите формат экспорта</Label>
                <div className="grid gap-2">
                  <Button
                    variant={exportFormat === "json" ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setExportFormat("json")}
                  >
                    <FileJson className="h-4 w-4" />
                    JSON (все данные)
                  </Button>
                  <Button
                    variant={exportFormat === "csv" ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setExportFormat("csv")}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (таблица)
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <h4>Включено в экспорт:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Задачи и проекты</li>
                  <li>• История поиска</li>
                  <li>• Настройки приложения</li>
                  <li>• Сохранённые данные CS2</li>
                  <li>• Конфигурации PC Builder</li>
                  <li>• История AI чата</li>
                </ul>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => handleExport(exportFormat)}
              >
                <Download className="h-4 w-4" />
                Экспортировать как {exportFormat.toUpperCase()}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Import */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                <CardTitle>Импорт данных</CardTitle>
              </div>
              <CardDescription>
                Восстановите данные из резервной копии
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Импорт заменит все текущие данные. Рекомендуется создать резервную копию перед импортом.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Загрузить файл</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Выбрать файл
                      <input
                        id="file-upload"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Или вставьте JSON данные</Label>
                <Textarea
                  placeholder='{"tasks": [...], "projects": [...]}'
                  className="min-h-[200px]"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleImport}
                disabled={!importData.trim()}
              >
                <Upload className="h-4 w-4" />
                Импортировать данные
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <span className="text-muted-foreground">Последний экспорт</span>
              <p>28 октября 2025</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <span className="text-muted-foreground">Размер данных</span>
              <p>2.4 MB</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <span className="text-muted-foreground">Версия формата</span>
              <p>1.0.0</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
