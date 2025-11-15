// Grammar analysis utilities for dependency tracking and metadata

export interface RuleDependency {
  from: string;
  to: string;
  type: 'reference' | 'builtin' | 'literal';
}

export interface RuleMetadata {
  name: string;
  usageCount: number;
  isEntry: boolean;
  isTerminal: boolean;
  dependencies: string[];
  dependents: string[];
  complexity: number;
}

export interface GrammarAnalysis {
  rules: string[];
  dependencies: RuleDependency[];
  metadata: Map<string, RuleMetadata>;
  unusedRules: string[];
  entryRule: string | null;
  hasLeftRecursion: boolean;
  leftRecursiveRules: string[];
}

const BUILTIN_RULES = new Set([
  'digit', 'letter', 'alnum', 'space', 'any', 'lower', 'upper',
  'hexDigit', 'listOf', 'nonemptyListOf', 'applySyntactic'
]);

/**
 * Extract rule names from grammar text
 * Matches both uppercase (structural) and lowercase (lexical) rules
 */
export function extractRules(grammarText: string): string[] {
  const rules: string[] = [];
  const lines = grammarText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip comments, empty lines, and grammar name
    if (line.startsWith('//') || !line || line.includes('{') || line === '}') {
      continue;
    }
    
    // Check if next line has '=' to identify rule definition
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    // Match both uppercase (structural) and lowercase (lexical) rule names
    if (nextLine.startsWith('=') && /^[A-Za-z][a-zA-Z0-9_]*$/.test(line)) {
      rules.push(line);
    }
  }
  
  return rules;
}

/**
 * Parse rule alternatives and extract referenced rules
 * Detects both uppercase (structural) and lowercase (lexical) rule references
 */
function extractReferencesFromDefinition(definition: string, allRules: Set<string>): string[] {
  const references: string[] = [];
  
  // Remove strings (quoted content)
  let cleaned = definition.replace(/"[^"]*"/g, ' ');
  // Remove case labels (-- labelName)
  cleaned = cleaned.replace(/--\s*\w+/g, ' ');
  // Remove operators and special characters but keep rule names
  cleaned = cleaned.replace(/[=|+*?()~&]/g, ' ');
  
  // Match word tokens that could be rule names (both uppercase and lowercase)
  const tokens = cleaned.match(/[A-Za-z][a-zA-Z0-9_]*/g) || [];
  
  for (const token of tokens) {
    // Check if token is in our rule set (excluding Ohm.js built-ins)
    if (allRules.has(token) && !BUILTIN_RULES.has(token)) {
      if (!references.includes(token)) {
        references.push(token);
      }
    }
  }
  
  return references;
}

/**
 * Calculate complexity score for a rule
 */
function calculateComplexity(definition: string): number {
  let complexity = 0;
  
  // Count operators
  complexity += (definition.match(/\+/g) || []).length;
  complexity += (definition.match(/\*/g) || []).length * 0.8;
  complexity += (definition.match(/\?/g) || []).length * 0.5;
  complexity += (definition.match(/\|/g) || []).length * 1.5;
  
  // Count sequences (spaces between tokens)
  const tokens = definition.trim().split(/\s+/).length;
  complexity += tokens * 0.3;
  
  return Math.round(complexity * 10) / 10;
}

/**
 * Detect left recursion in a rule
 */
