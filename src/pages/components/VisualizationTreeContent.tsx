import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import TreeView from '@/components/TreeView';
import type { TreeNode } from '@/types/ast';
import { Network } from 'lucide-react';

interface VisualizationTreeContentProps {
  tree: TreeNode | null;
  optimizeEnabled: boolean;
  fullNodeCount: number;
  optimizedNodeCount: number;
  onToggleOptimize: () => void;
  onNodeClick: (interval: { startIdx: number; endIdx: number } | null) => void;
  hasError: boolean;
}

export const VisualizationTreeContent: React.FC<VisualizationTreeContentProps> = ({
  tree,
  optimizeEnabled,
  fullNodeCount,
  optimizedNodeCount,
  onToggleOptimize,
  onNodeClick,
  hasError,
}) => {
  if (!tree) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Network className="h-12 w-12 mx-auto opacity-20" />
          <p className="text-sm font-medium">No AST to display</p>
          <p className="text-xs">Enter program text and parse to see the tree</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <p className="mb-2 text-xs text-muted-foreground">
        <span className="font-mono">Uppercase</span> rules appear in tree.{' '}
        <span className="font-mono">lowercase</span> rules are lexical tokens.
      </p>

      <div className="flex-1 overflow-hidden">
        <ErrorBoundary fallbackTitle="Tree View Error">
          <TreeView
            data={tree}
            optimizeEnabled={optimizeEnabled}
            fullNodeCount={fullNodeCount}
            optimizedNodeCount={optimizedNodeCount}
            onToggleOptimize={onToggleOptimize}
            onNodeClick={onNodeClick}
          />
        </ErrorBoundary>
      </div>
      {hasError && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-400 dark:border-yellow-600 rounded px-3 py-1.5">
          <p className="text-xs text-yellow-900 dark:text-yellow-100">Showing last valid parse</p>
        </div>
      )}
    </div>
  );
};
