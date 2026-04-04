import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Redo2, Share2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GrammarHeaderActionsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenTutorial: () => void;
  onShare: () => void;
  canShare: boolean;
}

export const GrammarHeaderActions: React.FC<GrammarHeaderActionsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenTutorial,
  onShare,
  canShare,
}) => {
  return (
    <>
      <div className="flex items-center gap-1 hd:mr-2 hd:border-r hd:pr-2">
        <Button
          onClick={onUndo}
          size="sm"
          variant="ghost"
          className="gap-1 px-2 hd:px-3"
          disabled={!canUndo}
          title="Undo (Cmd/Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4 shrink-0" />
          <span className="hidden hd:inline">Undo</span>
        </Button>
        <Button
          onClick={onRedo}
          size="sm"
          variant="ghost"
          className="gap-1 px-2 hd:px-3"
          disabled={!canRedo}
          title="Redo (Cmd/Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4 shrink-0" />
          <span className="hidden hd:inline">Redo</span>
        </Button>
      </div>
      <Button
        onClick={onOpenTutorial}
        size="sm"
        variant="ghost"
        className="gap-1 px-2 hd:px-3"
        title="Tutorial"
      >
        <BookOpen className="h-4 w-4 shrink-0" />
        <span className="hidden hd:inline">Tutorial</span>
      </Button>
      <Button
        onClick={onShare}
        size="sm"
        variant="ghost"
        className="gap-1.5 px-2 hd:px-3"
        disabled={!canShare}
        title="Share"
      >
        <Share2 className="h-4 w-4 shrink-0" />
        <span className="hidden hd:inline">Share</span>
      </Button>
      {canShare ? (
        <Button asChild className="gap-1.5 px-3 hd:px-4 font-semibold" title="Visualize">
          <Link to="/visualize">
            <span className="hidden hd:inline">Visualize</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      ) : (
        <Button
          disabled
          className="gap-1.5 px-3 hd:px-4 font-semibold"
          title="Visualize"
        >
          <span className="hidden hd:inline">Visualize</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>
      )}
    </>
  );
};
