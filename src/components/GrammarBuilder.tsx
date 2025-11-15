import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGrammar } from '@/context/GrammarContext';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Sparkles,
  GripVertical,
  Wand2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Copy,
  Combine,
  Search,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { AlternativeComposer } from './AlternativeComposer';
import { ruleTemplates, type RuleTemplate } from '@/data/ruleTemplates';
import { parseGrammarToRules, serializeRulesToGrammar, combineRulesAsOr, generateUniqueRuleName, type Rule, type Alternative } from '@/lib/grammarAdapter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Sortable Rule Card Component
const SortableRuleCard: React.FC<{
  rule: Rule;
  rules: Rule[];
  grammarName: string;
  onUpdate: (updates: Partial<Rule>) => void;
  onRemove: () => void;
  onCreateRule: (name: string) => void;
  onDuplicate: () => void;
  disabled: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}> = ({ rule, rules, grammarName, onUpdate, onRemove, onCreateRule, onDuplicate, disabled, isCollapsed, onToggleCollapse, selectMode, isSelected, onToggleSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: rule.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editingName, setEditingName] = React.useState(false);
  const [editingDescription, setEditingDescription] = React.useState(false);
  const [tempName, setTempName] = React.useState(rule.name);
  const [tempDescription, setTempDescription] = React.useState(rule.description || '');
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const descInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  React.useEffect(() => {
    if (editingDescription && descInputRef.current) {
      descInputRef.current.focus();
      descInputRef.current.select();
    }
  }, [editingDescription]);

  const availableRules = rules.filter(r => r.id !== rule.id);

  // Smart truncation: show alternatives until character limit is reached
  const getVisibleAlternatives = (alternatives: Alternative[], maxChars: number = 120) => {
    const result: { alternatives: Alternative[]; truncated: boolean; remainingCount: number } = {
      alternatives: [],
      truncated: false,
      remainingCount: 0,
    };

    if (alternatives.length === 0) {
      return result;
    }

    let charCount = 0;
    let lastIndex = 0;

    for (let i = 0; i < alternatives.length; i++) {
      const alt = alternatives[i];
      const value = alt.value || '∅';
      const separator = i > 0 ? ' | ' : ''; // Add separator length for subsequent alternatives
      const addedLength = separator.length + value.length;

      // Always show at least the first alternative, even if it exceeds the limit
      if (i === 0) {
        result.alternatives.push(alt);
        charCount += value.length;
        lastIndex = 0;
        
        // If first alternative is too long, truncate it
        if (charCount > maxChars) {
          result.truncated = true;
          result.remainingCount = alternatives.length - 1;
          break;
        }
      } else if (charCount + addedLength <= maxChars) {
        // Add this alternative if it fits within the limit
        result.alternatives.push(alt);
        charCount += addedLength;
        lastIndex = i;
      } else {
        // Exceeded limit, stop here
        result.truncated = true;
        result.remainingCount = alternatives.length - result.alternatives.length;
        break;
      }
    }

    // Mark as truncated if there are remaining alternatives
    if (lastIndex < alternatives.length - 1 && !result.truncated) {
      result.truncated = true;
      result.remainingCount = alternatives.length - result.alternatives.length;
    }

    return result;
  };

  const visibleAlts = getVisibleAlternatives(rule.alternatives, 120);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
        <CardHeader className="p-3">
          <div className="flex items-start gap-2">
            {/* Selection Checkbox (in select mode) */}
            {selectMode && (
              <div className="flex items-center pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelect}
                  className="h-5 w-5"
                />
              </div>
            )}
            
            {/* Drag Handle */}
            {!selectMode && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                disabled={disabled}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            )}

            {/* Rule Content */}
            <div className="flex-1 space-y-2">
              {/* Collapsed Summary View */}
              {isCollapsed && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold">{rule.name || 'Unnamed'}</span>
                      <span className="text-xs font-mono text-muted-foreground">=</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {visibleAlts.alternatives.map((alt, idx) => {
                          const value = alt.value || '∅';
                          // Replace <OR> with | for display in collapsed view
                          const cleanedValue = value.replace(/<OR>/g, '|');
                          // Truncate individual alternative if it's the only one and too long
                          const displayValue = visibleAlts.alternatives.length === 1 && cleanedValue.length > 120
                            ? cleanedValue.substring(0, 117) + '...'
                            : cleanedValue;
                          
                          return (
                            <span key={idx} className="inline-flex items-center">
                              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                {displayValue}
                              </code>
                              {idx < visibleAlts.alternatives.length - 1 && (
                                <span className="text-xs text-orange-600 mx-1">|</span>
                              )}
                            </span>
                          );
                        })}
                        {visibleAlts.truncated && visibleAlts.remainingCount > 0 && (
                          <span className="text-xs text-muted-foreground">+{visibleAlts.remainingCount} more</span>
                        )}
                      </div>
                      {rule.description && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          📝 {rule.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onToggleCollapse}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    {!selectMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onDuplicate}
                        className="h-7 w-7 p-0"
                        title="Duplicate rule"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {!selectMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onRemove}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Expanded Full View */}
              {!isCollapsed && (
                <div className="space-y-2">
              {/* Header with Collapse Button */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex-1">
                  {/* Editable Name */}
                  {editingName ? (
                    <Input
                      ref={nameInputRef}
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => {
                        onUpdate({ name: tempName });
                        setEditingName(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdate({ name: tempName });
                          setEditingName(false);
                        } else if (e.key === 'Escape') {
                          setTempName(rule.name);
                          setEditingName(false);
                        }
                      }}
                      className="text-lg font-semibold font-mono h-8 mb-1"
                    />
                  ) : (
                    <h3
                      className="text-lg font-semibold font-mono cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setTempName(rule.name);
                        setEditingName(true);
                      }}
                      title="Click to edit rule name"
                    >
                      {rule.name}
                    </h3>
                  )}
                  
                  {/* Editable Description */}
                  {editingDescription ? (
                    <Input
                      ref={descInputRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onBlur={() => {
                        onUpdate({ description: tempDescription });
                        setEditingDescription(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdate({ description: tempDescription });
                          setEditingDescription(false);
                        } else if (e.key === 'Escape') {
                          setTempDescription(rule.description || '');
                          setEditingDescription(false);
                        }
                      }}
                      placeholder="Add description..."
                      className="text-xs h-7 mt-1"
                    />
                  ) : (
                    <p
                      className="text-xs text-muted-foreground mt-1 cursor-pointer hover:text-primary/80 transition-colors"
                      onClick={() => {
                        setTempDescription(rule.description || '');
                        setEditingDescription(true);
                      }}
                      title="Click to edit description"
                    >
                      {rule.description || 'Click to add description...'}
                    </p>
                  )}
                  
                  {/* Rule Type Hint */}
                  <p className="text-xs mt-1">
                    {/^[A-Z]/.test(rule.name) ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        ✓ Uppercase = Shows in AST
                      </span>
                    ) : /^[a-z]/.test(rule.name) ? (
                      <span className="text-slate-600 dark:text-slate-400">
                        ↓ lowercase = Hidden (lexical token)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Start with uppercase or lowercase</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onToggleCollapse}
                    className="h-7 w-7 p-0"
                    title="Collapse rule"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  {!selectMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onDuplicate}
                      className="h-7 w-7 p-0"
                      title="Duplicate rule"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  {!selectMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onRemove}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title="Remove rule"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Alternatives */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Alternatives ({rule.alternatives.length})
                    </label>
                    
                    {/* Rule Operator - Compact */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">•</span>
                      <Select
                        value={rule.operator || '='}
                        onValueChange={(value: '=' | '+=' | ':=') => onUpdate({ operator: value })}
                      >
                        <SelectTrigger className="h-6 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="=" title="Define a new rule">
                            <span className="font-mono">=</span> <span className="text-muted-foreground ml-2 text-xs">Define</span>
                          </SelectItem>
                          <SelectItem value="+=" title="Add alternatives to an existing rule from a parent grammar">
                            <span className="font-mono">+=</span> <span className="text-muted-foreground ml-2 text-xs">Extend</span>
                          </SelectItem>
                          <SelectItem value=":=" title="Replace a rule from the parent grammar">
                            <span className="font-mono">:=</span> <span className="text-muted-foreground ml-2 text-xs">Override</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newAlt: Alternative = {
                        id: `alt-${grammarName}-${rule.name}-${rule.alternatives.length}`, // Deterministic ID
                        value: '',
                      };
                      onUpdate({
                        alternatives: [...rule.alternatives, newAlt],
                      });
                    }}
                    className="h-7 px-2 text-xs gap-1"
                    title="Add a new alternative (OR case) for this rule"
                  >
                    <Plus className="h-3 w-3" />
                    Add Alternative
                  </Button>
                </div>

                {rule.alternatives.map((alt, altIndex) => (
                  <div key={alt.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <AlternativeComposer
                          value={alt.value}
                          onChange={(value) => {
                            const newAlts = rule.alternatives.map(a =>
                              a.id === alt.id ? { ...a, value } : a
                            );
                            onUpdate({ alternatives: newAlts });
                          }}
                          availableRules={availableRules.map(r => ({
                            name: r.name,
                            description: r.description,
                          }))}
                          onCreateRule={onCreateRule}
                        />
                      </div>
                      
                      {/* Right Column - Label and Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          value={alt.label || ''}
                          onChange={(e) => {
                            const newAlts = rule.alternatives.map(a =>
                              a.id === alt.id ? { ...a, label: e.target.value || undefined } : a
                            );
                            onUpdate({ alternatives: newAlts });
                          }}
                          placeholder="label (optional)"
                          className="h-8 w-36 text-xs"
                          title="Optional case label for this alternative"
                        />
                        
                        {/* Remove Button - Inline */}
                        {rule.alternatives.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newAlts = rule.alternatives.filter(
                                a => a.id !== alt.id
                              );
                              onUpdate({ alternatives: newAlts });
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Remove this alternative"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* OR separator */}
                    {altIndex < rule.alternatives.length - 1 && (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
                        <div 
                          className="px-3 py-1 bg-orange-100 dark:bg-orange-950 border-2 border-orange-300 dark:border-orange-700 rounded-full text-xs font-bold text-orange-700 dark:text-orange-300"
                          title="This rule matches either alternative above OR below"
                        >
                          OR
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              {!selectMode && (
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDuplicate}
                    className="gap-2"
                    disabled={disabled}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate Rule
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRemove}
                    className="text-destructive hover:text-destructive gap-2"
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Rule
                  </Button>
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

const GrammarBuilder: React.FC = () => {
  // Access context directly
  const { grammar, setGrammar, collapsedRules, toggleRuleCollapsed, undo, redo } = useGrammar();
  
  // Local state for editing
  const [grammarName, setGrammarName] = useState('MyGrammar');
  const [rules, setRules] = useState<Rule[]>([
    {
      id: '1',
      name: 'Expr',
      alternatives: [{ id: 'alt-1', value: 'digit+' }],
      description: 'Main expression',
    },
  ]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);
  
  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  
  // Rule filter state
  const [ruleFilter, setRuleFilter] = useState<'all' | 'structural' | 'lexical'>('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Clipboard state for copy/paste
  const [copiedRules, setCopiedRules] = useState<Rule[]>([]);
  
  // Track the last grammar we parsed to avoid re-parsing our own changes
  const lastParsedGrammarRef = useRef<string>('');
  
  // Refs for rule elements (for scrolling)
  const ruleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Debounce timer for continuous edits (like typing)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Helper function: Update rules immediately and sync to grammar context
  // Used for discrete operations (add, remove, reorder)
  const syncRulesToGrammar = useCallback((newRules: Rule[], newGrammarName?: string) => {
    const nameToUse = newGrammarName ?? grammarName;
    
    // Update local state
    setRules(newRules);
    if (newGrammarName) {
      setGrammarName(newGrammarName);
    }
    
    // Serialize and update context immediately
    if (newRules.length > 0 && nameToUse.trim()) {
      const serialized = serializeRulesToGrammar(nameToUse, newRules);
      lastParsedGrammarRef.current = serialized;
      setGrammar(serialized);
    }
  }, [grammarName, setGrammar]);
  
  // Helper function: Update rules with debouncing
  // Used for continuous operations (typing in inputs)
  const syncRulesToGrammarDebounced = useCallback((newRules: Rule[], newGrammarName?: string) => {
    const nameToUse = newGrammarName ?? grammarName;
    
    // Update local state immediately (for UI responsiveness)
    setRules(newRules);
    if (newGrammarName) {
      setGrammarName(newGrammarName);
    }
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce the grammar serialization
    debounceTimerRef.current = setTimeout(() => {
      if (newRules.length > 0 && nameToUse.trim()) {
        const serialized = serializeRulesToGrammar(nameToUse, newRules);
        lastParsedGrammarRef.current = serialized;
        setGrammar(serialized);
      }
    }, 500);
  }, [grammarName, setGrammar]);
  
  // Filter rules based on current filter
  let filteredRules = ruleFilter === 'all' 
    ? rules 
    : ruleFilter === 'structural'
    ? rules.filter(r => /^[A-Z]/.test(r.name))
    : rules.filter(r => /^[a-z]/.test(r.name));
  
  // Apply search filter if query exists
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredRules = filteredRules.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.description?.toLowerCase().includes(query)
    );
  }
  
  // Auto-collapse rules beyond the first 2 (only once on initial load or when adding new rules)
  useEffect(() => {
    if (!hasAutoCollapsed && rules.length > 2) {
      const rulesToCollapse = rules.slice(2);
      rulesToCollapse.forEach(rule => {
        if (!collapsedRules.has(rule.id)) {
          toggleRuleCollapsed(rule.id);
        }
      });
      setHasAutoCollapsed(true);
    }
  }, [rules, collapsedRules, toggleRuleCollapsed, hasAutoCollapsed]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ADAPTER PATTERN: Parse grammar from context when it changes externally
  // This handles updates from the Code Editor
  useEffect(() => {
    if (!grammar || !grammar.trim()) {
      return;
    }

    // Don't re-parse if this is the same grammar we just serialized
    if (grammar === lastParsedGrammarRef.current) {
      return;
    }

    console.log('[GrammarBuilder] Parsing grammar from context');
    
    // Clear any pending debounced operations
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    const parsed = parseGrammarToRules(grammar);
    setGrammarName(parsed.name);
    setRules(parsed.rules);
    lastParsedGrammarRef.current = grammar;
    setHasAutoCollapsed(false); // Reset to allow auto-collapse for new grammar
  }, [grammar]);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex(r => r.id === active.id);
      const newIndex = rules.findIndex(r => r.id === over.id);

      syncRulesToGrammar(arrayMove(rules, oldIndex, newIndex));
    }
  };

  const addRule = () => {
    const ruleName = `Rule${rules.length + 1}`;
    const newRule: Rule = {
      id: `rule-${grammarName}-${ruleName}`,
      name: ruleName,
      alternatives: [{ id: `alt-${grammarName}-${ruleName}-0`, value: '' }],
      description: '',
    };
    syncRulesToGrammar([...rules, newRule]);
  };

  const addRuleFromTemplate = (templateId: string) => {
    const template = ruleTemplates.find(t => t.id === templateId);
    if (!template) return;

    const newRules: Rule[] = [];
    const rulesToAdd: RuleTemplate[] = [];

    // Check for dependencies and add them if they don't exist
    if (template.dependencies && template.dependencies.length > 0) {
      for (const dep of template.dependencies) {
        // Only add dependency if it doesn't already exist
        if (!rules.some(r => r.name === dep.ruleName)) {
          rulesToAdd.push(dep);
        }
      }
    }

    // Add dependency rules first
    for (const depTemplate of rulesToAdd) {
      const depRule: Rule = {
        id: `rule-${grammarName}-${depTemplate.ruleName}`,
        name: depTemplate.ruleName,
        alternatives: depTemplate.alternatives.map((alt: string, idx: number) => ({
          id: `alt-${grammarName}-${depTemplate.ruleName}-${idx}`,
          value: alt,
        })),
        description: depTemplate.description,
      };
      newRules.push(depRule);
    }

    // Add the main template rule
    const ruleName = template.ruleName;
    const newRule: Rule = {
      id: `rule-${grammarName}-${ruleName}`,
      name: ruleName,
      alternatives: template.alternatives.map((alt, idx) => ({
        id: `alt-${grammarName}-${ruleName}-${idx}`,
        value: alt,
      })),
      description: template.description,
    };
    newRules.push(newRule);

    syncRulesToGrammar([...rules, ...newRules]);
    setShowTemplateDialog(false);

    // Show notification if dependencies were added
    if (rulesToAdd.length > 0) {
      const depNames = rulesToAdd.map(d => d.ruleName).join(', ');
      console.log(`✓ Also added dependencies: ${depNames}`);
    }
  };

  const createRuleInline = (name: string) => {
    // Check if rule already exists
    if (rules.some(r => r.name === name)) {
      return;
    }

    const newRule: Rule = {
      id: `rule-${grammarName}-${name}`,
      name,
      alternatives: [{ id: `alt-${grammarName}-${name}-0`, value: '' }],
      description: '',
    };
    syncRulesToGrammar([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    // Use debounced sync for updates (called during typing)
    syncRulesToGrammarDebounced(rules.map(rule => (rule.id === id ? { ...rule, ...updates } : rule)));
  };

  const removeRule = (id: string) => {
    if (rules.length === 1) return;
    syncRulesToGrammar(rules.filter(rule => rule.id !== id));
  };

  const duplicateRule = (id: string) => {
    const ruleToDuplicate = rules.find(r => r.id === id);
    if (!ruleToDuplicate) return;

    // Generate unique name
    const newName = generateUniqueRuleName(ruleToDuplicate.name, rules);
    
    // Create duplicated rule
    const newRule: Rule = {
      id: `rule-${grammarName}-${newName}`,
      name: newName,
      alternatives: ruleToDuplicate.alternatives.map((alt, idx) => ({
        id: `alt-${grammarName}-${newName}-${idx}`,
        value: alt.value,
        label: alt.label,
      })),
      description: ruleToDuplicate.description,
      operator: ruleToDuplicate.operator,
    };

    // Insert after the original rule
    const originalIndex = rules.findIndex(r => r.id === id);
    const newRules = [...rules];
    newRules.splice(originalIndex + 1, 0, newRule);
    syncRulesToGrammar(newRules);
  };

  const toggleRuleSelection = (id: string) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRules(newSelected);
  };

  const combineSelectedRules = () => {
    if (selectedRules.size < 2) return;

    const rulesToCombine = rules.filter(r => selectedRules.has(r.id));
    const baseName = 'CombinedRule';
    const newRuleName = generateUniqueRuleName(baseName, rules);

    const combinedRule = combineRulesAsOr(rulesToCombine, newRuleName, grammarName);
    
    // Add the combined rule at the end
    syncRulesToGrammar([...rules, combinedRule]);
    
    // Clear selection and exit select mode
    setSelectedRules(new Set());
    setSelectMode(false);
  };

  const deleteSelectedRules = () => {
    if (selectedRules.size === 0) return;
    
    // Don't allow deleting all rules
    if (selectedRules.size >= rules.length) {
      alert('Cannot delete all rules. At least one rule must remain.');
      return;
    }

    const newRules = rules.filter(r => !selectedRules.has(r.id));
    syncRulesToGrammar(newRules);
    setSelectedRules(new Set());
  };

  const selectAllRules = () => {
    setSelectedRules(new Set(rules.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedRules(new Set());
    setSelectMode(false);
  };

  const copySelectedRules = () => {
    if (selectedRules.size === 0) return;
    
    const rulesToCopy = rules.filter(r => selectedRules.has(r.id));
    setCopiedRules(rulesToCopy);
    console.log(`✓ Copied ${rulesToCopy.length} rule(s) to clipboard`);
  };

  const pasteRules = () => {
    if (copiedRules.length === 0) return;

    const newRules: Rule[] = [];
    for (const rule of copiedRules) {
      const newName = generateUniqueRuleName(rule.name, rules);
      const newRule: Rule = {
        id: `rule-${grammarName}-${newName}`,
        name: newName,
        alternatives: rule.alternatives.map((alt, idx) => ({
          id: `alt-${grammarName}-${newName}-${idx}`,
          value: alt.value,
          label: alt.label,
        })),
        description: rule.description,
        operator: rule.operator,
      };
      newRules.push(newRule);
    }

    syncRulesToGrammar([...rules, ...newRules]);
    console.log(`✓ Pasted ${newRules.length} rule(s)`);
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  const collapseSelectedRules = () => {
    if (selectedRules.size === 0) return;
    
    selectedRules.forEach(ruleId => {
      if (!collapsedRules.has(ruleId)) {
        toggleRuleCollapsed(ruleId);
      }
    });
  };

  const expandSelectedRules = () => {
    if (selectedRules.size === 0) return;
    
    selectedRules.forEach(ruleId => {
      if (collapsedRules.has(ruleId)) {
        toggleRuleCollapsed(ruleId);
      }
    });
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDuplicate: () => {
      // Duplicate first selected rule or last rule
      const ruleId = selectedRules.size > 0 
        ? Array.from(selectedRules)[0] 
        : rules[rules.length - 1]?.id;
      if (ruleId) {
        duplicateRule(ruleId);
      }
    },
    onDelete: () => {
      if (selectedRules.size > 0) {
        deleteSelectedRules();
      }
    },
    onSelectAll: () => {
      if (!selectMode) {
        setSelectMode(true);
      }
      selectAllRules();
    },
    onClearSelection: () => {
      if (selectMode) {
        clearSelection();
      }
    },
    onSearch: focusSearch,
    onCopy: copySelectedRules,
    onPaste: pasteRules,
    onUndo: undo,
    onRedo: redo,
  }, !showTemplateDialog); // Disable shortcuts when template dialog is open

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Visual Grammar Builder</p>
            <p className="text-xs text-muted-foreground mt-1">
              Build grammars visually with drag-and-drop, autocomplete, and operator helpers.
              Click Quick Add buttons to compose sequences, double-click chips to edit.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Keyboard shortcuts:</strong> Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Cmd/Ctrl+D (duplicate), 
              Cmd/Ctrl+C/V (copy/paste), Cmd/Ctrl+A (select all), Cmd/Ctrl+F (search), Escape (clear), Delete (remove)
            </p>
          </div>
        </div>
      </div>

      {/* Grammar Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">Grammar Name</label>
        <Input
          value={grammarName}
          onChange={(e) => setGrammarName(e.target.value)}
          placeholder="MyGrammar"
          className="font-mono"
        />
      </div>

      {/* Search Bar */}
      {rules.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules by name or description... (Cmd/Ctrl+F)"
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={addRule}
            className="gap-2 flex-1"
            disabled={selectMode}
          >
            <Plus className="h-4 w-4" />
            Add Empty Rule
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTemplateDialog(true)}
            className="gap-2 flex-1"
            disabled={selectMode}
          >
            <Wand2 className="h-4 w-4" />
            Add from Template
          </Button>
        </div>

        {/* Selection Mode Controls */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectMode ? 'default' : 'outline'}
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) {
                setSelectedRules(new Set());
              }
            }}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            {selectMode ? 'Exit Select Mode' : 'Select Mode'}
          </Button>
          
          {selectMode && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllRules}
                className="gap-2"
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearSelection}
                className="gap-2"
                disabled={selectedRules.size === 0}
              >
                Clear
              </Button>
            </>
          )}
        </div>

        {/* Selection Actions */}
        {selectMode && selectedRules.size > 0 && (
          <div className="space-y-2 p-3 bg-primary/10 border-2 border-primary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                {selectedRules.size} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={collapseSelectedRules}
                  className="gap-2 h-8"
                  title="Collapse selected rules"
                >
                  <Minimize2 className="h-3 w-3" />
                  Collapse
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={expandSelectedRules}
                  className="gap-2 h-8"
                  title="Expand selected rules"
                >
                  <Maximize2 className="h-3 w-3" />
                  Expand
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={combineSelectedRules}
                className="gap-2 flex-1"
                disabled={selectedRules.size < 2}
              >
                <Combine className="h-4 w-4" />
                Combine as OR
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={deleteSelectedRules}
                className="gap-2 flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Rule Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick-start with common patterns
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowTemplateDialog(false)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 overflow-auto">
              <div className="grid grid-cols-2 gap-3">
                {ruleTemplates.map(template => {
                  const hasDependencies = template.dependencies && template.dependencies.length > 0;
                  const missingDeps = hasDependencies 
                    ? template.dependencies!.filter(dep => !rules.some(r => r.name === dep.ruleName))
                    : [];
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => addRuleFromTemplate(template.id)}
                      className="text-left p-3 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </div>
                          <code className="text-xs font-mono text-primary mt-1 block">
                            {template.ruleName}
                          </code>
                          {missingDeps.length > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              Also adds: {missingDeps.map(d => d.ruleName).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules List with Drag and Drop */}
      <div className="space-y-3">
        {/* Rules Header with Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Rules ({filteredRules.length}/{rules.length})
              {ruleFilter !== 'all' && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({ruleFilter === 'structural' ? 'Structural' : 'Lexical'})
                </span>
              )}
            </label>
            {!selectMode && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Drag to reorder
              </span>
            )}
          </div>

          {/* Rule Type Tabs */}
          <Tabs value={ruleFilter} onValueChange={(v) => setRuleFilter(v as 'all' | 'structural' | 'lexical')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                All ({rules.length})
              </TabsTrigger>
              <TabsTrigger value="structural" className="text-xs">
                Structural ({rules.filter(r => /^[A-Z]/.test(r.name)).length})
              </TabsTrigger>
              <TabsTrigger value="lexical" className="text-xs">
                Lexical ({rules.filter(r => /^[a-z]/.test(r.name)).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredRules.map(r => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filteredRules.length > 0 ? (
                filteredRules.map(rule => (
                  <div 
                    key={rule.id}
                    ref={(el) => {
                      ruleRefs.current[rule.id] = el;
                    }}
                  >
                    <SortableRuleCard
                      rule={rule}
                      rules={rules}
                      grammarName={grammarName}
                      onUpdate={(updates) => updateRule(rule.id, updates)}
                      onRemove={() => removeRule(rule.id)}
                      onCreateRule={createRuleInline}
                      onDuplicate={() => duplicateRule(rule.id)}
                      disabled={rules.length === 1}
                      isCollapsed={collapsedRules.has(rule.id)}
                      onToggleCollapse={() => toggleRuleCollapsed(rule.id)}
                      selectMode={selectMode}
                      isSelected={selectedRules.has(rule.id)}
                      onToggleSelect={() => toggleRuleSelection(rule.id)}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    {searchQuery ? 'No rules match your search.' : `No ${ruleFilter === 'structural' ? 'structural' : 'lexical'} rules found.`}
                  </p>
                  <p className="text-xs mt-1">
                    {searchQuery 
                      ? 'Try a different search term or clear the filter.' 
                      : ruleFilter === 'structural' 
                      ? 'Structural rules start with uppercase (e.g., Expression, Statement)' 
                      : 'Lexical rules start with lowercase (e.g., identifier, number)'}
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default GrammarBuilder;
