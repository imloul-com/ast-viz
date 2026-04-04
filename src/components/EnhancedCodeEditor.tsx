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
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { darkTheme, lightTheme } from '@/lib/editorTheme';
import { CodeEditorToolbar } from '@/components/CodeEditorToolbar';

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
      <CodeEditorToolbar onFoldAll={handleFoldAll} onUnfoldAll={handleUnfoldAll} />

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

