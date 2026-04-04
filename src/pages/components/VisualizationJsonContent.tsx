import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import JsonView from '@/components/JsonView';
import type { ASTNode } from '@/types/ast';
import { Braces } from 'lucide-react';

interface VisualizationJsonContentProps {
  ast: ASTNode | null;
  hasError: boolean;
}

export const VisualizationJsonContent: React.FC<VisualizationJsonContentProps> = ({
  ast,
  hasError,
}) => {
  if (!ast) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Braces className="h-12 w-12 mx-auto opacity-20" />
          <p className="text-sm font-medium">No AST to display</p>
          <p className="text-xs">Enter program text and parse to see the JSON</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <ErrorBoundary fallbackTitle="JSON View Error">
        <JsonView data={ast} />
      </ErrorBoundary>
      {hasError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-400 dark:border-yellow-600 rounded px-3 py-1.5 z-10">
          <p className="text-xs text-yellow-900 dark:text-yellow-100">Showing last valid parse</p>
        </div>
      )}
    </div>
  );
};
