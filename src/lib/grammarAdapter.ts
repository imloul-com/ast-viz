import * as ohm from 'ohm-js';
import { validateGrammar } from './parser';

// Type definitions for structured grammar rules
export interface Alternative {
  id: string;
  value: string;
  label?: string; // Case label for the alternative (e.g., "plus" from "-- plus")
}

export interface Rule {
  id: string;
  name: string;
  alternatives: Alternative[];
  description?: string;
  operator?: '=' | '+=' | ':='; // Rule definition operator
}

export interface ParsedGrammar {
  name: string;
  rules: Rule[];
}

// ============================================================================
// PARSING: Ohm.js Grammar String → Structured Rules
// ============================================================================

/**
 * Adapter function: Parse Ohm.js grammar text into structured rules
 * This is the main entry point for converting grammar string to visual builder format
 */
export function parseGrammarToRules(grammarText: string): ParsedGrammar {
  const defaultResult: ParsedGrammar = {
    name: 'MyGrammar',
    rules: [
      {
        id: '1',
        name: 'Expr',
        alternatives: [{ id: 'alt-1', value: 'digit+' }],
        description: '',
      },
    ],
  };

  if (!grammarText.trim()) {
    return defaultResult;
  }

  try {
    // Extract grammar name from text
    const nameMatch = grammarText.match(/^(\w+)\s*\{/);
    const name = nameMatch ? nameMatch[1] : 'MyGrammar';

    // Try to use Ohm.js grammar introspection for robust parsing
    try {
      const grammar = ohm.grammar(grammarText);
      const parsedRules: Rule[] = [];

      // Extract comments for descriptions
      const commentMap = new Map<string, string>();
      const lines = grammarText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('//')) {
          const comment = line.replace('//', '').trim();
          // Look for rule name in next line
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && /^[A-Za-z][a-zA-Z0-9_]*$/.test(nextLine)) {
            commentMap.set(nextLine, comment);
          }
        }
      }

      // Use Ohm.js grammar rules object to introspect
      const ruleNames = Object.keys(grammar.rules);
      
      for (const ruleName of ruleNames) {
        // Skip Ohm.js internal rules
        if (ruleName.startsWith('_')) continue;

        const description = commentMap.get(ruleName) || '';

        // Extract rule body from grammar source
        const ruleBody = extractRuleBodyFromText(grammarText, ruleName);
        
        if (ruleBody) {
          parsedRules.push({
            id: `rule-${name}-${ruleName}`,
            name: ruleName,
            alternatives: ruleBody.alternatives.map((alt, idx) => ({
              id: `alt-${name}-${ruleName}-${idx}`,
              value: alt.value,
              label: alt.label,
            })),
            description,
            operator: ruleBody.operator,
          });
        }
      }

      if (parsedRules.length > 0) {
        return { name, rules: parsedRules };
      }
    } catch (ohmError) {
      // If Ohm.js parsing fails, fall back to regex-based parsing
      console.warn('Ohm.js introspection failed, using fallback parser:', ohmError);
    }

    // Fallback: regex-based parsing
    return parseGrammarTextFallback(grammarText, name);
  } catch (error) {
    console.error('Error parsing grammar:', error);
    return defaultResult;
  }
}

