import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectedNode {
  name: string;
  fullName: string;
  value: string;
  fullValue: string;
}

interface SelectedNodePanelProps {
  node: SelectedNode | null;
  onClose: () => void;
}

export const SelectedNodePanel: React.FC<SelectedNodePanelProps> = ({ node, onClose }) => {
  if (!node) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-background/95 border px-4 py-3 rounded-lg max-w-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">Selected Node</div>
          <div className="font-mono text-sm font-medium text-foreground break-all">{node.fullName}</div>
          {node.value !== '(no value)' && (
            <div className="mt-1.5">
              <div className="text-xs text-muted-foreground mb-0.5">Value:</div>
              <div className="font-mono text-sm text-foreground bg-muted px-2 py-1 rounded break-all">
                {node.fullValue}
              </div>
            </div>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-6 w-6 flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
