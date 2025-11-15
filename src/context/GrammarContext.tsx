import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ASTNode, TreeNode, GrammarExample } from '@/types/ast';
import { parseWithGrammar } from '@/lib/parser';
import { optimizeTree, astToTree } from '@/lib/treeOptimizer';
import { decodeStateFromUrl, clearShareUrl } from '@/lib/shareUtils';
import { useGrammarHistory } from '@/hooks/useGrammarHistory';

interface GrammarContextType {
  grammar: string;
  programText: string;
  ast: ASTNode | null;
  tree: TreeNode | null;
  error: string | null;
  optimizeEnabled: boolean;
  collapsedRules: Set<string>;
  fullNodeCount: number;
  optimizedNodeCount: number;
  canUndo: boolean;
  canRedo: boolean;
  setGrammar: (value: string) => void;
  setProgramText: (value: string) => void;
  setOptimizeEnabled: (value: boolean) => void;
  toggleRuleCollapsed: (ruleId: string) => void;
  parseGrammar: () => boolean;
  loadExample: (example: GrammarExample) => void;
  undo: () => void;
  redo: () => void;
}

const GrammarContext = createContext<GrammarContextType | undefined>(undefined);

// Helper function to count nodes in a tree
const countTreeNodes = (tree: TreeNode | null): number => {
  if (!tree) return 0;
  let count = 1;
  if (tree.children) {
    for (const child of tree.children) {
      count += countTreeNodes(child);
    }
  }
  return count;
};

export const GrammarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Check for shared state in URL on initialization
  const sharedState = decodeStateFromUrl();
  
  const [grammar, setGrammarInternal] = useState(sharedState?.grammar || '');
  const [programText, setProgramText] = useState(sharedState?.programText || '');
  const [ast, setAst] = useState<ASTNode | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizeEnabled, setOptimizeEnabled] = useState(true);
  const [collapsedRules, setCollapsedRules] = useState<Set<string>>(new Set());
  const [fullNodeCount, setFullNodeCount] = useState(0);
  const [optimizedNodeCount, setOptimizedNodeCount] = useState(0);
  
  // Grammar history for undo/redo
  const { canUndo, canRedo, undo: undoHistory, redo: redoHistory, pushHistory } = useGrammarHistory(grammar);
  
  // Clear the URL after loading shared state to prevent confusion
  useEffect(() => {
    if (sharedState) {
      console.log('[GrammarContext] Loaded shared state from URL');
      clearShareUrl();
    }
  }, []);

  // Wrapped setGrammar with logging and history tracking
  const setGrammar = useCallback((newGrammar: string, skipHistory = false) => {
    console.log('[GrammarContext] setGrammar called');
    console.log('  New grammar length:', newGrammar.length);
    console.log('  First 50 chars:', newGrammar.substring(0, 50));
    setGrammarInternal(newGrammar);
    
    // Push to history (will be debounced internally)
    if (!skipHistory) {
      pushHistory(newGrammar);
    }
  }, [pushHistory]);

  // Undo grammar change
  const undo = useCallback(() => {
    const previousGrammar = undoHistory();
    if (previousGrammar !== null) {
      setGrammarInternal(previousGrammar);
      console.log('✓ Undo successful');
    }
  }, [undoHistory]);

  // Redo grammar change
  const redo = useCallback(() => {
    const nextGrammar = redoHistory();
    if (nextGrammar !== null) {
      setGrammarInternal(nextGrammar);
      console.log('✓ Redo successful');
    }
  }, [redoHistory]);

  // Re-generate tree when optimization setting changes
  // SINGLE SOURCE OF TRUTH: Only generate trees here, not in components
  useEffect(() => {
    if (ast) {
      const treeData = optimizeEnabled ? optimizeTree(ast) : astToTree(ast);
      setTree(treeData);
    }
  }, [optimizeEnabled, ast]);

  const parseGrammar = useCallback((): boolean => {
    setError(null);
    
    if (!grammar.trim()) {
      setError('Please enter a grammar');
      return false;
    }

    if (!programText.trim()) {
      setError('Please enter text to parse');
      return false;
    }

    const result = parseWithGrammar(grammar, programText);

    if (result.success && result.ast) {
      // Generate both trees ONCE for node counting
      const fullTree = astToTree(result.ast);
      const optimizedTree = optimizeTree(result.ast);
      
      // Calculate node counts
      setFullNodeCount(countTreeNodes(fullTree));
      setOptimizedNodeCount(countTreeNodes(optimizedTree));
      
      // Store AST (will trigger tree regeneration via useEffect)
      setAst(result.ast);
      
      // Set the appropriate tree based on current optimization setting
      const treeData = optimizeEnabled ? optimizedTree : fullTree;
      setTree(treeData);
      setError(null);
      return true;
    } else {
      setError(result.error || 'Failed to parse');
      // Keep the last valid AST and tree instead of clearing them
      return false;
    }
  }, [grammar, programText, optimizeEnabled]);

  const loadExample = useCallback((example: GrammarExample) => {
    setGrammar(example.grammar);
    setProgramText(example.sampleInput);
    setError(null);
    
    // Clear collapsed rules when loading a new example (different rule set)
    setCollapsedRules(new Set());
    
    // Auto-parse the example
    setTimeout(() => {
      const result = parseWithGrammar(example.grammar, example.sampleInput);
      if (result.success && result.ast) {
        // Generate both trees ONCE for node counting
        const fullTree = astToTree(result.ast);
        const optimizedTree = optimizeTree(result.ast);
        
        // Calculate node counts
        setFullNodeCount(countTreeNodes(fullTree));
        setOptimizedNodeCount(countTreeNodes(optimizedTree));
        
        // Store AST (will trigger tree regeneration via useEffect)
        setAst(result.ast);
        
        // Set the appropriate tree based on current optimization setting
        const treeData = optimizeEnabled ? optimizedTree : fullTree;
        setTree(treeData);
        setError(null);
      } else {
        setError(result.error || 'Failed to parse example');
        // Keep any existing AST/tree
      }
    }, 100);
  }, [optimizeEnabled]);

  const toggleRuleCollapsed = useCallback((ruleId: string) => {
    setCollapsedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  }, []);

  const value: GrammarContextType = {
    grammar,
    programText,
    ast,
    tree,
    error,
    optimizeEnabled,
    collapsedRules,
    fullNodeCount,
    optimizedNodeCount,
    canUndo,
    canRedo,
    setGrammar,
    setProgramText,
    setOptimizeEnabled,
    toggleRuleCollapsed,
    parseGrammar,
    loadExample,
    undo,
    redo,
  };

  return (
    <GrammarContext.Provider value={value}>
      {children}
    </GrammarContext.Provider>
  );
};

export const useGrammar = (): GrammarContextType => {
  const context = useContext(GrammarContext);
  if (!context) {
    throw new Error('useGrammar must be used within a GrammarProvider');
  }
  return context;
};

