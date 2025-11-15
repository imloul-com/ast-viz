import React, { useState, useEffect, useRef } from 'react';
import { useGrammar } from '@/context/GrammarContext';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

/**
 * Code Editor Page
 * 
 * This is the "trivial adapter" in our adapter pattern architecture.
 * It reads/writes Ohm.js grammar text directly to/from context with no transformation.
 * 
 * The grammar string in context is the single source of truth.
 */
const GrammarCodeEditorPage: React.FC = () => {
  const { grammar, setGrammar } = useGrammar();
  const [grammarFocused, setGrammarFocused] = useState(false);
  const previousGrammarRef = useRef(grammar);

  console.log('[CodeEditorPage] Rendering with grammar length:', grammar.length);
  console.log('[CodeEditorPage] First 50 chars:', grammar.substring(0, 50));

  // Track grammar changes
  useEffect(() => {
    if (previousGrammarRef.current !== grammar) {
      console.log('[CodeEditorPage] Grammar changed!');
      console.log('  Previous length:', previousGrammarRef.current.length);
      console.log('  New length:', grammar.length);
      console.log('  Previous:', previousGrammarRef.current.substring(0, 50));
      console.log('  New:', grammar.substring(0, 50));
      previousGrammarRef.current = grammar;
    }
  }, [grammar]);

  return (
    <div className="mt-3">
      <div className={`rounded-md border-2 overflow-hidden transition-colors ${
        grammarFocused ? 'border-primary' : 'border-input'
      }`}>
        <CodeMirror
          value={grammar}
          height="400px"
          extensions={[javascript()]}
          onChange={(value) => setGrammar(value)}
          onFocus={() => setGrammarFocused(true)}
          onBlur={() => setGrammarFocused(false)}
          placeholder="Enter your Ohm.js grammar here..."
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

export default GrammarCodeEditorPage;

