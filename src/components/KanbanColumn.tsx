import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store/useStore';
import { KanbanCard } from './KanbanCard';
import { Button } from './ui/button';
import { Plus, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { Column, Card } from '../types';
import { useTranslation } from '../data/translations';

interface KanbanColumnProps {
  column: Column;
  tabId: string;
  cards: Card[];
  onCardClick: (card: Card) => void;
}

export function KanbanColumn({ column, tabId, cards, onCardClick }: KanbanColumnProps) {
  const { workspace, addCard, updateColumn, deleteColumn } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleAddCard = () => {
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
  };

  const handleRenameColumn = () => {
    const newTitle = prompt(t('renameColumn'), column.title);
    if (newTitle) {
      updateColumn(tabId, column.id, newTitle);
    }
  };

  const handleDeleteColumn = () => {
    if (confirm('Удалить колонку и все карточки в ней?')) {
      deleteColumn(tabId, column.id);
    }
  };

  return (
    <div className="flex w-72 md:w-80 shrink-0 flex-col rounded-lg bg-muted/30 p-2 md:p-3" data-kanban-column>
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="truncate">{column.title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {cards.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleRenameColumn}>
              {t('renameColumn')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteColumn} className="text-destructive">
              {t('deleteColumn')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards Area */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto rounded-md p-1 transition-colors ${
          isOver ? 'bg-accent/50' : ''
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-border p-8 text-center text-muted-foreground">
            <p>{t('emptyColumn')}</p>
          </div>
        )}
      </div>

      {/* Add Card Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddCard}
        className="mt-2 w-full justify-start"
      >
        <Plus className="mr-2 size-4" />
        {t('newCard')}
      </Button>
    </div>
  );
}
