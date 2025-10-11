import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store/useStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Button } from './ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from './ui/input';
import { useTranslation } from '../data/translations';
import type { Card } from '../types';

interface KanbanBoardProps {
  tabId: string;
  onCardClick: (card: Card) => void;
}

export function KanbanBoard({ tabId, onCardClick }: KanbanBoardProps) {
  const { workspace, searchQuery, setSearchQuery, filterTags, filterPriority, addColumn } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const tab = workspace.tabs.find((t) => t.id === tabId);
  if (!tab) return null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getFilteredCards = (columnId: string) => {
    let cards = workspace.cards.filter((card) => card.columnId === columnId);

    if (searchQuery) {
      cards = cards.filter(
        (card) =>
          card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterTags.length > 0) {
      cards = cards.filter((card) => card.tags.some((tag) => filterTags.includes(tag)));
    }

    if (filterPriority.length > 0) {
      cards = cards.filter((card) => filterPriority.includes(card.priority));
    }

    return cards.sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = workspace.cards.find((c) => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    
    const { active, over } = event;
    if (!over) return;

    const activeCard = workspace.cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    const overId = over.id.toString();
    
    // Check if dropped on a column
    const targetColumn = tab.columns.find((col) => col.id === overId);
    if (targetColumn) {
      const cardsInColumn = workspace.cards.filter((c) => c.columnId === targetColumn.id);
      useStore.getState().moveCard(activeCard.id, targetColumn.id, cardsInColumn.length);
      return;
    }

    // Check if dropped on another card
    const overCard = workspace.cards.find((c) => c.id === overId);
    if (overCard && overCard.columnId !== activeCard.columnId) {
      useStore.getState().moveCard(activeCard.id, overCard.columnId, overCard.order);
    } else if (overCard && overCard.columnId === activeCard.columnId) {
      useStore.getState().moveCard(activeCard.id, overCard.columnId, overCard.order);
    }
  };

  const handleAddColumn = () => {
    const title = prompt(t('newColumn'));
    if (title) {
      addColumn(tabId, title);
    }
  };

  return (
    <div className="flex h-full flex-col" data-kanban-board>
      {/* Search & Filter Bar */}
      <div className="border-b border-border bg-background p-2 md:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Button onClick={handleAddColumn} variant="outline" size="default" className="h-11 whitespace-nowrap">
            <Plus className="mr-2 size-4" />
            <span className="hidden sm:inline">{t('newColumn')}</span>
            <span className="sm:hidden">Колонка</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto touch-pan-x">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-3 md:gap-4 p-3 md:p-4">
            {tab.columns
              .sort((a, b) => a.order - b.order)
              .map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tabId={tabId}
                  cards={getFilteredCards(column.id)}
                  onCardClick={onCardClick}
                />
              ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="rotate-3 opacity-80">
                <KanbanCard card={activeCard} onClick={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
