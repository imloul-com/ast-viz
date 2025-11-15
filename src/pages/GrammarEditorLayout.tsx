import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Code2, Sparkles, Lightbulb, CheckCircle2, Wand2, AlertCircle, Network, BookOpen, Zap, Share2, Copy, Check, Undo2, Redo2 } from 'lucide-react';
import { useGrammar } from '@/context/GrammarContext';
import { exampleGrammars } from '@/data/examples';
import { validateGrammar } from '@/lib/parser';
import { GrammarTutorial } from '@/components/GrammarTutorial';
import { encodeStateToUrl } from '@/lib/shareUtils';
import { Input } from '@/components/ui/input';

const GrammarEditorLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    grammar,
    programText,
    error,
    loadExample,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useGrammar();

  const [grammarValidation, setGrammarValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Validate grammar in real-time
  useEffect(() => {
    if (!grammar.trim()) {
      setGrammarValidation(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const validation = validateGrammar(grammar);
      setGrammarValidation(validation);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [grammar]);

  const handleExampleSelect = (exampleId: string) => {
    const example = exampleGrammars.find((ex) => ex.id === exampleId);
    if (example) {
      loadExample(example);
      // Navigate to visualization page after loading example
      setTimeout(() => navigate('/visualize'), 100);
    }
  };

  const handleContinue = () => {
    if (grammarValidation?.valid || grammar.trim()) {
      navigate('/visualize');
    }
  };

  const handleShare = () => {
    const url = encodeStateToUrl({
      grammar,
      programText: programText || undefined,
    });
    setShareUrl(url);
    setShowShareModal(true);
    setCopied(false);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const grammarLineCount = grammar.split('\n').length;

  // Define navigation items
  const navItems = [
    { path: '/grammar/builder', label: 'Visual Builder', icon: Wand2 },
    { path: '/grammar/code', label: 'Code Editor', icon: Code2 },
    { path: '/grammar/dependencies', label: 'Dependencies', icon: Network },
    { path: '/grammar/suggestions', label: 'Suggestions', icon: Zap },
  ];

  // Render header actions via portal
  const headerActions = document.getElementById('header-actions');

  return (
    <>
      {/* Portal: Render actions into header */}
      {headerActions && createPortal(
        <>
          <div className="flex items-center gap-1 mr-2 border-r pr-2">
            <Button
              onClick={undo}
              size="sm"
              variant="ghost"
              className="gap-1"
              disabled={!canUndo}
              title="Undo (Cmd/Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
            <Button
              onClick={redo}
              size="sm"
              variant="ghost"
              className="gap-1"
              disabled={!canRedo}
              title="Redo (Cmd/Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
              Redo
            </Button>
          </div>
          <Button
            onClick={() => setShowTutorial(true)}
            size="sm"
            variant="ghost"
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Tutorial
          </Button>
          <Button
            onClick={handleShare}
            size="sm"
            variant="ghost"
            className="gap-2"
            disabled={!grammar.trim()}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            onClick={handleContinue}
            size="sm"
            className="gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20"
            disabled={!grammar.trim()}
          >
            Visualize
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>,
        headerActions
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Example Selector */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-base">Example Grammars</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Load a pre-defined grammar to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Select onValueChange={handleExampleSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an example grammar..." />
                </SelectTrigger>
                <SelectContent>
                  {exampleGrammars.map((example) => (
                    <SelectItem key={example.id} value={example.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{example.name}</span>
                        <span className="text-xs text-muted-foreground">- {example.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Grammar Input */}
          <Card className={`border-2 transition-all duration-300 ${
            grammarValidation?.valid ? 'border-green-500/50' :
            grammarValidation?.error ? 'border-red-500/50' : 'border-muted hover:border-primary/30'
          }`}>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-base">Ohm.js Grammar</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {grammarValidation?.valid && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-md">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Valid
                    </div>
                  )}
                  <span className="px-2 py-1 bg-background rounded-md border text-xs text-muted-foreground">
                    {grammarLineCount} lines
                  </span>
                </div>
              </div>
              <CardDescription className="text-sm flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                Define your grammar rules - validation happens in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* Navigation Links */}
              <div className="flex border-b">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
                        border-b-2 -mb-[1px]
                        ${isActive 
                          ? 'border-primary text-primary bg-primary/5' 
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>

              {/* Outlet for nested routes */}
              <Outlet />

              {grammarValidation?.error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{grammarValidation.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tutorial Modal */}
        {showTutorial && <GrammarTutorial onClose={() => setShowTutorial(false)} />}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-2 shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <Share2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Share Your Grammar</CardTitle>
                    <CardDescription>
                      Share a snapshot of your grammar with others
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Shareable Link</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    onClick={handleCopyUrl}
                    variant={copied ? "default" : "outline"}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  This creates a snapshot of your current grammar{programText ? ' and program text' : ''}. 
                  Recipients can view and make their own edits, but changes won't sync between users.
                  All data is encoded in the URL - nothing is stored on a server.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => setShowShareModal(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </main>
    </>
  );
};

export default GrammarEditorLayout;

