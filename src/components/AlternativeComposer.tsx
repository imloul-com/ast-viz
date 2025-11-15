import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { RuleChip, type ChipType } from './RuleChip';
import { ListOfWrapper } from './ListOfWrapper';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SequenceElement {
  id: string;
  value: string;
  type: ChipType;
  // For listOf wrapper type - contains nested elements
  wrappedElement?: SequenceElement;  // The item being listed
  separator?: SequenceElement;        // The separator token
  isNonempty?: boolean;               // true for nonemptyListOf, false for listOf
}

interface AlternativeComposerProps {
  value: string;
  onChange: (value: string) => void;
  availableRules: Array<{ name: string; description?: string }>;
  onCreateRule?: (suggestedName: string) => void;
}

export const AlternativeComposer: React.FC<AlternativeComposerProps> = ({
  value,
  onChange,
  availableRules,
  onCreateRule,
}) => {
  const [elements, setElements] = useState<SequenceElement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState(0);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Parse value into elements on mount and when value changes externally
  useEffect(() => {
    const currentValue = elementsToValue(elements);
    // Only parse if value differs from current elements
    if (value && value !== currentValue) {
      const parsed = parseValueToElements(value);
      setElements(parsed);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse string value into sequence elements
  const parseValueToElements = (val: string): SequenceElement[] => {
    if (!val.trim()) return [];

    // Pre-process: temporarily replace <OR> with a special marker
    const OR_MARKER = '__OR_TOKEN__';
    const preprocessed = val.replace(/<OR>/g, OR_MARKER);

    const tokens: SequenceElement[] = [];
    let currentToken = '';
    let inQuotes = false;
    let parenDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;
    let escapeNext = false;

    for (let i = 0; i < preprocessed.length; i++) {
      const char = preprocessed[i];

      if (escapeNext) {
        currentToken += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        currentToken += char;
        escapeNext = true;
        continue;
      }

      // Track parentheses depth (before quote handling)
      if (!inQuotes && char === '(') {
        parenDepth++;
        currentToken += char;
        continue;
      }

      if (!inQuotes && char === ')') {
        parenDepth--;
        currentToken += char;
        continue;
      }

      // Track brackets depth (before quote handling)
      if (!inQuotes && char === '[') {
        bracketDepth++;
        currentToken += char;
        continue;
      }

      if (!inQuotes && char === ']') {
        bracketDepth--;
        currentToken += char;
        continue;
      }

      // Track angle brackets depth (for parameterized rules like listOf<T, S>)
      if (!inQuotes && char === '<') {
        angleDepth++;
        currentToken += char;
        continue;
      }

      if (!inQuotes && char === '>') {
        angleDepth--;
        currentToken += char;
        continue;
      }

      // Handle quotes
      if (char === '"') {
        currentToken += char;
        if (inQuotes) {
          // End of string literal
          // Only push as separate token if we're not inside parentheses, brackets, or angles
          if (parenDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
            tokens.push({
              id: `token-${tokens.length}-${Date.now()}`,
              value: currentToken,
              type: 'literal',
            });
            currentToken = '';
          }
          // Otherwise, keep it as part of the current token
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (inQuotes) {
        currentToken += char;
        continue;
      }

      // Outside quotes, parentheses, brackets, and angles - split on whitespace
      if ((char === ' ' || char === '\t') && parenDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
        if (currentToken) {
          // Check if this is an OR marker
          if (currentToken === OR_MARKER) {
            tokens.push({
              id: `token-${tokens.length}-${Date.now()}`,
              value: 'OR',
              type: 'or',
            });
          } else {
            tokens.push({
              id: `token-${tokens.length}-${Date.now()}`,
              value: currentToken,
              type: getTokenType(currentToken, availableRules.map(r => r.name)),
            });
          }
          currentToken = '';
        }
        continue;
      }

      currentToken += char;
    }

    // Add remaining token
    if (currentToken) {
      // Check if this is an OR marker
      if (currentToken === OR_MARKER) {
        tokens.push({
          id: `token-${tokens.length}-${Date.now()}`,
          value: 'OR',
          type: 'or',
        });
      } else {
        tokens.push({
          id: `token-${tokens.length}-${Date.now()}`,
          value: currentToken,
          type: getTokenType(currentToken, availableRules.map(r => r.name)),
        });
      }
    }

    // Post-process: convert listOf patterns to wrapper structures
    return tokens.map(token => {
      if (token.type === 'listof') {
        return parseListOfToWrapper(token);
      }
      return token;
    });
  };

  // Parse listOf<Element, Separator> into wrapper structure
  const parseListOfToWrapper = (token: SequenceElement): SequenceElement => {
    // Use non-greedy match to stop at first comma (not last)
    const match = token.value.match(/^(nonempty)?[Ll]istOf<(.+?),\s*(.+)>$/);
    if (!match) return token;

    const isNonempty = !!match[1];
    const elementValue = match[2].trim();
    const separatorValue = match[3].trim();

    const wrappedElement: SequenceElement = {
      id: `wrapped-${Date.now()}-${Math.random()}`,
      value: elementValue,
      type: getTokenType(elementValue, availableRules.map(r => r.name)),
    };

    const separator: SequenceElement = {
      id: `sep-${Date.now()}-${Math.random()}`,
      value: separatorValue,
      type: getTokenType(separatorValue, availableRules.map(r => r.name)),
    };

    return {
      id: token.id,
      value: token.value,
      type: 'listof',
      wrappedElement,
      separator,
      isNonempty,
    };
  };

  // Check if a string has unclosed quotes, parentheses, brackets, or angle brackets
  const hasUnclosedDelimiters = (str: string): boolean => {
    let inQuotes = false;
    let parenDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;
    let escapeNext = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth--;
        if (char === '<') angleDepth++;
        if (char === '>') angleDepth--;
      }
    }

    return inQuotes || parenDepth !== 0 || bracketDepth !== 0 || angleDepth !== 0;
  };

  // Determine token type
  const getTokenType = (token: string, ruleNames: string[]): ChipType => {
    if (token.startsWith('"') && token.endsWith('"')) return 'literal';
    if (token.match(/^[+*?&~]$/) || token === '|') return 'operator';
    // Check for listOf patterns: listOf<something, separator> or nonemptyListOf<something, separator>
    if (token.match(/^(nonempty)?[Ll]istOf<.+,.+>$/)) return 'listof';
    if (ruleNames.includes(token)) return 'rule';
    // Ohm.js built-in rules (with optional quantifiers +, *, ?)
    if (token.match(/^(any|digit|letter|alnum|space|lower|upper|hexDigit|end)[+*?]?$/)) return 'builtin';
    return 'pattern';
  };

  // Convert elements back to string value
  const elementsToValue = (elems: SequenceElement[]): string => {
    return elems.map(e => {
      if (e.type === 'or') return '<OR>';
      if (e.type === 'listof' && e.wrappedElement && e.separator) {
        const variant = e.isNonempty ? 'nonemptyListOf' : 'listOf';
        return `${variant}<${e.wrappedElement.value}, ${e.separator.value}>`;
      }
      return e.value;
    }).join(' ');
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex(e => e.id === active.id);
      const newIndex = elements.findIndex(e => e.id === over.id);

      const newElements = arrayMove(elements, oldIndex, newIndex);
      setElements(newElements);
      onChange(elementsToValue(newElements));
    }
  };

  // Add element
  const addElement = (value: string, type: ChipType) => {
    const newElement: SequenceElement = {
      id: `elem-${Date.now()}-${Math.random()}`,
      value,
      type,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    onChange(elementsToValue(newElements));
  };

  // Remove element
  const removeElement = (id: string) => {
    const newElements = elements.filter(e => e.id !== id);
    setElements(newElements);
    onChange(elementsToValue(newElements));
  };
  
  // Wrap element with listOf
  const wrapWithListOf = (id: string, variant: 'listOf' | 'nonemptyListOf' = 'listOf') => {
    const element = elements.find(e => e.id === id);
    if (!element) return;
    
    // Create nested structure with wrapped element and default separator
    const wrappedElement: SequenceElement = {
      id: `wrapped-${Date.now()}-${Math.random()}`,
      value: element.value,
      type: element.type,
    };
    
    const separator: SequenceElement = {
      id: `sep-${Date.now()}-${Math.random()}`,
      value: '","',
      type: 'literal',
    };
    
    const newElements = elements.map(e =>
      e.id === id ? {
        id: e.id,
        value: `${variant}<${element.value}, ",">`, // For display
        type: 'listof' as ChipType,
        wrappedElement,
        separator,
        isNonempty: variant === 'nonemptyListOf',
      } : e
    );
    setElements(newElements);
    onChange(elementsToValue(newElements));
  };

  // Start editing element inline
  const startEditing = (id: string) => {
    const element = elements.find(e => e.id === id);
    if (element) {
      setEditingId(id);
      setEditingValue(element.value);
      setShowSuggestions(false);
      setTimeout(() => editInputRef.current?.focus(), 0);
    }
  };

  // Save edited element
  const saveEdit = () => {
    if (!editingId || !editingValue.trim()) {
      cancelEdit();
      return;
    }

    const trimmedValue = editingValue.trim();
    
    // Don't save if it has unclosed delimiters
    if (hasUnclosedDelimiters(trimmedValue)) {
      return;
    }

    const type = getTokenType(trimmedValue, availableRules.map(r => r.name));
    const newElements = elements.map(e =>
      e.id === editingId ? { ...e, value: trimmedValue, type } : e
    );
    setElements(newElements);
    onChange(elementsToValue(newElements));
    setEditingId(null);
    setEditingValue('');
    setShowSuggestions(false);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
    setShowSuggestions(false);
    setIsAddingNew(false);
  };

  // Start adding new token inline
  const startAddingNew = () => {
    setIsAddingNew(true);
    setEditingValue('');
    setShowSuggestions(false);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  // Add new element
  const addNewElement = () => {
    if (!editingValue.trim()) {
      setIsAddingNew(false);
      return;
    }

    const trimmedValue = editingValue.trim();
    
    // Don't add if it has unclosed delimiters
    if (hasUnclosedDelimiters(trimmedValue)) {
      return;
    }

    if (showSuggestions && filteredSuggestions.length > 0) {
      const suggestion = filteredSuggestions[focusedSuggestion];
      if (suggestion.type === 'create') {
        onCreateRule?.(trimmedValue);
      } else {
        addElement(suggestion.value, suggestion.elementType);
      }
    } else {
      const type = getTokenType(trimmedValue, availableRules.map(r => r.name));
      addElement(trimmedValue, type);
    }
    
    setEditingValue('');
    setShowSuggestions(false);
    setIsAddingNew(false);
  };

  // Handle inline input change
  const handleInlineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingValue(val);
    setShowSuggestions(val.length > 0);
    setFocusedSuggestion(0);
  };

  // Handle inline input key down
  const handleInlineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isAddingNew) {
        addNewElement();
      } else if (editingId) {
        saveEdit();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setFocusedSuggestion(prev => 
        Math.min(prev + 1, filteredSuggestions.length - 1)
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setFocusedSuggestion(prev => Math.max(prev - 1, 0));
    }
  };

  // Filter suggestions
  const filteredSuggestions = React.useMemo(() => {
    if (!editingValue) return [];

    const suggestions: Array<{
      value: string;
      label: string;
      description: string;
      elementType: ChipType;
      type: 'rule' | 'pattern' | 'builtin' | 'create';
    }> = [];

    const query = editingValue.toLowerCase();

    // Match rules
    availableRules.forEach(rule => {
      if (rule.name.toLowerCase().includes(query)) {
        suggestions.push({
          value: rule.name,
          label: rule.name,
          description: rule.description || 'Rule',
          elementType: 'rule',
          type: 'rule',
        });
      }
    });

    // Ohm.js built-in rules and special tokens
    const builtinRules = [
      { value: 'any', desc: 'Any single character', elementType: 'builtin' as ChipType },
      { value: 'digit', desc: 'Single digit (0-9)', elementType: 'builtin' as ChipType },
      { value: 'digit+', desc: 'One or more digits', elementType: 'builtin' as ChipType },
      { value: 'letter', desc: 'Single letter (a-z, A-Z)', elementType: 'builtin' as ChipType },
      { value: 'letter+', desc: 'One or more letters', elementType: 'builtin' as ChipType },
      { value: 'alnum+', desc: 'Alphanumeric characters', elementType: 'builtin' as ChipType },
      { value: 'space', desc: 'Single whitespace', elementType: 'builtin' as ChipType },
      { value: 'space*', desc: 'Optional whitespace', elementType: 'builtin' as ChipType },
      { value: 'lower', desc: 'Lowercase letter', elementType: 'builtin' as ChipType },
      { value: 'upper', desc: 'Uppercase letter', elementType: 'builtin' as ChipType },
      { value: 'hexDigit', desc: 'Hex digit (0-9, a-f, A-F)', elementType: 'builtin' as ChipType },
      { value: 'end', desc: 'End of input', elementType: 'builtin' as ChipType },
      { value: 'listOf<Item, ",">',desc: 'Optional list (can be empty)', elementType: 'listof' as ChipType },
      { value: 'nonemptyListOf<Item, ",">',desc: 'Non-empty list (at least one item)', elementType: 'listof' as ChipType },
      { value: 'OR', desc: 'Visual separator between alternatives', elementType: 'or' as ChipType },
    ];

    builtinRules.forEach(builtin => {
      if (builtin.value.toLowerCase().includes(query) || builtin.desc.toLowerCase().includes(query)) {
        suggestions.push({
          value: builtin.value,
          label: builtin.value,
          description: builtin.desc,
          elementType: builtin.elementType,
          type: 'builtin',
        });
      }
    });

    // Suggest creating new rule if no exact match
    if (editingValue.match(/^[A-Z][a-zA-Z0-9]*$/) && 
        !availableRules.some(r => r.name === editingValue)) {
      suggestions.push({
        value: editingValue,
        label: `Create rule: ${editingValue}`,
        description: 'Create a new grammar rule',
        elementType: 'rule',
        type: 'create',
      });
    }

    return suggestions.slice(0, 8);
  }, [editingValue, availableRules]);

  return (
    <div className="space-y-2">
      {/* Sequence Builder */}
      <div className="min-h-[50px] p-2 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-950">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={elements.map(e => e.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2 items-center relative">
              {elements.map((element) => (
                editingId === element.id ? (
                  // Inline editing input
                  <div key={element.id} className="relative inline-flex">
                    <Input
                      ref={editInputRef}
                      value={editingValue}
                      onChange={handleInlineInputChange}
                      onKeyDown={handleInlineKeyDown}
                      onBlur={saveEdit}
                      className={`h-7 px-2 py-1 text-sm font-mono w-32 ${
                        editingValue && hasUnclosedDelimiters(editingValue)
                          ? 'border-yellow-500 focus-visible:ring-yellow-500'
                          : ''
                      }`}
                      placeholder="Edit..."
                      autoFocus
                    />
                    {/* Inline Suggestions for Editing */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 bg-background border-2 rounded-lg shadow-lg z-50 max-h-48 overflow-auto min-w-[200px]">
                        {filteredSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className={`
                              w-full text-left px-2 py-1.5 hover:bg-primary/10 transition-colors text-xs
                              ${idx === focusedSuggestion ? 'bg-primary/20' : ''}
                            `}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur
                              setEditingValue(suggestion.value);
                              setTimeout(() => saveEdit(), 0);
                            }}
                          >
                            <div className="font-mono font-semibold">
                              {suggestion.label}
                            </div>
                            <div className="text-muted-foreground">
                              {suggestion.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : element.type === 'listof' && element.wrappedElement && element.separator ? (
                  // ListOf wrapper - special rendering
                  <ListOfWrapper
                    key={element.id}
                    id={element.id}
                    wrappedElement={element.wrappedElement}
                    separator={element.separator}
                    isNonempty={element.isNonempty || false}
                    onRemove={() => removeElement(element.id)}
                    onEditWrappedElement={(newValue) => {
                      const newElements = elements.map(e =>
                        e.id === element.id && e.wrappedElement
                          ? { 
                              ...e, 
                              wrappedElement: { ...e.wrappedElement, value: newValue },
                              value: `${e.isNonempty ? 'nonemptyListOf' : 'listOf'}<${newValue}, ${e.separator?.value}>`
                            }
                          : e
                      );
                      setElements(newElements);
                      onChange(elementsToValue(newElements));
                    }}
                    onEditSeparator={(newValue) => {
                      const newElements = elements.map(e =>
                        e.id === element.id && e.separator
                          ? { 
                              ...e, 
                              separator: { ...e.separator, value: newValue },
                              value: `${e.isNonempty ? 'nonemptyListOf' : 'listOf'}<${e.wrappedElement?.value}, ${newValue}>`
                            }
                          : e
                      );
                      setElements(newElements);
                      onChange(elementsToValue(newElements));
                    }}
                    draggable
                  />
                ) : (
                  <RuleChip
                    key={element.id}
                    id={element.id}
                    value={element.value}
                    type={element.type}
                    onRemove={() => removeElement(element.id)}
                    onEdit={() => startEditing(element.id)}
                    onModifierChange={(newValue) => {
                      const newElements = elements.map(e =>
                        e.id === element.id 
                          ? { ...e, value: newValue } // Keep the same type, only update value
                          : e
                      );
                      setElements(newElements);
                      onChange(elementsToValue(newElements));
                    }}
                    onWrapWithListOf={() => wrapWithListOf(element.id)}
                    draggable
                  />
                )
              ))}

              {/* Inline Add New Token */}
              {isAddingNew ? (
                <div className="relative inline-flex">
                  <Input
                    ref={editInputRef}
                    value={editingValue}
                    onChange={handleInlineInputChange}
                    onKeyDown={handleInlineKeyDown}
                    onBlur={() => {
                      if (!editingValue.trim()) {
                        cancelEdit();
                      } else {
                        addNewElement();
                      }
                    }}
                    className={`h-7 px-2 py-1 text-sm font-mono w-32 ${
                      editingValue && hasUnclosedDelimiters(editingValue)
                        ? 'border-yellow-500 focus-visible:ring-yellow-500'
                        : ''
                    }`}
                    placeholder='Type token...'
                    autoFocus
                  />
                  {/* Inline Suggestions for Adding */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-background border-2 rounded-lg shadow-lg z-50 max-h-48 overflow-auto min-w-[200px]">
                      {filteredSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className={`
                            w-full text-left px-2 py-1.5 hover:bg-primary/10 transition-colors text-xs
                            ${idx === focusedSuggestion ? 'bg-primary/20' : ''}
                          `}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            if (suggestion.type === 'create') {
                              onCreateRule?.(suggestion.value);
                            } else {
                              addElement(suggestion.value, suggestion.elementType);
                            }
                            setEditingValue('');
                            setShowSuggestions(false);
                            setIsAddingNew(false);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {suggestion.type === 'create' && (
                              <Sparkles className="h-3 w-3 text-primary" />
                            )}
                            <div className="flex-1">
                              <div className="font-mono font-semibold">
                                {suggestion.label}
                              </div>
                              <div className="text-muted-foreground">
                                {suggestion.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startAddingNew}
                  className="h-7 px-2 text-xs border border-dashed hover:border-solid hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Token
                </Button>
              )}

              {elements.length === 0 && !isAddingNew && (
                <div className="text-sm text-muted-foreground italic">
                  👆 Click &quot;Add Token&quot; to start
                  <br />
                  <span className="text-xs">
                    Drag chips to reorder • Click chips to edit inline
                  </span>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

