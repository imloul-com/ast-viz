import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListOrdered, X, GripVertical } from 'lucide-react';
import { RuleChip, type ChipType } from './RuleChip';
import { Button } from '@/components/ui/button';

interface ListOfWrapperProps {
  id: string;
  wrappedElement: {
    id: string;
    value: string;
    type: ChipType;
  };
  separator: {
    id: string;
    value: string;
    type: ChipType;
  };
  isNonempty: boolean;
  onRemove?: () => void;
  onEditWrappedElement?: (newValue: string) => void;
  onEditSeparator?: (newValue: string) => void;
  draggable?: boolean;
}

export const ListOfWrapper: React.FC<ListOfWrapperProps> = ({
  id,
  wrappedElement,
  separator,
  isNonempty,
  onRemove,
  onEditWrappedElement,
  onEditSeparator,
  draggable = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-indigo-400 dark:border-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'cursor-grabbing shadow-lg' : draggable ? 'cursor-grab' : ''
      }`}
    >
      {/* Drag handle */}
      {draggable && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing focus:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 opacity-50 hover:opacity-100 text-indigo-600 dark:text-indigo-400" />
        </button>
      )}
      
      {/* Icon and label */}
      <div className="flex items-center gap-1.5">
        <ListOrdered className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
          {isNonempty ? 'nonemptyListOf' : 'listOf'}
        </span>
      </div>
      
      {/* Opening paren */}
      <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">(</span>
      
      {/* Element chip - inline editable */}
      <RuleChip
        id={wrappedElement.id}
        value={wrappedElement.value}
        type={wrappedElement.type}
        draggable={false}
        onEdit={() => {}} // Enable editing mode
        onModifierChange={onEditWrappedElement}
      />
      
      {/* Comma separator */}
      <span className="text-xs text-muted-foreground">,</span>
      
      {/* Separator chip - inline editable */}
      <RuleChip
        id={separator.id}
        value={separator.value}
        type={separator.type}
        draggable={false}
        onEdit={() => {}} // Enable editing mode
        onModifierChange={onEditSeparator}
      />
      
      {/* Closing paren */}
      <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">)</span>
      
      {/* Remove button */}
      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="h-5 w-5 p-0 ml-1 hover:bg-indigo-200 dark:hover:bg-indigo-800 flex-shrink-0"
          aria-label="Remove wrapper"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

