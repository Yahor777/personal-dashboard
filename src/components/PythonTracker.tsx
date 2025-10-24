import { useState } from 'react';
import { X, Code2, Book, Rocket, CheckCircle2, Circle, Trophy, Flame, Target, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

interface PythonTrackerProps {
  onClose: () => void;
}

// 📚 Roadmap обучения Python
const PYTHON_ROADMAP = [
  {
    id: 'basics',
    title: '🌱 Основы Python',
    topics: [
      { id: 'basics-1', name: 'Переменные и типы данных', completed: false },
      { id: 'basics-2', name: 'Операторы и условия (if/else)', completed: false },
      { id: 'basics-3', name: 'Циклы (for/while)', completed: false },
      { id: 'basics-4', name: 'Функции', completed: false },
      { id: 'basics-5', name: 'Списки и кортежи', completed: false },
      { id: 'basics-6', name: 'Словари и множества', completed: false },
    ],
  },
  {
    id: 'intermediate',
    title: '🔥 Средний уровень',
    topics: [
      { id: 'int-1', name: 'ООП: Классы и объекты', completed: false },
      { id: 'int-2', name: 'Наследование и полиморфизм', completed: false },
      { id: 'int-3', name: 'Работа с файлами', completed: false },
      { id: 'int-4', name: 'Обработка исключений', completed: false },
      { id: 'int-5', name: 'Модули и пакеты', completed: false },
      { id: 'int-6', name: 'List/Dict comprehensions', completed: false },
    ],
  },
  {
    id: 'libraries',
    title: '📦 Библиотеки',
    topics: [
      { id: 'lib-1', name: 'NumPy для вычислений', completed: false },
      { id: 'lib-2', name: 'Pandas для данных', completed: false },
      { id: 'lib-3', name: 'Matplotlib для графиков', completed: false },
      { id: 'lib-4', name: 'Requests для API', completed: false },
      { id: 'lib-5', name: 'BeautifulSoup для web scraping', completed: false },
      { id: 'lib-6', name: 'Flask/Django для веб', completed: false },
    ],
  },
  {
    id: 'advanced',
    title: '🚀 Продвинутый',
    topics: [
      { id: 'adv-1', name: 'Декораторы', completed: false },
      { id: 'adv-2', name: 'Генераторы', completed: false },
      { id: 'adv-3', name: 'Асинхронное программирование', completed: false },
      { id: 'adv-4', name: 'Multithreading и multiprocessing', completed: false },
      { id: 'adv-5', name: 'Type hints', completed: false },
      { id: 'adv-6', name: 'Testing (pytest)', completed: false },
    ],
  },
  {
    id: 'ml',
    title: '🤖 Machine Learning',
    topics: [
      { id: 'ml-1', name: 'Scikit-learn основы', completed: false },
      { id: 'ml-2', name: 'Линейная регрессия', completed: false },
      { id: 'ml-3', name: 'Классификация', completed: false },
      { id: 'ml-4', name: 'TensorFlow/PyTorch', completed: false },
      { id: 'ml-5', name: 'Нейронные сети', completed: false },
      { id: 'ml-6', name: 'Computer Vision', completed: false },
    ],
  },
];

// 💡 Проекты для практики
const PROJECT_IDEAS = [
  { id: 'proj-1', title: 'Калькулятор', difficulty: 'Easy', description: 'Консольный калькулятор с 4 операциями' },
  { id: 'proj-2', title: 'To-Do List', difficulty: 'Easy', description: 'Список задач с save/load в файл' },
  { id: 'proj-3', title: 'Генератор паролей', difficulty: 'Easy', description: 'Случайные безопасные пароли' },
  { id: 'proj-4', title: 'Погодное приложение', difficulty: 'Medium', description: 'API OpenWeather + GUI' },
  { id: 'proj-5', title: 'Web scraper', difficulty: 'Medium', description: 'Парсинг новостей с сайта' },
  { id: 'proj-6', title: 'Telegram бот', difficulty: 'Medium', description: 'Бот для полезной функции' },
  { id: 'proj-7', title: 'Data Analysis проект', difficulty: 'Medium', description: 'Анализ датасета с Pandas' },
  { id: 'proj-8', title: 'REST API', difficulty: 'Hard', description: 'Flask/Django + database' },
  { id: 'proj-9', title: 'Machine Learning модель', difficulty: 'Hard', description: 'Предсказание чего-либо' },
  { id: 'proj-10', title: 'Игра (Snake/Tetris)', difficulty: 'Hard', description: 'С pygame' },
];

// 📝 Code Snippets
const CODE_SNIPPETS = [
  {
    id: 'snippet-1',
    title: 'List Comprehension',
    code: `# Создать список квадратов чисел
squares = [x**2 for x in range(10)]

# С условием
even_squares = [x**2 for x in range(10) if x % 2 == 0]`,
    category: 'Basics',
  },
  {
    id: 'snippet-2',
    title: 'Чтение файла',
    code: `# Безопасное чтение файла
with open('file.txt', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = f.readlines()`,
    category: 'Files',
  },
  {
    id: 'snippet-3',
    title: 'API запрос',
    code: `import requests

response = requests.get('https://api.example.com/data')
data = response.json()
print(data)`,
    category: 'API',
  },
  {
    id: 'snippet-4',
    title: 'Pandas загрузка CSV',
    code: `import pandas as pd

df = pd.read_csv('data.csv')
print(df.head())
print(df.describe())`,
    category: 'Data',
  },
];

export function PythonTracker({ onClose }: PythonTrackerProps) {
  const { workspace } = useStore();
  const [activeTab, setActiveTab] = useState('roadmap');
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(7); // Days in a row

  const toggleTopic = (topicId: string) => {
    const newCompleted = new Set(completedTopics);
    if (newCompleted.has(topicId)) {
      newCompleted.delete(topicId);
      toast.info('Тема откреплена');
    } else {
      newCompleted.add(topicId);
      toast.success('🎉 Тема изучена!', {
        description: 'Продолжай в том же духе!',
      });
    }
    setCompletedTopics(newCompleted);
  };

  // Calculate progress
  const totalTopics = PYTHON_ROADMAP.reduce((sum, section) => sum + section.topics.length, 0);
  const completedCount = completedTopics.size;
  const progress = Math.round((completedCount / totalTopics) * 100);

  return (
    <div data-panel="true" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 pt-safe">
        <div className="flex items-center gap-3">
          <Code2 className="size-5 text-primary" />
          <div>
            <h2 className="font-semibold">🐍 Python Learning Tracker</h2>
            <p className="text-xs text-muted-foreground">Твой путь от новичка до профи</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Stats Header */}
      <div className="border-b border-border bg-muted/30 p-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Trophy className="size-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{progress}%</div>
                  <div className="text-xs text-muted-foreground">Прогресс</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Flame className="size-8 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{streak} дней</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Target className="size-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{completedCount}/{totalTopics}</div>
                  <div className="text-xs text-muted-foreground">Тем изучено</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="roadmap">📚 Roadmap</TabsTrigger>
          <TabsTrigger value="projects">💡 Проекты</TabsTrigger>
          <TabsTrigger value="snippets">📝 Сниппеты</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pb-safe">
            <div className="p-6">
            <TabsContent value="roadmap" className="mt-0 space-y-4">
              {PYTHON_ROADMAP.map((section) => {
                const sectionCompleted = section.topics.filter(t => completedTopics.has(t.id)).length;
                const sectionProgress = Math.round((sectionCompleted / section.topics.length) * 100);

                return (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <Badge variant="secondary">{sectionCompleted}/{section.topics.length}</Badge>
                      </div>
                      <Progress value={sectionProgress} className="h-1" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {section.topics.map((topic) => {
                        const isCompleted = completedTopics.has(topic.id);
                        return (
                          <div
                            key={topic.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isCompleted ? 'bg-green-500/10' : 'hover:bg-muted'
                            }`}
                            onClick={() => toggleTopic(topic.id)}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="size-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                              {topic.name}
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="projects" className="mt-0 space-y-4">
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                <p className="flex items-center gap-2 font-medium text-blue-600">
                  <Sparkles className="size-4" />
                  💡 Совет: Делай проекты по мере обучения!
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Практика важнее теории. Каждый проект закрепит знания.
                </p>
              </div>

              {PROJECT_IDEAS.map((project) => (
                <Card key={project.id} className="hover:border-primary cursor-pointer transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{project.title}</CardTitle>
                      <Badge
                        variant={
                          project.difficulty === 'Easy'
                            ? 'secondary'
                            : project.difficulty === 'Medium'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {project.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{project.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="snippets" className="mt-0 space-y-4">
              {CODE_SNIPPETS.map((snippet) => (
                <Card key={snippet.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{snippet.title}</CardTitle>
                      <Badge variant="outline">{snippet.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto" data-scroll-x>
                      <code>{snippet.code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        navigator.clipboard.writeText(snippet.code);
                        toast.success('Код скопирован!');
                      }}
                    >
                      Копировать
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
