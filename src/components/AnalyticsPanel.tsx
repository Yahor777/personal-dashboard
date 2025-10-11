import { X, TrendingUp, Clock, CheckCircle2, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsPanelProps {
  onClose: () => void;
}

export function AnalyticsPanel({ onClose }: AnalyticsPanelProps) {
  const { workspace, getAnalytics } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const analytics = getAnalytics();

  // Prepare data for charts
  const tabData = Object.entries(analytics.timeByTab).map(([name, time]) => ({
    name,
    time,
  }));

  const priorityData = (workspace.cards || []).reduce(
    (acc, card) => {
      acc[card.priority] = (acc[card.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const priorityChartData = [
    { name: 'Высокий', value: priorityData.high || 0, color: '#ef4444' },
    { name: 'Средний', value: priorityData.medium || 0, color: '#f59e0b' },
    { name: 'Низкий', value: priorityData.low || 0, color: '#3b82f6' },
  ];

  const typeData = (workspace.cards || []).reduce(
    (acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const typeChartData = [
    { name: 'Задачи', value: typeData.task || 0 },
    { name: 'Карточки', value: typeData.flashcard || 0 },
    { name: 'Рецепты', value: typeData.recipe || 0 },
    { name: 'Заметки', value: typeData.note || 0 },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2>{t('analytics')}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground">
                  Всего карточек
                </CardTitle>
                <Target className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div>{analytics.totalCards}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground">
                  Выполнено
                </CardTitle>
                <CheckCircle2 className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div>{analytics.completedCards}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground">
                  Прогресс
                </CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div>{analytics.completionRate.toFixed(1)}%</div>
                <Progress value={analytics.completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground">
                  Всего времени
                </CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div>
                  {Object.values(analytics.timeByTab).reduce((a, b) => (a as number) + (b as number), 0 as number) as number} мин
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Распределение по приоритету</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tags Cloud */}
          <Card>
            <CardHeader>
              <CardTitle>Популярные теги</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  (workspace.cards || []).reduce((acc, card) => {
                    card.tags.forEach((tag) => {
                      acc[tag] = (acc[tag] || 0) + 1;
                    });
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 20)
                  .map(([tag, count]) => (
                    <div
                      key={tag}
                      className="rounded-full bg-primary/10 px-3 py-1"
                      style={{
                        fontSize: `${Math.min(1 + count * 0.1, 1.5)}rem`,
                      }}
                    >
                      {tag} <span className="text-muted-foreground">({count})</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Pomodoro Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика Pomodoro 🍅</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  Всего сессий:{' '}
                  {(workspace.cards || []).reduce((sum, card) => sum + (card.pomodoroCount || 0), 0)}
                </p>
                <p>
                  Общее время фокусировки:{' '}
                  {(workspace.cards || []).reduce((sum, card) => sum + (card.timeSpent || 0), 0)} минут
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
