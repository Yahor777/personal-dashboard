import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Paperclip, CheckSquare, MessageSquare, Flag } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Card } from '../types';

interface KanbanCardProps {
  card: Card;
  onClick: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ card, onClick, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const typeIcons: Record<string, string> = {
    task: '📋',
    flashcard: '🎴',
    recipe: '🍳',
    note: '📝',
    'pc-component': '💻',
  };

  const completedChecklist = (card.checklist || []).filter((item) => item.completed).length;
  const totalChecklist = (card.checklist || []).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group cursor-pointer rounded-lg border-2 border-border bg-card/95 backdrop-blur-sm p-3 shadow-md hover:shadow-xl hover:border-primary/50 transition-all ${
        isDragging ? 'rotate-2 shadow-2xl border-primary' : ''
      }`}
    >
      {/* Card Type Icon & Priority */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-lg">{typeIcons[card.type]}</span>
        <Badge variant="outline" className={`shrink-0 ${priorityColors[card.priority]}`}>
          {card.priority}
        </Badge>
      </div>

      {/* Title */}
      <h4 className="mb-2 line-clamp-2 font-semibold text-foreground">{card.title}</h4>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {card.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{card.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
        {card.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span className="text-xs">
              {new Date(card.dueDate).toLocaleDateString('ru-RU', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
        {totalChecklist > 0 && (
          <div className="flex items-center gap-1">
            <CheckSquare className="size-3" />
            <span className="text-xs">
              {completedChecklist}/{totalChecklist}
            </span>
          </div>
        )}
        {(card.attachments || []).length > 0 && (
          <div className="flex items-center gap-1">
            <Paperclip className="size-3" />
            <span className="text-xs">{(card.attachments || []).length}</span>
          </div>
        )}
        {(card.comments || []).length > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            <span className="text-xs">{(card.comments || []).length}</span>
          </div>
        )}
      </div>

      {/* Pomodoro indicator */}
      {(card.pomodoroCount ?? 0) > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-muted-foreground">🍅 {card.pomodoroCount}</span>
        </div>
      )}
    </div>
  );
}