function hasLeftRecursion(ruleName: string, definition: string): boolean {
  const alternatives = definition.split('|').map(alt => alt.trim());
  
  for (const alt of alternatives) {
    // Remove leading whitespace and check if rule references itself at the start
    const cleaned = alt.trim().replace(/^=\s*/, '');
    const firstToken = cleaned.match(/^[A-Z][a-zA-Z0-9_]*/);
    
    if (firstToken && firstToken[0] === ruleName) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analyze grammar and return comprehensive metadata
 */
export function analyzeGrammar(grammarText: string): GrammarAnalysis {
  if (!grammarText.trim()) {
    return {
      rules: [],
      dependencies: [],
      metadata: new Map(),
      unusedRules: [],
      entryRule: null,
      hasLeftRecursion: false,
      leftRecursiveRules: [],
    };
  }

  const rules = extractRules(grammarText);
  const allRulesSet = new Set(rules);
  const dependencies: RuleDependency[] = [];
  const metadata = new Map<string, RuleMetadata>();
  const usageCount = new Map<string, number>();
  const leftRecursiveRules: string[] = [];

  // Initialize usage counts
  rules.forEach(rule => usageCount.set(rule, 0));

  // Parse each rule and build dependency graph
  const ruleDefinitions = new Map<string, string>();
  const lines = grammarText.split('\n');
  
  let currentRule: string | null = null;
  let currentDefinition: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.includes('{') || line === '}') {
      continue;
    }

    // Check if this is a rule name
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    if (nextLine.startsWith('=') && /^[A-Z][a-zA-Z0-9_]*$/.test(line)) {
      // Save previous rule
      if (currentRule && currentDefinition.length > 0) {
        ruleDefinitions.set(currentRule, currentDefinition.join(' '));
      }
      currentRule = line;
      currentDefinition = [];
      continue;
    }

    // Collect definition lines
    if (currentRule && (line.startsWith('=') || line.startsWith('|') || line)) {
      currentDefinition.push(line);
    }
  }

  // Save last rule
  if (currentRule && currentDefinition.length > 0) {
    ruleDefinitions.set(currentRule, currentDefinition.join(' '));
  }

  // Analyze each rule
  for (const rule of rules) {
    const definition = ruleDefinitions.get(rule) || '';
    const references = extractReferencesFromDefinition(definition, allRulesSet);
    
    // Check for left recursion
    if (hasLeftRecursion(rule, definition)) {
      leftRecursiveRules.push(rule);
    }

    // Update usage counts
    references.forEach(ref => {
      const count = usageCount.get(ref) || 0;
      usageCount.set(ref, count + 1);
    });

    // Add dependencies
    references.forEach(ref => {
      dependencies.push({
        from: rule,
        to: ref,
        type: allRulesSet.has(ref) ? 'reference' : 'builtin',
      });
    });

    // Calculate metadata
    const complexity = calculateComplexity(definition);
    const isTerminal = references.length === 0 || references.every(ref => BUILTIN_RULES.has(ref));
    
    metadata.set(rule, {
      name: rule,
      usageCount: 0, // Will be updated below
      isEntry: false, // Will be determined below
      isTerminal,
      dependencies: references,
      dependents: [],
      complexity,
    });
  }

  // Update usage counts and dependents
  for (const [rule, count] of usageCount.entries()) {
    const meta = metadata.get(rule);
    if (meta) {
      meta.usageCount = count;
    }
  }

  // Build dependents list
  for (const dep of dependencies) {
    const meta = metadata.get(dep.to);
    if (meta && !meta.dependents.includes(dep.from)) {
      meta.dependents.push(dep.from);
    }
  }

  // Determine entry rule (first rule or rule with 0 usage)
  const entryRule = rules.length > 0 ? rules[0] : null;
  if (entryRule) {
    const meta = metadata.get(entryRule);
    if (meta) {
      meta.isEntry = true;
    }
  }

  // Find unused rules
  const unusedRules = rules.filter(rule => {
    const meta = metadata.get(rule);
    return meta && meta.usageCount === 0 && !meta.isEntry;
  });

  return {
    rules,
    dependencies,
    metadata,
    unusedRules,
    entryRule,
    hasLeftRecursion: leftRecursiveRules.length > 0,
    leftRecursiveRules,
  };
}

/**
 * Get suggestions for improving a grammar
 */
export interface GrammarSuggestion {
  type: 'warning' | 'info' | 'error';
  rule?: string;
  message: string;
  fix?: string;
}

export function getGrammarSuggestions(analysis: GrammarAnalysis): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];

  // Unused rules
  if (analysis.unusedRules.length > 0) {
    analysis.unusedRules.forEach(rule => {
      suggestions.push({
        type: 'warning',
        rule,
        message: `Rule "${rule}" is defined but never used`,
        fix: 'Consider removing this rule or referencing it from another rule',
      });
    });
  }

  // Left recursion
  if (analysis.hasLeftRecursion) {
    analysis.leftRecursiveRules.forEach(rule => {
      suggestions.push({
        type: 'info',
        rule,
        message: `Rule "${rule}" has left recursion (intentional for operator precedence)`,
        fix: 'Left recursion is valid in Ohm.js for defining precedence',
      });
    });
  }

  // Complex rules
  analysis.metadata.forEach((meta, rule) => {
    if (meta.complexity > 10) {
      suggestions.push({
        type: 'info',
        rule,
        message: `Rule "${rule}" is complex (score: ${meta.complexity})`,
        fix: 'Consider breaking this rule into smaller sub-rules for clarity',
      });
    }
  });

  // No entry rule
  if (!analysis.entryRule && analysis.rules.length > 0) {
    suggestions.push({
      type: 'warning',
      message: 'No entry rule detected',
      fix: 'The first rule should be your grammar entry point',
    });
  }

  return suggestions;
}

