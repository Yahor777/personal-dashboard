import { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, Trophy, Clock, BookOpen, Video, FileText, Code, Lightbulb, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { toast } from 'sonner';
import { PYTHON_ROADMAP, calculateProgress, type PythonTopic, type PythonModule } from '../data/pythonRoadmap';
import { useStore } from '../store/useStore';

interface PythonLearningPanelProps {
  onClose: () => void;
}

export function PythonLearningPanel({ onClose }: PythonLearningPanelProps) {
  const { kanbanCards, updateKanbanCard } = useStore();
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<PythonTopic | null>(null);

  // Загрузка прогресса из Kanban карточек
  useEffect(() => {
    const pythonProgressCard = kanbanCards.find((c: any) => c.title === '🐍 Python Learning Progress');
    if (pythonProgressCard && pythonProgressCard.description) {
      try {
        const data = JSON.parse(pythonProgressCard.description);
        if (data.completedTopics) {
          setCompletedTopics(data.completedTopics);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [kanbanCards]);

  // Сохранение прогресса
  const saveProgress = (topicIds: string[]) => {
    setCompletedTopics(topicIds);
    
    // Найдём или создадим карточку прогресса
    const pythonProgressCard = kanbanCards.find((c: any) => c.title === '🐍 Python Learning Progress');
    
    const progressData = {
      completedTopics: topicIds,
      lastUpdated: new Date().toISOString(),
    };

    if (pythonProgressCard) {
      updateKanbanCard(pythonProgressCard.id, {
        description: JSON.stringify(progressData),
        tags: ['python', 'learning', 'roadmap'],
      });
    }
  };

  const toggleTopicComplete = (topicId: string) => {
    let newCompleted: string[];
    if (completedTopics.includes(topicId)) {
      newCompleted = completedTopics.filter(id => id !== topicId);
      toast.info('Тема отмечена как незавершённая');
    } else {
      newCompleted = [...completedTopics, topicId];
      toast.success('✅ Тема завершена! Продолжай учиться!');
    }
    saveProgress(newCompleted);
  };

  const isTopicUnlocked = (topic: PythonTopic): boolean => {
    return topic.prerequisites.every(prereqId => completedTopics.includes(prereqId));
  };

  const progress = calculateProgress(completedTopics);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-orange-500';
      case 'expert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="size-4" />;
      case 'article': return <FileText className="size-4" />;
      case 'book': return <BookOpen className="size-4" />;
      case 'practice': return <Code className="size-4" />;
      case 'project': return <Lightbulb className="size-4" />;
      default: return <FileText className="size-4" />;
    }
  };

  return (
    <div data-panel="true" className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 pt-safe">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🐍</div>
          <div>
            <h2 className="text-xl font-bold">Python Learning Roadmap</h2>
            <p className="text-sm text-muted-foreground">
              От новичка до профи - твой путь в программировании
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 pb-safe">
        <div className="p-6 space-y-6">
          {/* Общий прогресс */}
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="size-5 text-yellow-500" />
                  Твой прогресс
                </div>
                <Badge variant="secondary" className="text-lg px-4">
                  {progress.percentage}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress.percentage} className="h-3" />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{progress.completedTopics}</p>
                  <p className="text-sm text-muted-foreground">из {progress.totalTopics} тем</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{progress.completedHours}h</p>
                  <p className="text-sm text-muted-foreground">из {progress.totalHours}h обучения</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">
                    {PYTHON_ROADMAP.filter(m => m.topics.every(t => completedTopics.includes(t.id))).length}
                  </p>
                  <p className="text-sm text-muted-foreground">из {PYTHON_ROADMAP.length} модулей</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Модули обучения */}
          {PYTHON_ROADMAP.map((module) => {
            const moduleCompleted = module.topics.filter(t => completedTopics.includes(t.id)).length;
            const moduleTotal = module.topics.length;
            const moduleProgress = Math.round((moduleCompleted / moduleTotal) * 100);

            return (
              <Card key={module.id} className={`border-${module.color}-500`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-3xl">{module.emoji}</span>
                      <div>
                        <h3 className="text-lg font-bold">{module.name}</h3>
                        <p className="text-sm text-muted-foreground font-normal">
                          {module.description}
                        </p>
                      </div>
                    </CardTitle>
                    <Badge variant="outline">
                      {moduleCompleted}/{moduleTotal}
                    </Badge>
                  </div>
                  <Progress value={moduleProgress} className="h-2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {module.topics.map((topic) => {
                      const isCompleted = completedTopics.includes(topic.id);
                      const isUnlocked = isTopicUnlocked(topic);

                      return (
                        <AccordionItem
                          key={topic.id}
                          value={topic.id}
                          className={`border rounded-lg ${isCompleted ? 'bg-green-500/10 border-green-500' : ''} ${!isUnlocked ? 'opacity-50' : ''}`}
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-shrink-0">
                                {!isUnlocked ? (
                                  <Lock className="size-5 text-muted-foreground" />
                                ) : isCompleted ? (
                                  <CheckCircle className="size-5 text-green-500" />
                                ) : (
                                  <Circle className="size-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <h4 className="font-semibold">{topic.title}</h4>
                                <p className="text-sm text-muted-foreground">{topic.description}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={getDifficultyColor(topic.difficulty)}>
                                  {topic.difficulty}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {topic.estimatedHours}h
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-4 mt-2">
                              {/* Ресурсы */}
                              {topic.resources.length > 0 && (
                                <div>
                                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                                    <BookOpen className="size-4" />
                                    Ресурсы для изучения
                                  </h5>
                                  <div className="space-y-2">
                                    {topic.resources.map((resource, idx) => (
                                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                                        {getResourceIcon(resource.type)}
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{resource.title}</p>
                                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                                          {resource.url && (
                                            <a
                                              href={resource.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-primary hover:underline"
                                            >
                                              Открыть ссылку →
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Задачи */}
                              {topic.tasks.length > 0 && (
                                <div>
                                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                                    <Code className="size-4" />
                                    Практические задачи ({topic.tasks.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {topic.tasks.map((task) => (
                                      <div key={task.id} className="p-3 rounded border bg-card">
                                        <h6 className="font-medium">{task.title}</h6>
                                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                        {task.solution && (
                                          <details className="mt-2">
                                            <summary className="cursor-pointer text-sm text-primary hover:underline">
                                              Показать решение
                                            </summary>
                                            <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto" data-scroll-x>
                                              <code>{task.solution}</code>
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Кнопка завершения */}
                              <Button
                                onClick={() => toggleTopicComplete(topic.id)}
                                variant={isCompleted ? 'outline' : 'default'}
                                className="w-full"
                                disabled={!isUnlocked}
                              >
                                {!isUnlocked ? (
                                  <>
                                    <Lock className="size-4 mr-2" />
                                    Заблокировано (выполни предыдущие темы)
                                  </>
                                ) : isCompleted ? (
                                  <>
                                    <CheckCircle className="size-4 mr-2" />
                                    Отменить завершение
                                  </>
                                ) : (
                                  <>
                                    <Circle className="size-4 mr-2" />
                                    Отметить как завершённое
                                  </>
                                )}
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
