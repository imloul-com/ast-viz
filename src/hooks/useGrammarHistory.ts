import { useState, useCallback, useRef } from 'react';

interface HistoryEntry {
  grammar: string;
  timestamp: number;
  description?: string;
}

interface GrammarHistoryHook {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => string | null;
  redo: () => string | null;
  pushHistory: (grammar: string, description?: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 50;

/**
 * Hook for managing grammar history with undo/redo functionality
 */
export function useGrammarHistory(initialGrammar: string = ''): GrammarHistoryHook {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { grammar: initialGrammar, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Debounce timer ref to avoid creating too many history entries
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushHistory = useCallback((grammar: string, description?: string) => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce rapid changes (auto-saves while typing)
    debounceTimerRef.current = setTimeout(() => {
      setHistory(prev => {
        const current = prev[currentIndex];
        
        // Don't add if grammar hasn't changed
        if (current && current.grammar === grammar) {
          return prev;
        }

        // Remove any "future" history if we're not at the end
        const newHistory = prev.slice(0, currentIndex + 1);
        
        // Add new entry
        newHistory.push({
          grammar,
          timestamp: Date.now(),
          description,
        });

        // Keep history size under limit
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
          setCurrentIndex(newHistory.length - 1);
          return newHistory;
        }

        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      });
    }, 500); // 500ms debounce
  }, [currentIndex]);

  const undo = useCallback((): string | null => {
    if (!canUndo) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex].grammar;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback((): string | null => {
    if (!canRedo) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex].grammar;
  }, [canRedo, currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(0);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    clearHistory,
  };
}

