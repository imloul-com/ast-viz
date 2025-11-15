import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Hash, Type, Code2, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ChipType = 'rule' | 'literal' | 'pattern' | 'operator' | 'builtin' | 'or' | 'listof';
export type Modifier = '+' | '*' | '?' | '~' | '&' | '';

interface RuleChipProps {
  id: string;
  value: string;
  type: ChipType;
  draggable?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
  onModifierChange?: (newValue: string) => void;
  onWrapWithListOf?: () => void;  // New prop for wrapping with listOf
  description?: string;
}

// Helper to parse value and extract base + modifier
const parseModifier = (value: string): { base: string; modifier: Modifier; prefix: string } => {
  // Check for prefix modifiers (~ or &)
  const prefixMatch = value.match(/^([~&])\s*(.+)$/);
  if (prefixMatch) {
    const prefix = prefixMatch[1] as Modifier;
    const rest = prefixMatch[2];
    // Check if rest also has postfix modifier
    const postfixMatch = rest.match(/^(.+?)([+*?])$/);
    if (postfixMatch) {
      return { base: postfixMatch[1], modifier: postfixMatch[2] as Modifier, prefix };
    }
    return { base: rest, modifier: '', prefix };
  }

  // Check for postfix modifiers (+ * ?)
  const postfixMatch = value.match(/^(.+?)([+*?])$/);
  if (postfixMatch) {
    return { base: postfixMatch[1], modifier: postfixMatch[2] as Modifier, prefix: '' };
  }

  return { base: value, modifier: '', prefix: '' };
};

// Helper to get modifier display info
const getModifierInfo = (modifier: Modifier): { display: string; name: string; color: string } => {
  switch (modifier) {
    case '+':
      return { display: '+', name: 'one or more', color: 'text-orange-600 dark:text-orange-400' };
    case '*':
      return { display: '*', name: 'zero or more', color: 'text-orange-600 dark:text-orange-400' };
    case '?':
      return { display: '?', name: 'optional', color: 'text-orange-600 dark:text-orange-400' };
    case '~':
      return { display: '~', name: 'not (exclude)', color: 'text-red-600 dark:text-red-400' };
    case '&':
      return { display: '&', name: 'lookahead', color: 'text-blue-600 dark:text-blue-400' };
    default:
      return { display: '', name: '', color: '' };
  }
};

const chipStyles = {
  rule: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
  literal: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100',
  pattern: 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100',
  operator: 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100',
  builtin: 'bg-teal-100 dark:bg-teal-900 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100',
  or: 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-100 font-bold',
  listof: 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100',
};

const chipIcons = {
  rule: Code2,
  literal: Type,
  pattern: Hash,
  operator: Hash,
  builtin: Hash,
  or: Hash,
  listof: ListOrdered,
};

