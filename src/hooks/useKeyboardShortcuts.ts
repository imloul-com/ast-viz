import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onSearch?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
}

/**
 * Custom hook for keyboard shortcuts in the grammar builder
 * Handles common operations like duplicate, delete, select all, etc.
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ignore shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd/Ctrl+A in input fields, but not our custom handler
        if (cmdOrCtrl && e.key === 'a') {
          return; // Let browser handle select all in input
        }
        // Allow Cmd/Ctrl+F for search even in inputs
        if (cmdOrCtrl && e.key === 'f') {
          if (handlers.onSearch) {
            e.preventDefault();
            handlers.onSearch();
          }
        }
        return;
      }

      // Cmd/Ctrl + D - Duplicate
      if (cmdOrCtrl && e.key === 'd' && handlers.onDuplicate) {
        e.preventDefault();
        handlers.onDuplicate();
      }

      // Delete/Backspace - Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && handlers.onDelete) {
        e.preventDefault();
        handlers.onDelete();
      }

      // Cmd/Ctrl + A - Select all
      if (cmdOrCtrl && e.key === 'a' && handlers.onSelectAll) {
        e.preventDefault();
        handlers.onSelectAll();
      }

      // Escape - Clear selection
      if (e.key === 'Escape' && handlers.onClearSelection) {
        e.preventDefault();
        handlers.onClearSelection();
      }

      // Cmd/Ctrl + F - Focus search
      if (cmdOrCtrl && e.key === 'f' && handlers.onSearch) {
        e.preventDefault();
        handlers.onSearch();
      }

      // Cmd/Ctrl + Z - Undo
      if (cmdOrCtrl && !e.shiftKey && e.key === 'z' && handlers.onUndo) {
        e.preventDefault();
        handlers.onUndo();
      }

      // Cmd/Ctrl + Shift + Z - Redo
      if (cmdOrCtrl && e.shiftKey && e.key === 'z' && handlers.onRedo) {
        e.preventDefault();
        handlers.onRedo();
      }

      // Cmd/Ctrl + C - Copy
      if (cmdOrCtrl && e.key === 'c' && handlers.onCopy) {
        e.preventDefault();
        handlers.onCopy();
      }

      // Cmd/Ctrl + V - Paste
      if (cmdOrCtrl && e.key === 'v' && handlers.onPaste) {
        e.preventDefault();
        handlers.onPaste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, enabled]);
}

