/**
 * Enhanced Code Editor with Dev-Friendly Features
 * 
 * Features:
 * - Autocomplete for Ohm.js grammar
 * - Syntax highlighting
 * - Error diagnostics
 * - Code folding for rules
 */

import React, { useState, useRef, useMemo } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { ohmGrammar } from '@/lib/ohmGrammarLanguage';
import { foldAll, unfoldAll } from '@codemirror/language';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { darkTheme, lightTheme } from '@/lib/editorTheme';

interface EnhancedCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}

export const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = 'Enter your Ohm.js grammar here...',
}) => {
  const [focused, setFocused] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const isDark = useIsDarkMode();

  const extensions = useMemo(() => [ohmGrammar()], []);

  const handleFoldAll = () => {
    const view = editorRef.current?.view;
    if (view) {
      foldAll(view);
    }
  };

  const handleUnfoldAll = () => {
    const view = editorRef.current?.view;
    if (view) {
      unfoldAll(view);
    }
  };

  return (
    <div className="flex flex-col min-h-0 gap-2">
      <div className="flex gap-2 items-center flex-none">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFoldAll}
          className="gap-1"
          title="Collapse all rules (Ctrl+Shift+[)"
        >
          <ChevronRight className="w-4 h-4" />
          Collapse All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnfoldAll}
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

      <div className={`rounded-md border-2 overflow-hidden transition-colors ${
        focused ? 'border-primary shadow-md' : 'border-input'
      }`}>
        <CodeMirror
          ref={editorRef}
          value={value}
          height="auto"
          maxHeight="calc(100vh - 280px)"
          theme={isDark ? darkTheme : lightTheme}
          extensions={extensions}
          onChange={onChange}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    </div>
  );
};