export const RuleChip: React.FC<RuleChipProps> = ({
  id,
  value,
  type,
  draggable = true,
  onRemove,
  onEdit,
  onModifierChange,
  onWrapWithListOf,
  description,
}) => {
  const [showModifiers, setShowModifiers] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showListOfMenu, setShowListOfMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !draggable || isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = chipIcons[type];
  const { base, modifier, prefix } = parseModifier(value);
  const modifierInfo = getModifierInfo(modifier);
  const prefixInfo = getModifierInfo(prefix as Modifier);
  
  // Update edit value when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Build tooltip with modifier explanation
  let tooltipText = description || '';
  if (modifier) {
    tooltipText = tooltipText 
      ? `${tooltipText} (${modifierInfo.name})` 
      : modifierInfo.name;
  }
  if (prefix) {
    tooltipText = `${prefixInfo.name} - ${tooltipText}`;
  }

  // Don't show modifiers for operator or OR chips
  const canHaveModifier = type !== 'operator' && type !== 'or' && type !== 'listof';
  const isOrToken = type === 'or';
  const isListOfToken = type === 'listof';
  
  // Handle starting inline edit
  const startInlineEdit = () => {
    if (onEdit) {
      setIsEditing(true);
      setEditValue(value);
    }
  };
  
  // Handle saving inline edit
  const saveInlineEdit = () => {
    if (editValue.trim() && editValue !== value && onModifierChange) {
      onModifierChange(editValue.trim());
    }
    setIsEditing(false);
  };
  
  // Handle canceling inline edit
  const cancelInlineEdit = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const applyModifier = (newModifier: Modifier) => {
    if (!onModifierChange) return;
    
    let newValue = base;
    
    // Apply prefix if exists
    if (prefix) {
      newValue = `${prefix} ${newValue}`;
    }
    
    // Apply or toggle postfix modifier
    if (newModifier === modifier) {
      // Clicking same modifier removes it
      newValue = prefix ? `${prefix} ${base}` : base;
    } else if (newModifier === '~' || newModifier === '&') {
      // Prefix modifiers
      if (prefix === newModifier) {
        // Remove prefix
        newValue = modifier ? `${base}${modifier}` : base;
      } else {
        // Add/change prefix
        newValue = modifier ? `${newModifier} ${base}${modifier}` : `${newModifier} ${base}`;
      }
    } else {
      // Postfix modifiers
      newValue = prefix ? `${prefix} ${base}${newModifier}` : `${base}${newModifier}`;
    }
    
    onModifierChange(newValue);
    setShowModifiers(false);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => {
        if (canHaveModifier) setShowModifiers(true);
        setShowButtons(true);
      }}
      onMouseLeave={() => {
        setShowModifiers(false);
        setShowButtons(false);
      }}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={`
          inline-flex items-center gap-1.5 rounded-md border-2
          font-mono text-xs transition-all duration-200
          ${chipStyles[type]}
          ${isDragging ? 'shadow-lg cursor-grabbing' : 'shadow-sm'}
          ${!isOrToken && draggable ? 'cursor-grab hover:shadow-md' : ''}
          ${isOrToken ? 'px-2 py-1.5' : 'px-2.5 py-1.5'}
          group
        `}
        title={tooltipText}
      >
        {isOrToken ? (
          // OR token special rendering - compact, expands on hover
          <span className="font-bold text-sm">OR</span>
        ) : isListOfToken ? (
          // ListOf token special rendering - shows contained token and separator
          <>
            {draggable && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing focus:outline-none"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-3 w-3 opacity-50 group-hover:opacity-100" />
              </button>
            )}
            <Icon className="h-3 w-3 flex-shrink-0" />
            <span
              className="font-medium select-none"
              onDoubleClick={onEdit}
              role={onEdit ? 'button' : undefined}
            >
              {base}
            </span>
          </>
        ) : (
          <>
            {draggable && !isEditing && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing focus:outline-none"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-3 w-3 opacity-50 group-hover:opacity-100" />
              </button>
            )}
            
            <Icon className="h-3 w-3 flex-shrink-0" />
            
            {isEditing ? (
              // Inline editing input - styled like the chip
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveInlineEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveInlineEdit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelInlineEdit();
                  }
                }}
                className="font-medium bg-transparent border-none outline-none focus:outline-none min-w-[40px] max-w-[200px]"
                style={{ width: `${Math.max(40, editValue.length * 8)}px` }}
              />
            ) : (
              <span
                className="font-medium select-none relative cursor-text"
                onDoubleClick={startInlineEdit}
                onClick={startInlineEdit}
                role={onEdit ? 'button' : undefined}
              >
                {prefix && (
                  <span className={`${prefixInfo.color} font-bold mr-0.5`}>
                    {prefixInfo.display}
                  </span>
                )}
                {base}
                {modifier && (
                  <span className={`${modifierInfo.color} font-bold ml-0.5`}>
                    {modifierInfo.display}
                  </span>
                )}
              </span>
            )}
          </>
        )}

        {/* Remove button - smooth expand on hover */}
        {onRemove && (
          <div 
            className={`overflow-hidden transition-all duration-200 -ml-2 ${
              showButtons ? 'w-6 opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemove}
              className="h-4 w-6 p-0 pl-2 hover:bg-background/50 flex-shrink-0"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Invisible bridge to prevent popup from disappearing */}
      {showModifiers && canHaveModifier && onModifierChange && (
        <div className="absolute top-full left-0 right-0 h-2 z-40" />
      )}

      {/* Modifier Selector - appears on hover */}
      {showModifiers && canHaveModifier && onModifierChange && (
        <div 
          className="absolute top-full left-0 z-50 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-1 flex gap-1 mt-2"
        >
          <span className="text-xs text-muted-foreground px-1 self-center whitespace-nowrap">
            Modify:
          </span>
          <button
            onClick={() => applyModifier('+')}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              modifier === '+' 
                ? 'bg-orange-500 text-white' 
                : 'hover:bg-orange-100 dark:hover:bg-orange-900'
            }`}
            title="One or more"
          >
            +
          </button>
          <button
            onClick={() => applyModifier('*')}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              modifier === '*' 
                ? 'bg-orange-500 text-white' 
                : 'hover:bg-orange-100 dark:hover:bg-orange-900'
            }`}
            title="Zero or more"
          >
            *
          </button>
          <button
            onClick={() => applyModifier('?')}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              modifier === '?' 
                ? 'bg-orange-500 text-white' 
                : 'hover:bg-orange-100 dark:hover:bg-orange-900'
            }`}
            title="Optional"
          >
            ?
          </button>
          <div className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
          <button
            onClick={() => applyModifier('~')}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              prefix === '~' 
                ? 'bg-red-500 text-white' 
                : 'hover:bg-red-100 dark:hover:bg-red-900'
            }`}
            title="Not (exclude)"
          >
            ~
          </button>
          <button
            onClick={() => applyModifier('&')}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              prefix === '&' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-blue-100 dark:hover:bg-blue-900'
            }`}
            title="Lookahead"
          >
            &
          </button>
          
          {/* ListOf wrapper - only show for rule/pattern/builtin types */}
          {(type === 'rule' || type === 'pattern' || type === 'builtin') && onWrapWithListOf && (
            <>
              <div className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
              <button
                onClick={() => {
                  setShowModifiers(false);
                  setShowListOfMenu(true);
                }}
                className="px-2 py-1 text-xs rounded transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900 flex items-center gap-1"
                title="Wrap with listOf"
              >
                <ListOrdered className="h-3 w-3" />
                List
              </button>
            </>
          )}
        </div>
      )}
      
      {/* ListOf Configuration Menu */}
      {showListOfMenu && onWrapWithListOf && (
        <div 
          className="absolute top-full left-0 z-50 bg-white dark:bg-slate-800 border-2 border-indigo-400 dark:border-indigo-600 rounded-lg shadow-lg p-3 mt-2 min-w-[200px]"
        >
          <div className="text-xs font-semibold mb-2 text-indigo-700 dark:text-indigo-300">
            Wrap "{base}" with listOf
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                onWrapWithListOf();
                setShowListOfMenu(false);
              }}
              className="w-full text-left px-2 py-1.5 text-xs rounded bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <div className="font-mono font-semibold">listOf&lt;{base}, ","&gt;</div>
              <div className="text-muted-foreground text-xs">Optional (can be empty)</div>
            </button>
            <button
              onClick={() => {
                onWrapWithListOf();
                setShowListOfMenu(false);
              }}
              className="w-full text-left px-2 py-1.5 text-xs rounded bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <div className="font-mono font-semibold">nonemptyListOf&lt;{base}, ","&gt;</div>
              <div className="text-muted-foreground text-xs">Required (at least one)</div>
            </button>
          </div>
          <button
            onClick={() => setShowListOfMenu(false)}
            className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

