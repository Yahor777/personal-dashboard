// @ts-nocheck
import { useState } from 'react';
import { X, Trash2, Copy, Calendar as CalendarIcon, Plus, Sparkles, Timer } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { ImageGallery } from './ImageGallery';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import type { Card, Priority, CardType, ChecklistItem } from '../types';

interface CardDrawerProps {
  card: Card;
  onClose: () => void;
}

export function CardDrawer({ card, onClose }: CardDrawerProps) {
  const { workspace, updateCard, deleteCard, duplicateCard, completeCard, addImageToCard, removeImageFromCard, updateCardImage } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  
  // Ensure arrays exist with fallbacks
  const safeCard = {
    ...card,
    tags: card.tags || [],
    checklist: card.checklist || [],
    comments: card.comments || [],
    images: card.images || [],
    attachments: card.attachments || [],
    reminders: card.reminders || [],
  };
  
  const [title, setTitle] = useState(safeCard.title);
  const [description, setDescription] = useState(safeCard.description);
  const [priority, setPriority] = useState<Priority>(safeCard.priority);
  const [type, setType] = useState<CardType>(safeCard.type);
  const [tags, setTags] = useState(safeCard.tags.join(', '));
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

  const handleSave = () => {
    updateCard(card.id, {
      title,
      description,
      priority,
      type,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const handleDelete = () => {
    if (confirm('Удалить карточку?')) {
      deleteCard(card.id);
      onClose();
    }
  };

  const handleDuplicate = () => {
    duplicateCard(card.id);
  };

  const handleComplete = () => {
    completeCard(card.id);
    onClose();
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: `check-${Date.now()}`,
        text: newChecklistItem.trim(),
        completed: false,
      };
      updateCard(card.id, {
        checklist: [...safeCard.checklist, newItem],
      });
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    updateCard(card.id, {
      checklist: safeCard.checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    updateCard(card.id, {
      checklist: safeCard.checklist.filter((item) => item.id !== itemId),
    });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      updateCard(card.id, {
        comments: [
          ...safeCard.comments,
          {
            id: `comment-${Date.now()}`,
            text: newComment.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      });
      setNewComment('');
    }
  };

  const handleGenerateChecklist = () => {
    // Smart feature: Generate checklist from description
    const lines = description.split('\n').filter((line) => {
      const trimmed = line.trim();
      return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed));
    });

    const newItems = lines.map((line) => ({
      id: `check-${Date.now()}-${Math.random()}`,
      text: line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim(),
      completed: false,
    }));

    if (newItems.length > 0) {
      updateCard(card.id, {
        checklist: [...card.checklist, ...newItems],
      });
    }
  };

  const handleExtractIngredients = () => {
    // Smart feature for recipes: Extract ingredients
    const ingredientLines = description.split('\n').filter((line) => {
      const trimmed = line.trim().toLowerCase();
      return trimmed && (trimmed.includes('г') || trimmed.includes('шт') || trimmed.includes('ст.л') || trimmed.includes('ч.л'));
    });

    if (ingredientLines.length > 0) {
      updateCard(card.id, {
        ingredients: ingredientLines.map((line) => line.trim()),
      });
    }
  };

  const handleStartPomodoro = () => {
    setIsPomodoroRunning(true);
    setTimeout(() => {
      setIsPomodoroRunning(false);
      updateCard(card.id, {
        pomodoroCount: (card.pomodoroCount || 0) + 1,
        timeSpent: (card.timeSpent || 0) + pomodoroMinutes,
      });
      alert('Pomodoro завершён! 🍅');
    }, pomodoroMinutes * 60 * 1000);
  };

  return (
    <div data-panel="true" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
          <h2>Редактирование карточки</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="mr-2 size-4" />
            {t('duplicate')}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 size-4" />
            {t('delete')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label>{t('cardTitle')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="Название карточки"
            />
          </div>

          {/* Type, Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('cardType')}</Label>
              <Select value={type} onValueChange={(v: string) => { setType(v as CardType); handleSave(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">{t('typeTask')}</SelectItem>
                  <SelectItem value="flashcard">{t('typeFlashcard')}</SelectItem>
                  <SelectItem value="recipe">{t('typeRecipe')}</SelectItem>
                  <SelectItem value="note">{t('typeNote')}</SelectItem>
                  <SelectItem value="pc-component">💻 {t('typePcComponent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('cardPriority')}</Label>
              <Select value={priority} onValueChange={(v: string) => { setPriority(v as Priority); handleSave(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('priorityLow')}</SelectItem>
                  <SelectItem value="medium">{t('priorityMedium')}</SelectItem>
                  <SelectItem value="high">{t('priorityHigh')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>{t('cardTags')}</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onBlur={handleSave}
              placeholder="математика, срочно, экзамен"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('cardDescription')} (Markdown)</Label>
              <div className="flex gap-2">
                {type === 'recipe' && (
                  <Button variant="outline" size="sm" onClick={handleExtractIngredients}>
                    <Sparkles className="mr-2 size-4" />
                    {t('extractIngredients')}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleGenerateChecklist}>
                  <Sparkles className="mr-2 size-4" />
                  {t('generateChecklist')}
                </Button>
              </div>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              placeholder="Описание в формате Markdown..."
              className="min-h-32"
            />
          </div>

          <Separator />

          {/* Tabs for additional features */}
          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="images">📸 Фото</TabsTrigger>
              <TabsTrigger value="checklist">Чек-лист</TabsTrigger>
              <TabsTrigger value="comments">Комментарии</TabsTrigger>
              <TabsTrigger value="timer">Таймер</TabsTrigger>
              <TabsTrigger value="details">Детали</TabsTrigger>
            </TabsList>

            <TabsContent value="images" className="space-y-4">
              <ImageGallery
                images={safeCard.images}
                onAddImage={(image) => addImageToCard(card.id, image)}
                onRemoveImage={(imageId) => removeImageFromCard(card.id, imageId)}
                onUpdateImage={(imageId, updates) => updateCardImage(card.id, imageId, updates)}
              />
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Добавить пункт..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddChecklistItem();
                  }}
                />
                <Button onClick={handleAddChecklistItem}>
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {safeCard.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggleChecklistItem(item.id)}
                    />
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Добавить комментарий..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                />
                <Button onClick={handleAddComment}>
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {safeCard.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-muted p-3">
                    <p>{comment.text}</p>
                    <p className="mt-1 text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timer" className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="mb-4">Pomodoro Таймер</h4>
                <div className="mb-4 flex items-center gap-4">
                  <Label>Минут:</Label>
                  <Input
                    type="number"
                    value={pomodoroMinutes}
                    onChange={(e) => setPomodoroMinutes(Number(e.target.value))}
                    className="w-20"
                    disabled={isPomodoroRunning}
                  />
                </div>
                <Button
                  onClick={handleStartPomodoro}
                  disabled={isPomodoroRunning}
                  className="w-full"
                >
                  <Timer className="mr-2 size-4" />
                  {isPomodoroRunning ? 'Таймер запущен...' : t('startPomodoro')}
                </Button>
                {(card.pomodoroCount ?? 0) > 0 && (
                  <div className="mt-4">
                    <p className="text-muted-foreground">
                      Завершено сессий: {card.pomodoroCount} 🍅
                    </p>
                    <p className="text-muted-foreground">
                      Общее время: {card.timeSpent} мин
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {type === 'pc-component' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Тип компонента</Label>
                      <Input
                        value={card.componentType || ''}
                        onChange={(e) => updateCard(card.id, { componentType: e.target.value })}
                        placeholder="GPU, CPU, RAM..."
                      />
                    </div>
                    <div>
                      <Label>Состояние</Label>
                      <Select
                        value={card.condition || 'good'}
                        onValueChange={(v: string) => updateCard(card.id, { condition: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Новое</SelectItem>
                          <SelectItem value="like-new">Как новое</SelectItem>
                          <SelectItem value="good">Хорошее</SelectItem>
                          <SelectItem value="fair">Среднее</SelectItem>
                          <SelectItem value="for-parts">На запчасти</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Моя цена (zł)</Label>
                      <Input
                        type="number"
                        value={card.myPrice || ''}
                        onChange={(e) => updateCard(card.id, { myPrice: parseFloat(e.target.value) })}
                        placeholder="250"
                      />
                    </div>
                    <div>
                      <Label>Рыночная цена (zł)</Label>
                      <Input
                        type="number"
                        value={card.marketPrice || ''}
                        onChange={(e) => updateCard(card.id, { marketPrice: parseFloat(e.target.value) })}
                        placeholder="300"
                      />
                    </div>
                  </div>

                  {card.marketPrice && card.myPrice && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-muted-foreground">
                        💰 Разница: {card.marketPrice - card.myPrice} zł
                        ({((1 - card.myPrice / card.marketPrice) * 100).toFixed(1)}% выгода)
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Ссылка OLX/Allegro</Label>
                    <Input
                      value={card.olxLink || ''}
                      onChange={(e) => updateCard(card.id, { olxLink: e.target.value })}
                      placeholder="https://olx.pl/..."
                    />
                  </div>

                  <div>
                    <Label>Серийный номер</Label>
                    <Input
                      value={card.serialNumber || ''}
                      onChange={(e) => updateCard(card.id, { serialNumber: e.target.value })}
                      placeholder="SN: ABC123..."
                    />
                  </div>
                </div>
              )}

              {type === 'recipe' && card.ingredients && (
                <div>
                  <h4 className="mb-2">Ингредиенты</h4>
                  <ul className="list-inside list-disc space-y-1">
                    {card.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}
              {type === 'flashcard' && (
                <div className="space-y-4">
                  <div>
                    <Label>Вопрос</Label>
                    <Input
                      value={card.question || ''}
                      onChange={(e) => updateCard(card.id, { question: e.target.value })}
                      placeholder="Вопрос"
                    />
                  </div>
                  <div>
                    <Label>Ответ</Label>
                    <Input
                      value={card.answer || ''}
                      onChange={(e) => updateCard(card.id, { answer: e.target.value })}
                      placeholder="Ответ"
                    />
                  </div>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">
                  Создано: {new Date(card.createdAt).toLocaleString('ru-RU')}
                </p>
                <p className="text-muted-foreground">
                  Обновлено: {new Date(card.updatedAt).toLocaleString('ru-RU')}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Button onClick={handleComplete} className="flex-1">
            Отметить как выполненное
          </Button>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}
