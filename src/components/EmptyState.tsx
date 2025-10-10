import { Plus, Inbox } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Inbox className="size-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="mr-2 size-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
