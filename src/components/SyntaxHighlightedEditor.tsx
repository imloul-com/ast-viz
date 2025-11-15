import React, { useMemo } from 'react';
import type { ASTNode } from '@/types/ast';

interface SyntaxHighlightedEditorProps {
  value: string;
  ast: ASTNode | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  selectedInterval?: { startIdx: number; endIdx: number } | null;
  colorScheme?: ColorScheme;
}

interface HighlightRange {
  start: number;
  end: number;
  ruleName: string;
  color: string;
}

interface ColorScheme {
  lexicalRule: string;      // Lowercase rules (tokens)
  syntacticRule: string;    // Uppercase rules (structure)
  literal: string;          // Terminal literals
  punctuation: string;      // Single-char punctuation
  default: string;          // Default fallback
}

// Default color scheme - grammar-agnostic
const DEFAULT_COLOR_SCHEME: ColorScheme = {
  lexicalRule: '#10b981',    // Green for lexical tokens
  syntacticRule: '#3b82f6',  // Blue for syntactic rules
  literal: '#f97316',        // Orange for literals
  punctuation: '#94a3b8',    // Slate for punctuation
  default: '#9ca3af',        // Gray for everything else
};

/**
 * Grammar-agnostic color mapping based on Ohm.js conventions and AST structure.
 * Uses structural analysis instead of pattern matching on rule names.
 * 
 * Ohm.js conventions:
 * - Lowercase rules = lexical (tokens like 'identifier', 'number', 'string')
 * - Uppercase rules = syntactic (structure like 'Expression', 'Statement')
 * - Terminals = actual matched text
 */
const getRuleColor = (
  node: ASTNode,
  colorScheme: ColorScheme,
  depth: number = 0
): string => {
  // Validate input
  if (!node || typeof node !== 'object' || !node.name) {
    return colorScheme.default;
  }

  const ruleName = node.name;
  const isLeaf = !node.children || node.children.length === 0;
  
  // Handle terminal nodes specially
  if (node.name === '_terminal' || isLeaf) {
    // If we have a literal value, check if it's punctuation
    if (node.value) {
      const value = node.value.trim();
      // Single character punctuation/operators
      if (value.length === 1 && /[^\w\s]/.test(value)) {
        return colorScheme.punctuation;
      }
      return colorScheme.literal;
    }
    return colorScheme.default;
  }
  
  // Use Ohm.js naming convention: lowercase = lexical, uppercase = syntactic
  const firstChar = ruleName.charAt(0);
  
  if (/[a-z]/.test(firstChar)) {
    // Lowercase rule = lexical token (identifier, number, string, keyword, etc.)
    return colorScheme.lexicalRule;
  } else if (/[A-Z]/.test(firstChar)) {
    // Uppercase rule = syntactic structure (Expression, Statement, etc.)
    return colorScheme.syntacticRule;
  }
  
  // Fallback for any unusual rule names
  return colorScheme.default;
};

/**
 * Determines if a node should be highlighted as a complete semantic unit.
 * Uses AST structure instead of string matching on names.
 * 
 * A node is semantic if:
 * 1. It's a lexical rule (lowercase in Ohm.js) AND
 * 2. It has children (meaning it matched something complex, not just a terminal)
 * 
 * This prevents highlighting individual characters within tokens.
 */
const isSemanticToken = (node: ASTNode): boolean => {
  if (!node || !node.name) {
    return false;
  }
  
  // Check if it's a lexical rule (starts with lowercase)
  const isLexical = /^[a-z]/.test(node.name);
  
  // Check if it has children (it's not just a raw terminal)
  const hasChildren = node.children && node.children.length > 0;
  
  // Lexical rules with children should be treated as complete tokens
  // (e.g., 'identifier', 'number', 'string')
  return isLexical && hasChildren;
};

/**
 * Extract highlight ranges from AST with comprehensive validation.
 * This is the core highlighting logic that walks the AST tree.
 */
const extractHighlights = (
  node: ASTNode,
  colorScheme: ColorScheme,
  ranges: HighlightRange[] = [],
  depth: number = 0,
  textLength: number = Infinity
): HighlightRange[] => {
  // Validate node
  if (!node || typeof node !== 'object') {
    console.warn('[SyntaxHighlighter] Invalid node encountered:', node);
    return ranges;
  }
  
  // If no interval, skip this node but recurse into children
  if (!node.interval) {
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach(child => 
        extractHighlights(child, colorScheme, ranges, depth + 1, textLength)
      );
    }
    return ranges;
  }
  
  const { startIdx, endIdx } = node.interval;
  
  // Validate interval indices
  if (typeof startIdx !== 'number' || typeof endIdx !== 'number') {
    console.warn('[SyntaxHighlighter] Invalid interval indices:', node.interval, 'for node:', node.name);
    return ranges;
  }
  
  // Validate interval bounds
  if (startIdx < 0 || endIdx < startIdx) {
    console.warn('[SyntaxHighlighter] Invalid interval range:', startIdx, '-', endIdx, 'for node:', node.name);
    return ranges;
  }
  
  // Validate against text length
  if (endIdx > textLength) {
    console.warn('[SyntaxHighlighter] Interval exceeds text length:', endIdx, '>', textLength, 'for node:', node.name);
    // Don't return - just clamp it
  }
  
  // Skip empty ranges
  if (startIdx === endIdx) {
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach(child => 
        extractHighlights(child, colorScheme, ranges, depth + 1, textLength)
      );
    }
    return ranges;
  }
  
  // If this is a semantic token (lexical rule with children), highlight it as a whole unit
  if (isSemanticToken(node)) {
    ranges.push({
      start: Math.max(0, startIdx),
      end: Math.min(endIdx, textLength),
      ruleName: node.name,
      color: getRuleColor(node, colorScheme, depth),
    });
    return ranges; // Don't recurse into children for semantic tokens
  }
  
  // If this is a leaf node, highlight it
  if (!node.children || node.children.length === 0) {
    ranges.push({
      start: Math.max(0, startIdx),
      end: Math.min(endIdx, textLength),
      ruleName: node.name || '_unknown',
      color: getRuleColor(node, colorScheme, depth),
    });
    return ranges;
  }
  
  // For non-semantic parent nodes, recurse into children
  if (Array.isArray(node.children)) {
    node.children.forEach(child => 
      extractHighlights(child, colorScheme, ranges, depth + 1, textLength)
    );
  }
  
  return ranges;
};

