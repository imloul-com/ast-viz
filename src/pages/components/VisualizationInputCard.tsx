import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SyntaxHighlightedEditor } from '@/components/SyntaxHighlightedEditor';
import { Switch } from '@/components/ui/switch';
import type { ASTNode } from '@/types/ast';
import { AlertCircle, Loader2, Play } from 'lucide-react';

interface VisualizationInputCardProps {
  error: string | null;
  inputFocused: boolean;
  isParsing: boolean;
  autoParseEnabled: boolean;
  onAutoParseChange: (checked: boolean) => void;
  programLineCount: number;
  programText: string;
  ast: ASTNode | null;
  onProgramTextChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  selectedInterval: { startIdx: number; endIdx: number } | null;
  onParse: () => void;
}

export const VisualizationInputCard: React.FC<VisualizationInputCardProps> = ({
  error,
  inputFocused,
  isParsing,
  autoParseEnabled,
  onAutoParseChange,
  programLineCount,
  programText,
  ast,
  onProgramTextChange,
  onFocus,
  onBlur,
  selectedInterval,
  onParse,
}) => {
  return (
    <Card
      className={`border transition-colors flex flex-col flex-1 min-h-0 ${
        error ? 'border-red-500' : inputFocused ? 'border-primary' : isParsing ? 'border-yellow-500/50' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Program Text</CardTitle>
            {isParsing && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <Switch
                checked={autoParseEnabled}
                onCheckedChange={onAutoParseChange}
                aria-label="Toggle auto-parse"
              />
              <span className="text-xs text-muted-foreground">Auto-parse</span>
            </label>
            <span className="text-xs text-muted-foreground">{programLineCount} lines</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 min-h-0 flex flex-col gap-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-mono whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`flex-1 min-h-0 border rounded-md bg-muted/30 overflow-hidden ${
            inputFocused ? 'border-primary' : error ? 'border-red-300 dark:border-red-800' : ''
          }`}
        >
          <SyntaxHighlightedEditor
            value={programText}
            ast={ast}
            onChange={onProgramTextChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Enter text to parse..."
            className="w-full h-full"
            selectedInterval={selectedInterval}
          />
        </div>

        {!autoParseEnabled && (
          <Button onClick={onParse} className="w-full gap-2" size="lg">
            <Play className="h-4 w-4" />
            Parse
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
