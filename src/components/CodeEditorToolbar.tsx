import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeEditorToolbarProps {
  onFoldAll: () => void;
  onUnfoldAll: () => void;
}

export const CodeEditorToolbar: React.FC<CodeEditorToolbarProps> = ({
  onFoldAll,
  onUnfoldAll,
}) => {
  return (
    <div className="flex gap-2 items-center flex-none">
      <Button
        variant="outline"
        size="sm"
        onClick={onFoldAll}
        className="gap-1"
        title="Collapse all rules (Ctrl+Shift+[)"
      >
        <ChevronRight className="w-4 h-4" />
        Collapse All
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onUnfoldAll}
        className="gap-1"
        title="Expand all rules (Ctrl+Shift+])"
      >
        <ChevronDown className="w-4 h-4" />
        Expand All
      </Button>
      <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
        Click the gutter or use Ctrl+Shift+[ / ] to fold/unfold
      </span>
    </div>
  );
};
