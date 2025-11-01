// @ts-nocheck
import { useState, useMemo, useCallback, memo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store/useStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Plus, Search, Menu, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useTranslation } from '../data/translations';
import { SidebarTrigger } from './ui/sidebar';
import type { Card as CardType } from '../types';

interface KanbanBoardProps {
  tabId: string;
  onCardClick: (card: CardType) => void;
}

const KanbanBoard = memo(function KanbanBoard({ tabId, onCardClick }: KanbanBoardProps) {
  const { workspace, searchQuery, setSearchQuery, filterTags, filterPriority, addColumn } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const tab = useMemo(() => 
    workspace.tabs.find((t) => t.id === tabId), 
    [workspace.tabs, tabId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getFilteredCards = useCallback((columnId: string) => {
    let cards = workspace.cards.filter((card) => card.columnId === columnId);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          card.description.toLowerCase().includes(query) ||
          card.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filterTags.length > 0) {
      cards = cards.filter((card) => card.tags.some((tag) => filterTags.includes(tag)));
    }

    if (filterPriority.length > 0) {
      cards = cards.filter((card) => filterPriority.includes(card.priority));
    }

    return cards.sort((a, b) => a.order - b.order);
  }, [workspace.cards, searchQuery, filterTags, filterPriority]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = workspace.cards.find((c) => c.id === event.active.id);
    setActiveCard(card || null);
  }, [workspace.cards]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null);
    
    const { active, over } = event;
    if (!over || !tab) return;

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
  }, [workspace.cards, tab]);

  const handleAddColumn = useCallback(() => {
    const title = prompt(t('newColumn'));
    if (title && tab) {
      addColumn(tabId, title);
    }
  }, [t, tab, tabId, addColumn]);

  const sortedColumns = useMemo(() => {
    if (!tab) return [];
    return tab.columns.sort((a, b) => a.order - b.order);
  }, [tab]);

  const activeFiltersCount = useMemo(() => {
    return filterTags.length + filterPriority.length;
  }, [filterTags.length, filterPriority.length]);

  if (!tab) return null;

  return (
    <div className="flex h-full flex-col" data-kanban-board>
      {/* Search & Filter Bar */}
      <Card className="border-b border-border bg-background/95 backdrop-blur-sm p-3 md:p-4 rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <SidebarTrigger className="md:hidden shrink-0">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Menu className="size-5" />
            </Button>
          </SidebarTrigger>
          
          <div className="flex flex-1 items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-background/50"
              />
            </div>
            
            {/* Active filters indicator */}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="size-3" />
                {activeFiltersCount}
              </Badge>
            )}
            
            <Button 
              onClick={handleAddColumn} 
              variant="outline" 
              size="default" 
              className="h-11 whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Plus className="mr-2 size-4" />
              <span className="hidden sm:inline">{t('newColumn')}</span>
              <span className="sm:hidden">Колонка</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto touch-pan-x bg-gradient-to-br from-background to-muted/20" data-scroll-x>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-3 md:gap-4 p-3 md:p-4 min-w-max">
            {sortedColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tabId={tabId}
                cards={getFilteredCards(column.id)}
                onCardClick={onCardClick}
              />
            ))}
            
            {/* Empty state when no columns */}
            {sortedColumns.length === 0 && (
              <Card className="flex flex-col items-center justify-center p-8 min-w-[300px] border-dashed">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2">Нет колонок</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Создайте первую колонку для начала работы
                </p>
                <Button onClick={handleAddColumn} variant="default">
                  <Plus className="mr-2 size-4" />
                  Создать колонку
                </Button>
              </Card>
            )}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="rotate-3 opacity-80 scale-105">
                <KanbanCard card={activeCard} onClick={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
});

export { KanbanBoard };
