import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary from '@/components/ErrorBoundary';
import TreeView from '@/components/TreeView';
import JsonView from '@/components/JsonView';
import { SyntaxHighlightedEditor } from '@/components/SyntaxHighlightedEditor';
import { useGrammar } from '@/context/GrammarContext';
import { Braces, Network, FileText, Play, AlertCircle, PanelLeftClose, PanelLeftOpen, GripVertical, Zap, ZapOff, Loader2 } from 'lucide-react';

const VisualizationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    ast,
    tree,
    error,
    optimizeEnabled,
    setOptimizeEnabled,
    programText,
    setProgramText,
    parseGrammar,
    grammar,
    fullNodeCount,
    optimizedNodeCount,
  } = useGrammar();

  const [inputFocused, setInputFocused] = useState(false);
  const [isInputPanelCollapsed, setIsInputPanelCollapsed] = useState(false);
  const [autoParseEnabled, setAutoParseEnabled] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<{ startIdx: number; endIdx: number } | null>(null);
  const inputPanelRef = useRef<any>(null);

  // Redirect back if no grammar is defined
  useEffect(() => {
    if (!grammar.trim()) {
      navigate('/grammar/builder');
    }
  }, [grammar, navigate]);

  // Auto-parse on programText change with debounce
  useEffect(() => {
    if (!autoParseEnabled || !programText.trim() || !grammar.trim()) {
      setIsParsing(false);
      return;
    }

    setIsParsing(true);
    const timeoutId = setTimeout(() => {
      parseGrammar();
      setIsParsing(false);
    }, 600); // 600ms debounce

    return () => {
      clearTimeout(timeoutId);
      setIsParsing(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programText, autoParseEnabled, grammar]);

  const handleToggleOptimize = () => {
    setOptimizeEnabled(!optimizeEnabled);
  };

  const handleParse = () => {
    parseGrammar();
  };

  const handleToggleInputPanel = () => {
    if (inputPanelRef.current) {
      if (isInputPanelCollapsed) {
        inputPanelRef.current.expand();
      } else {
        inputPanelRef.current.collapse();
      }
      setIsInputPanelCollapsed(!isInputPanelCollapsed);
    }
  };

  const programLineCount = programText.split('\n').length;

  return (
    <>
      {/* Content - Resizable Split View */}
      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Input */}
          <Panel
            ref={inputPanelRef}
            defaultSize={30}
            minSize={20}
            maxSize={50}
            collapsible={true}
            onCollapse={() => setIsInputPanelCollapsed(true)}
            onExpand={() => setIsInputPanelCollapsed(false)}
          >
            <div className="h-full bg-background/50 overflow-auto p-4 space-y-4">

          {/* Program Text Input */}
          <Card className={`border-2 transition-all duration-300 ${
            error ? 'border-red-500 shadow-lg ring-2 ring-red-500/20' :
            inputFocused ? 'border-primary shadow-lg ring-2 ring-primary/20' : 
            isParsing ? 'border-yellow-500/50' :
            'border-muted hover:border-primary/30'
          }`}>
            <CardHeader className="pb-3 bg-gradient-to-r from-green-500/5 to-teal-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-base">Program Text</CardTitle>
                  {isParsing && (
                    <Loader2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={autoParseEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoParseEnabled(!autoParseEnabled)}
                    className="gap-1.5 h-7"
                    title={autoParseEnabled ? "Auto-parse enabled" : "Auto-parse disabled"}
                  >
                    {autoParseEnabled ? (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span className="text-xs">Auto</span>
                      </>
                    ) : (
                      <>
                        <ZapOff className="h-3.5 w-3.5" />
                        <span className="text-xs">Manual</span>
                      </>
                    )}
                  </Button>
                  <span className="px-2 py-1 bg-background rounded-md border text-xs text-muted-foreground">
                    {programLineCount} lines
                  </span>
                </div>
              </div>
              <CardDescription className="text-sm">
                {autoParseEnabled 
                  ? "Type to see real-time updates (auto-parse enabled)"
                  : "Manual mode - click Parse button to update"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-mono whitespace-pre-wrap">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div
                className={`border-2 rounded-md bg-slate-50 dark:bg-slate-950 transition-colors ${
                  inputFocused ? 'border-primary' : error ? 'border-red-300 dark:border-red-800' : 'border-input'
                }`}
                style={{ minHeight: '200px', height: '200px' }}
              >
                <SyntaxHighlightedEditor
                  value={programText}
                  ast={ast}
                  onChange={setProgramText}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Enter text to parse..."
                  className="h-full"
                  selectedInterval={selectedInterval}
                />
              </div>
              
              {!autoParseEnabled && (
                <Button 
                  onClick={handleParse} 
                  className="w-full gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  size="lg"
                >
                  <Play className="h-4 w-4" />
                  Parse & Visualize
                </Button>
              )}
            </CardContent>
          </Card>

              {/* Hint Card */}
              <Card className={`border-2 ${
                autoParseEnabled 
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              }`}>
                <CardContent className="pt-4">
                  {autoParseEnabled ? (
                    <p className="text-xs text-green-900 dark:text-green-100">
                      <Zap className="h-3.5 w-3.5 inline mr-1" />
                      <strong>Auto-parse active:</strong> The tree updates as you type (600ms debounce)
                    </p>
                  ) : (
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      💡 <strong>Tip:</strong> Enable auto-parse for real-time updates, or use manual mode for more control.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors relative group">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </PanelResizeHandle>

          {/* Right Panel - Visualization */}
          <Panel defaultSize={70} minSize={30}>
            <div className="h-full overflow-hidden p-4 relative">
              {/* Toggle Panel Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleInputPanel}
                className="absolute top-4 left-4 z-10 gap-2"
                title={isInputPanelCollapsed ? "Show Input Panel" : "Hide Input Panel"}
              >
                {isInputPanelCollapsed ? (
                  <>
                    <PanelLeftOpen className="h-4 w-4" />
                    Show Input
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    Hide Input
                  </>
                )}
              </Button>

              <Tabs defaultValue="tree" className="h-full flex flex-col">
                <TabsList className="w-fit mx-auto">
                  <TabsTrigger value="tree" className="gap-2">
                    <Network className="h-4 w-4" />
                    Tree View
                  </TabsTrigger>
                  <TabsTrigger value="json" className="gap-2">
                    <Braces className="h-4 w-4" />
                    JSON View
                  </TabsTrigger>
                </TabsList>
            
            <div className="flex-1 mt-4 overflow-hidden">
              <TabsContent value="tree" className="h-full m-0">
                {tree ? (
                  <div className="relative h-full flex flex-col">
                    {/* Info Banner */}
                    <Alert className="mb-3 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
                        <strong>Naming convention:</strong> <span className="font-mono text-blue-600 dark:text-blue-400">Uppercase</span> rules (e.g., Expression, Statement) appear in the tree. <span className="font-mono text-slate-600 dark:text-slate-400">lowercase</span> rules (e.g., identifier, number) are lexical tokens, hidden from visualization.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex-1 overflow-hidden">
                      <ErrorBoundary fallbackTitle="Tree View Error">
                        <TreeView
                          data={tree}
                          optimizeEnabled={optimizeEnabled}
                          fullNodeCount={fullNodeCount}
                          optimizedNodeCount={optimizedNodeCount}
                          onToggleOptimize={handleToggleOptimize}
                          onNodeClick={setSelectedInterval}
                        />
                      </ErrorBoundary>
                    </div>
                    {error && (
                      <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-50 dark:bg-yellow-950/50 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg px-4 py-2 shadow-lg">
                        <p className="text-xs text-yellow-900 dark:text-yellow-100 font-medium">
                          ⚠️ Showing last valid parse
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Network className="h-16 w-16 mx-auto opacity-20" />
                      <p className="text-lg font-medium">No AST to display</p>
                      <p className="text-sm">Enter program text and parse to see the tree</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="json" className="h-full m-0">
                {ast ? (
                  <div className="relative h-full">
                    <ErrorBoundary fallbackTitle="JSON View Error">
                      <JsonView data={ast} />
                    </ErrorBoundary>
                    {error && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-50 dark:bg-yellow-950/50 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg px-4 py-2 shadow-lg z-10">
                        <p className="text-xs text-yellow-900 dark:text-yellow-100 font-medium">
                          ⚠️ Showing last valid parse
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Braces className="h-16 w-16 mx-auto opacity-20" />
                      <p className="text-lg font-medium">No AST to display</p>
                      <p className="text-sm">Enter program text and parse to see the JSON</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
            </div>
          </Panel>
        </PanelGroup>
      </main>
    </>
  );
};

export default VisualizationPage;