interface StaticRuleChipProps {
  value: string;
  type: ChipType;
  description?: string;
  onClick?: () => void;
}

export const StaticRuleChip: React.FC<StaticRuleChipProps> = ({
  value,
  type,
  description,
  onClick,
}) => {
  const Icon = chipIcons[type];
  const { base, modifier, prefix } = parseModifier(value);
  const modifierInfo = getModifierInfo(modifier);
  const prefixInfo = getModifierInfo(prefix as Modifier);
  
  // Build tooltip with modifier explanation
  let tooltipText = description || '';
  if (modifier) {
    tooltipText = tooltipText 
      ? `${tooltipText} (${modifierInfo.name})` 
      : modifierInfo.name;
  }
  if (prefix) {
    tooltipText = `${prefixInfo.name} - ${tooltipText}`;
  }

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border-2
        font-mono text-xs transition-all shadow-sm
        ${chipStyles[type]}
        hover:shadow-md hover:scale-105 active:scale-95
        cursor-pointer
      `}
      title={tooltipText}
    >
      <Icon className="h-3 w-3" />
      <span className="font-medium">
        {prefix && (
          <span className={`${prefixInfo.color} font-bold mr-0.5`}>
            {prefixInfo.display}
          </span>
        )}
        {base}
        {modifier && (
          <span className={`${modifierInfo.color} font-bold ml-0.5`}>
            {modifierInfo.display}
          </span>
        )}
      </span>
    </button>
  );
};