// Helper to extract rule body from grammar text
function extractRuleBodyFromText(
  grammarText: string,
  ruleName: string
): { alternatives: Array<{ value: string; label?: string }>; operator: '=' | '+=' | ':=' } | null {
  const lines = grammarText.split('\n');
  let foundRule = false;
  let operator: '=' | '+=' | ':=' = '=';
  let ruleBody = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find rule name line
    if (line === ruleName) {
      foundRule = true;
      continue;
    }

    if (!foundRule) continue;

    // Check for operator
    if (line.startsWith('=') || line.startsWith('+=') || line.startsWith(':=')) {
      if (line.startsWith(':=')) {
        operator = ':=';
        ruleBody = line.substring(2).trim();
      } else if (line.startsWith('+=')) {
        operator = '+=';
        ruleBody = line.substring(2).trim();
      } else {
        operator = '=';
        ruleBody = line.substring(1).trim();
      }
      continue;
    }

    // Check for alternative separator (line-based)
    if (line.startsWith('|')) {
      ruleBody += ' | ' + line.substring(1).trim();
      continue;
    }

    // End of rule (next rule or closing brace)
    const nextLine = lines[i + 1]?.trim();
    const isNextRuleStart = nextLine && (nextLine.startsWith('=') || nextLine.startsWith('+=') || nextLine.startsWith(':='));
    if (line === '}' || (line.match(/^[A-Za-z][a-zA-Z0-9_]*$/) && isNextRuleStart)) {
      break;
    }

    // Continue building rule body
    if (ruleBody && line && !line.startsWith('//')) {
      ruleBody += ' ' + line;
    } else if (!ruleBody && line && !line.startsWith('//')) {
      ruleBody = line;
    }
  }

  // Split the rule body by | using the smart splitter that respects brackets/parens
  if (ruleBody) {
    const parts = splitAlternatives(ruleBody);
    const alternatives: Array<{ value: string; label?: string }> = [];
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const { value, label } = parseAlternativeWithLabel(trimmed);
      if (value) {
        alternatives.push({ value, label });
      }
    }

    if (alternatives.length === 0) {
      return null;
    }

    // Combine single-token alternatives into one with OR separators
    const combined = combineSingleTokenAlternatives(alternatives);

    return { alternatives: combined, operator };
  }

  return null;
}

// Fallback regex-based parser
function parseGrammarTextFallback(grammarText: string, name: string): ParsedGrammar {
  const rulesSection = grammarText.match(/\{([\s\S]*)\}/);
  if (!rulesSection) {
    return {
      name,
      rules: [
        {
          id: '1',
          name: 'Expr',
          alternatives: [{ id: 'alt-1', value: 'digit+' }],
          description: '',
        },
      ],
    };
  }

  const rulesText = rulesSection[1];
  const lines = rulesText.split('\n').filter(line => line.trim());

  const parsedRules: Rule[] = [];
  let currentRule: Partial<Rule> | null = null;
  let currentDefinition: string[] = [];
  let lastComment = '';
  let currentRuleOperator: '=' | '+=' | ':=' = '=';

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('//')) {
      lastComment = trimmed.replace('//', '').trim();
      continue;
    }

    const ruleMatch = trimmed.match(/^(\w+)\s*$/);
    if (ruleMatch && lines[lines.indexOf(line) + 1]?.includes('=')) {
      if (currentRule && currentRule.name) {
        const ruleName = currentRule.name;
        const fullDef = currentDefinition.join(' ').trim();
        const alternatives = splitAlternatives(fullDef)
          .map((alt, idx) => {
            const trimmedAlt = alt.trim();
            const labelMatch = trimmedAlt.match(/^(.+?)\s*--\s*(\w+)\s*$/);
            if (labelMatch) {
              return {
                id: `alt-${name}-${ruleName}-${idx}`,
                value: labelMatch[1].trim(),
                label: labelMatch[2].trim(),
              };
            }
            return {
              id: `alt-${name}-${ruleName}-${idx}`,
              value: trimmedAlt,
            };
          })
          .filter(alt => alt.value);

        parsedRules.push({
          id: `rule-${name}-${ruleName}`,
          name: ruleName,
          alternatives:
            alternatives.length > 0
              ? alternatives
              : [{ id: `alt-${name}-${ruleName}-0`, value: '' }],
          description: lastComment,
          operator: currentRuleOperator,
        });
        lastComment = '';
      }

      currentRule = { name: ruleMatch[1] };
      currentDefinition = [];
      currentRuleOperator = '=';
      continue;
    }

    if (trimmed.startsWith(':=')) {
      currentRuleOperator = ':=';
      const def = trimmed.substring(2).trim();
      if (!def.startsWith('//')) {
        currentDefinition.push(def);
      }
    } else if (trimmed.startsWith('+=')) {
      currentRuleOperator = '+=';
      const def = trimmed.substring(2).trim();
      if (!def.startsWith('//')) {
        currentDefinition.push(def);
      }
    } else if (trimmed.startsWith('=')) {
      currentRuleOperator = '=';
      const def = trimmed.substring(1).trim();
      if (!def.startsWith('//')) {
        currentDefinition.push(def);
      }
    } else if (trimmed.startsWith('|')) {
      const def = trimmed.substring(1).trim();
      if (!def.startsWith('//')) {
        currentDefinition.push('|');
        currentDefinition.push(def);
      }
    } else if (currentRule && !trimmed.startsWith('//')) {
      if (trimmed) {
        currentDefinition.push(trimmed);
      }
    }
  }

  if (currentRule && currentRule.name) {
    const ruleName = currentRule.name;
    const fullDef = currentDefinition.join(' ').trim();
    const alternatives = splitAlternatives(fullDef)
      .map((alt, idx) => {
        const trimmedAlt = alt.trim();
        const labelMatch = trimmedAlt.match(/^(.+?)\s*--\s*(\w+)\s*$/);
        if (labelMatch) {
          return {
            id: `alt-${name}-${ruleName}-${idx}`,
            value: labelMatch[1].trim(),
            label: labelMatch[2].trim(),
          };
        }
        return {
          id: `alt-${name}-${ruleName}-${idx}`,
          value: trimmedAlt,
        };
      })
      .filter(alt => alt.value);

    parsedRules.push({
      id: `rule-${name}-${ruleName}`,
      name: ruleName,
      alternatives:
        alternatives.length > 0
          ? alternatives
          : [{ id: `alt-${name}-${ruleName}-0`, value: '' }],
      description: lastComment,
      operator: currentRuleOperator,
    });
  }

  return {
    name,
    rules:
      parsedRules.length > 0
        ? parsedRules
        : [
            {
              id: '1',
              name: 'Expr',
              alternatives: [{ id: 'alt-1', value: 'digit+' }],
              description: '',
            },
          ],
  };
}