/**
 * Merge overlapping ranges - optimized version.
 * Strategy: Keep smaller/more specific ranges when they overlap with larger ranges.
 * Complexity: O(n log n) due to sorting, then O(n) for linear scan.
 */
const mergeRanges = (ranges: HighlightRange[]): HighlightRange[] => {
  if (ranges.length === 0) return [];
  
  // Sort by start position, then by length (shorter first for priority)
  const sorted = [...ranges].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (a.end - a.start) - (b.end - b.start);
  });
  
  const merged: HighlightRange[] = [];
  
  for (const range of sorted) {
    // Check if this range overlaps with any already-merged range
    const hasOverlap = merged.some(existing => 
      !(range.end <= existing.start || range.start >= existing.end)
    );
    
    if (!hasOverlap) {
      merged.push(range);
    }
    // If there's overlap, skip this range (we keep the smaller one that was added first)
  }
  
  // Final sort by start position
  return merged.sort((a, b) => a.start - b.start);
};

// Convert text and ranges to highlighted HTML
const createHighlightedContent = (text: string, ranges: HighlightRange[]): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  ranges.forEach((range, idx) => {
    // Add unhighlighted text before this range
    if (range.start > lastIndex) {
      result.push(
        <span key={`text-${idx}`} className="text-foreground/90">
          {text.substring(lastIndex, range.start)}
        </span>
      );
    }
    
    // Add highlighted range
    result.push(
      <span
        key={`highlight-${idx}`}
        style={{ color: range.color }}
        className="font-medium"
        title={range.ruleName}
      >
        {text.substring(range.start, range.end)}
      </span>
    );
    
    lastIndex = range.end;
  });
  
  // Add remaining unhighlighted text
  if (lastIndex < text.length) {
    result.push(
      <span key="text-end" className="text-foreground/90">
        {text.substring(lastIndex)}
      </span>
    );
  }
  
  return result;
};

export const SyntaxHighlightedEditor: React.FC<SyntaxHighlightedEditorProps> = ({
  value,
  ast,
  onChange,
  placeholder,
  className = '',
  onFocus,
  onBlur,
  selectedInterval,
  colorScheme = DEFAULT_COLOR_SCHEME,
}) => {
  // Extract and merge highlight ranges from AST
  const highlightedContent = useMemo(() => {
    if (!ast || !value) {
      return null;
    }
    
    try {
      const ranges = extractHighlights(ast, colorScheme, [], 0, value.length);
      const merged = mergeRanges(ranges);
      return createHighlightedContent(value, merged);
    } catch (error) {
      console.error('[SyntaxHighlighter] Error during highlighting:', error);
      return null; // Gracefully degrade to no highlighting
    }
  }, [ast, value, colorScheme]);
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Highlighted overlay */}
      {highlightedContent && (
        <div
          className="absolute inset-0 pointer-events-none overflow-auto font-mono text-sm whitespace-pre-wrap break-words px-3 py-2"
          style={{
            lineHeight: '1.5',
          }}
        >
          {highlightedContent}
        </div>
      )}
      
      {/* Selected interval highlight */}
      {selectedInterval && (
        <div
          className="absolute inset-0 pointer-events-none overflow-auto font-mono text-sm whitespace-pre-wrap break-words pl-3 pr-3 py-2"
          style={{
            lineHeight: '1.5',
            paddingLeft: '0.75rem',
          }}
        >
          <span style={{ color: 'transparent' }}>
            {value.substring(0, selectedInterval.startIdx)}
          </span>
          <mark
            className="text-transparent"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.6)',
              borderRadius: '2px',
              padding: 0,
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
          >
            {value.substring(selectedInterval.startIdx, selectedInterval.endIdx)}
          </mark>
        </div>
      )}
      
      {/* Actual textarea (transparent text when highlighted) */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`
          w-full h-full font-mono text-sm resize-none bg-transparent px-3 py-2
          ${highlightedContent ? 'text-transparent caret-blue-500' : 'text-foreground'}
        `}
        style={{
          lineHeight: '1.5',
        }}
        spellCheck={false}
      />
    </div>
  );
};

