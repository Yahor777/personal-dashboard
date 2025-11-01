import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import { BookOpen, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const roadmap = [
  {
    category: "Основы",
    topics: [
      { id: 1, name: "Переменные и типы данных", completed: true, difficulty: "easy", lessons: 5 },
      { id: 2, name: "Условия и циклы", completed: true, difficulty: "easy", lessons: 7 },
      { id: 3, name: "Функции", completed: false, difficulty: "medium", lessons: 6 },
      { id: 4, name: "Списки и словари", completed: false, difficulty: "medium", lessons: 8 },
    ],
  },
  {
    category: "ООП",
    topics: [
      { id: 5, name: "Классы и объекты", completed: false, difficulty: "medium", lessons: 6 },
      { id: 6, name: "Наследование", completed: false, difficulty: "hard", lessons: 5 },
      { id: 7, name: "Полиморфизм", completed: false, difficulty: "hard", lessons: 4 },
    ],
  },
  {
    category: "Продвинутое",
    topics: [
      { id: 8, name: "Декораторы", completed: false, difficulty: "hard", lessons: 4 },
      { id: 9, name: "Генераторы", completed: false, difficulty: "hard", lessons: 3 },
      { id: 10, name: "Асинхронность", completed: false, difficulty: "hard", lessons: 6 },
    ],
  },
];

const resources = [
  { title: "Python.org Documentation", url: "#", type: "Документация" },
  { title: "Real Python Tutorials", url: "#", type: "Туториалы" },
  { title: "Python Crash Course", url: "#", type: "Книга" },
  { title: "Automate the Boring Stuff", url: "#", type: "Книга" },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "default";
    case "medium":
      return "secondary";
    case "hard":
      return "destructive";
    default:
      return "secondary";
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "Легко";
    case "medium":
      return "Средне";
    case "hard":
      return "Сложно";
    default:
      return difficulty;
  }
};

export function PythonLearning() {
  const [completedTopics, setCompletedTopics] = useState(
    roadmap.flatMap((cat) => cat.topics.filter((t) => t.completed).map((t) => t.id))
  );

  const totalTopics = roadmap.reduce((sum, cat) => sum + cat.topics.length, 0);
  const progress = (completedTopics.length / totalTopics) * 100;

  const toggleTopic = (id: number) => {
    setCompletedTopics((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-500" />
          Python Learning Roadmap
        </h1>
        <p className="text-muted-foreground">Структурированный путь изучения Python</p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3>Общий прогресс</h3>
              <p className="text-muted-foreground">
                {completedTopics.length} из {totalTopics} тем завершено
              </p>
            </div>
            <div className="text-right">
              <span className="text-green-500">{progress.toFixed(0)}%</span>
            </div>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roadmap */}
        <div className="space-y-4 lg:col-span-2">
          {roadmap.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.topics.map((topic) => {
                    const isCompleted = completedTopics.includes(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleTopic(topic.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <h4 className={isCompleted ? "line-through opacity-60" : ""}>
                              {topic.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getDifficultyColor(topic.difficulty)}>
                              {getDifficultyLabel(topic.difficulty)}
                            </Badge>
                            <span className="text-muted-foreground">
                              {topic.lessons} уроков
                            </span>
                          </div>
                          {!isCompleted && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Начать
                              </Button>
                              <Button size="sm" variant="ghost">
                                Подробнее
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Ресурсы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resources.map((resource) => (
                  <a
                    key={resource.title}
                    href={resource.url}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="space-y-1">
                      <p>{resource.title}</p>
                      <Badge variant="secondary">{resource.type}</Badge>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Завершено тем</span>
                <Badge>{completedTopics.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">В процессе</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Осталось</span>
                <Badge variant="outline">{totalTopics - completedTopics.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Следующие шаги</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg border p-3">
                <h4>Функции</h4>
                <p className="text-muted-foreground">6 уроков • Средняя сложность</p>
                <Button size="sm" className="mt-2 w-full">
                  Продолжить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card>
            <CardHeader>
              <CardTitle>Мини-квиз</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Проверьте свои знания по завершённым темам
              </p>
              <Button variant="outline" className="w-full">
                Начать квиз
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