// Helper: Split alternatives by '|' but respect quotes, parens, and brackets
function splitAlternatives(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenDepth = 0;
  let bracketDepth = 0;
  let escapeNext = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      current += char;
      inQuotes = !inQuotes;
      continue;
    }

    if (inQuotes) {
      current += char;
      continue;
    }

    if (char === '(') {
      parenDepth++;
      current += char;
      continue;
    }

    if (char === ')') {
      parenDepth--;
      current += char;
      continue;
    }

    if (char === '[') {
      bracketDepth++;
      current += char;
      continue;
    }

    if (char === ']') {
      bracketDepth--;
      current += char;
      continue;
    }

    // Only split on | if outside all delimiters
    if (char === '|' && parenDepth === 0 && bracketDepth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

// Helper to parse alternative with optional label
function parseAlternativeWithLabel(alt: string): { value: string; label?: string } {
  const labelMatch = alt.match(/^(.+?)\s*--\s*(\w+)\s*$/);
  if (labelMatch) {
    return {
      value: labelMatch[1].trim(),
      label: labelMatch[2].trim(),
    };
  }
  return { value: alt.trim() };
}

// Helper to check if an alternative is a single token
function isSingleToken(alt: string): boolean {
  const trimmed = alt.trim();
  
  // Check for literals (quoted strings)
  if (trimmed.match(/^"[^"]*"$/)) return true;
  if (trimmed.match(/^'[^']*'$/)) return true;
  
  // Check for single pattern or rule with optional modifiers
  if (trimmed.match(/^[~&]?\s*[a-zA-Z_][a-zA-Z0-9_]*[+*?]?$/)) return true;
  
  return false;
}

// Helper to combine consecutive single-token alternatives with OR separators
function combineSingleTokenAlternatives(
  alternatives: Array<{ value: string; label?: string }>
): Array<{ value: string; label?: string }> {
  if (alternatives.length <= 1) {
    return alternatives;
  }

  const result: Array<{ value: string; label?: string }> = [];
  let currentGroup: string[] = [];

  for (let i = 0; i < alternatives.length; i++) {
    const alt = alternatives[i];
    
    // Skip alternatives with labels (they should stay separate)
    if (alt.label) {
      // Flush current group
      if (currentGroup.length > 0) {
        if (currentGroup.length === 1) {
          result.push({ value: currentGroup[0] });
        } else {
          result.push({ value: currentGroup.join(' <OR> ') });
        }
        currentGroup = [];
      }
      result.push(alt);
      continue;
    }

    if (isSingleToken(alt.value)) {
      currentGroup.push(alt.value);
    } else {
      // Flush current group
      if (currentGroup.length > 0) {
        if (currentGroup.length === 1) {
          result.push({ value: currentGroup[0] });
        } else {
          result.push({ value: currentGroup.join(' <OR> ') });
        }
        currentGroup = [];
      }
      result.push(alt);
    }
  }

  // Flush remaining group
  if (currentGroup.length > 0) {
    if (currentGroup.length === 1) {
      result.push({ value: currentGroup[0] });
    } else {
      result.push({ value: currentGroup.join(' <OR> ') });
    }
  }

  return result;
}

// ============================================================================
// SERIALIZATION: Structured Rules → Ohm.js Grammar String
// ============================================================================

/**
 * Adapter function: Serialize structured rules to Ohm.js grammar text
 * This is the main entry point for converting visual builder format to grammar string
 */
export function serializeRulesToGrammar(grammarName: string, rules: Rule[]): string {
  const lines: string[] = [`${grammarName} {`];

  rules.forEach((rule, index) => {
    if (index > 0) {
      lines.push('');
    }

    if (rule.description) {
      lines.push(`  // ${rule.description}`);
    }

    lines.push(`  ${rule.name}`);

    // Expand alternatives containing <OR> back into separate pipe alternatives
    const expandedAlts: Array<{ value: string; label?: string }> = [];
    rule.alternatives.forEach(alt => {
      if (alt.value.includes('<OR>')) {
        // Split by <OR> and create separate alternatives
        const parts = alt.value.split('<OR>').map(p => p.trim()).filter(p => p);
        parts.forEach(part => {
          expandedAlts.push({ value: part, label: alt.label });
        });
      } else {
        expandedAlts.push(alt);
      }
    });

    expandedAlts.forEach((alt, altIndex) => {
      const trimmedValue = alt.value.trim();
      if (trimmedValue) {
        const altText = alt.label ? `${trimmedValue}  -- ${alt.label}` : trimmedValue;
        if (altIndex === 0) {
          const operator = rule.operator || '=';
          lines.push(`    ${operator} ${altText}`);
        } else {
          lines.push(`    | ${altText}`);
        }
      }
    });
  });

  lines.push('}');

  return lines.join('\n');
}

/**
 * Serialize rules to grammar and validate before returning
 * Returns null if the generated grammar is invalid
 */
export function serializeAndValidate(grammarName: string, rules: Rule[]): string | null {
  const grammar = serializeRulesToGrammar(grammarName, rules);
  const validation = validateGrammar(grammar);
  
  if (validation.valid) {
    return grammar;
  }
  
  console.warn('[grammarAdapter] Generated grammar is invalid:', validation.error);
  return null;
}

/**
 * Combine multiple rules into a single rule with OR alternatives
 * Creates a new rule that references all input rules as alternatives
 */
export function combineRulesAsOr(
  rules: Rule[],
  newRuleName: string,
  grammarName: string
): Rule {
  if (rules.length === 0) {
    throw new Error('Cannot combine zero rules');
  }

  // Create alternatives that reference each rule by name
  const alternatives: Alternative[] = rules.map((rule, idx) => ({
    id: `alt-${grammarName}-${newRuleName}-${idx}`,
    value: rule.name,
  }));

  return {
    id: `rule-${grammarName}-${newRuleName}`,
    name: newRuleName,
    alternatives,
    description: `Combined from: ${rules.map(r => r.name).join(', ')}`,
    operator: '=',
  };
}

/**
 * Helper to categorize rules by type (structural vs lexical)
 */
export function categorizeRules(rules: Rule[]): {
  structural: Rule[];
  lexical: Rule[];
} {
  const structural = rules.filter(r => /^[A-Z]/.test(r.name));
  const lexical = rules.filter(r => /^[a-z]/.test(r.name));
  
  return { structural, lexical };
}

/**
 * Helper to generate a unique rule name based on existing rules
 * E.g., if "Expr" exists, returns "Expr2", if that exists, returns "Expr3"
 */
export function generateUniqueRuleName(baseName: string, existingRules: Rule[]): string {
  const existingNames = new Set(existingRules.map(r => r.name));
  
  if (!existingNames.has(baseName)) {
    return baseName;
  }
  
  let counter = 2;
  while (existingNames.has(`${baseName}${counter}`)) {
    counter++;
  }
  
  return `${baseName}${counter}`;
}

