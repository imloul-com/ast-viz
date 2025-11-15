import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ModifierInfo {
  symbol: string;
  name: string;
  description: string;
  example: string;
  exampleDesc: string;
  category: 'repetition' | 'lookahead' | 'alternative';
}

const modifiers: ModifierInfo[] = [
  {
    symbol: '+',
    name: 'One or More',
    category: 'repetition',
    description: 'Modifies a token to match it one or more times',
    example: 'digit → digit+',
    exampleDesc: 'Matches: 5, 42, 123',
  },
  {
    symbol: '*',
    name: 'Zero or More',
    category: 'repetition',
    description: 'Modifies a token to match it zero or more times',
    example: 'letter → letter*',
    exampleDesc: 'Matches: "", a, abc, hello',
  },
  {
    symbol: '?',
    name: 'Optional',
    category: 'repetition',
    description: 'Makes a token optional (matches 0 or 1 times)',
    example: 'sign → sign?',
    exampleDesc: 'Matches: +, -, or nothing',
  },
  {
    symbol: '~',
    name: 'Not (Lookahead)',
    category: 'lookahead',
    description: 'Modifies a token to exclude a pattern',
    example: '~"," any',
    exampleDesc: 'Any character except comma',
  },
  {
    symbol: '&',
    name: 'And (Lookahead)',
    category: 'lookahead',
    description: 'Checks if pattern matches ahead without consuming',
    example: '&digit',
    exampleDesc: 'Checks for digit ahead',
  },
  {
    symbol: '|',
    name: 'Or (Alternative)',
    category: 'alternative',
    description: 'Separates alternative patterns (not applied to tokens)',
    example: 'digit | letter',
    exampleDesc: 'Matches: 5 or a',
  },
];

interface OperatorGuideProps {
  onAddOperator?: (operator: string) => void;
  compact?: boolean;
}

export const OperatorGuide: React.FC<OperatorGuideProps> = ({
  onAddOperator: _onAddOperator,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (compact && !isExpanded) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-sm hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Token Modifiers Reference
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              +, *, ?, ~, &, |
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="p-4 pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                🎯 Token Modifiers Reference
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Hover over any chip to apply these modifiers
              </p>
            </div>
          </div>
          {compact && (
            <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          )}
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modifiers.map((mod) => (
            <div
              key={mod.symbol}
              className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <code className={`text-xl font-bold px-2 py-0.5 rounded ${
                    mod.category === 'repetition' 
                      ? 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950' 
                      : mod.category === 'lookahead'
                      ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950'
                      : 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950'
                  }`}>
                    {mod.symbol}
                  </code>
                  <div>
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 block">
                      {mod.name}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {mod.category}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {mod.description}
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 rounded p-2 border border-slate-200 dark:border-slate-800">
                <code className="text-xs font-mono text-purple-700 dark:text-purple-300">
                  {mod.example}
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  {mod.exampleDesc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Collapse guide
          </button>
        )}
      </CardContent>
    </Card>
  );
};

