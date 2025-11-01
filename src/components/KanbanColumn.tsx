// @ts-nocheck
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store/useStore';
import { KanbanCard } from './KanbanCard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, MoreVertical, Grip } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { Column, Card as CardType } from '../types';
import { useTranslation } from '../data/translations';
import { memo, useCallback, useMemo } from 'react';

interface KanbanColumnProps {
  column: Column;
  tabId: string;
  cards: CardType[];
  onCardClick: (card: CardType) => void;
}

const KanbanColumn = memo(function KanbanColumn({ column, tabId, cards, onCardClick }: KanbanColumnProps) {
  const { workspace, addCard, updateColumn, deleteColumn } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleAddCard = useCallback(() => {
    addCard({
      title: 'Новая карточка',
      description: '',
      type: 'task',
      priority: 'medium',
      tags: [],
      reminders: [],
      attachments: [],
      checklist: [],
      comments: [],
      images: [],
      columnId: column.id,
    });
  }, [addCard, column.id]);

  const handleRenameColumn = useCallback(() => {
    const newTitle = prompt(t('renameColumn'), column.title);
    if (newTitle) {
      updateColumn(tabId, column.id, newTitle);
    }
  }, [t, column.title, column.id, tabId, updateColumn]);

  const handleDeleteColumn = useCallback(() => {
    if (confirm('Удалить колонку и все карточки в ней?')) {
      deleteColumn(tabId, column.id);
    }
  }, [tabId, column.id, deleteColumn]);

  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

  const priorityStats = useMemo(() => {
    const stats = { high: 0, medium: 0, low: 0 };
    cards.forEach(card => {
      stats[card.priority]++;
    });
    return stats;
  }, [cards]);

  const hasHighPriorityCards = priorityStats.high > 0;

  return (
    <Card className={`flex w-72 md:w-80 shrink-0 flex-col transition-all duration-200 ${
      isOver ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'
    }`} data-kanban-column>
      {/* Column Header */}
      <div className="border-b border-border p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Grip className="size-4 text-muted-foreground cursor-grab" />
            <h3 className="font-semibold truncate text-sm md:text-base">{column.title}</h3>
            <Badge variant="secondary" className="shrink-0">
              {cards.length}
            </Badge>
            {hasHighPriorityCards && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                {priorityStats.high} высокий
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleRenameColumn}>
                {t('renameColumn')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteColumn} className="text-destructive">
                {t('deleteColumn')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards Area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 p-2 md:p-3 overflow-y-auto transition-colors ${
          isOver ? 'bg-accent/30' : ''
        }`}
        style={{ minHeight: '200px', maxHeight: 'calc(100vh - 300px)' }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 md:p-8 text-center">
            <div className="space-y-2">
              <div className="text-2xl">📝</div>
              <p className="text-sm text-muted-foreground">{t('emptyColumn')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Card Button */}
      <div className="border-t border-border p-2 md:p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddCard}
          className="w-full justify-start hover:bg-accent transition-colors"
        >
          <Plus className="mr-2 size-4" />
          {t('newCard')}
        </Button>
      </div>
    </Card>
  );
});

export { KanbanColumn };
