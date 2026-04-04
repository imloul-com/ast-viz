import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertCircle, Network, Share2, Copy, Check, Undo2, Redo2, Zap, Code2, BookOpen } from 'lucide-react';
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
    getGrammarAsText,
  } = useGrammar();

  const [grammarValidation, setGrammarValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    const grammarText = getGrammarAsText();
    if (!grammarText.trim()) {
      setGrammarValidation(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const validation = validateGrammar(grammarText);
      setGrammarValidation(validation);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [grammar, getGrammarAsText]);

  const handleExampleSelect = (exampleId: string) => {
    const example = exampleGrammars.find((ex) => ex.id === exampleId);
    if (example) {
      loadExample(example);
    }
  };

  const handleContinue = () => {
    const grammarText = getGrammarAsText();
    if (grammarValidation?.valid || grammarText.trim()) {
      navigate('/visualize');
    }
  };

  const handleShare = () => {
    const grammarText = getGrammarAsText();
    const url = encodeStateToUrl({
      grammar: grammarText,
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

  const grammarText = getGrammarAsText();
  const grammarLineCount = grammarText.split('\n').length;

  const navItems = [
    { path: '/grammar/code', label: 'Code', icon: Code2 },
    { path: '/grammar/dependencies', label: 'Dependencies', icon: Network },
    { path: '/grammar/suggestions', label: 'Suggestions', icon: Zap },
  ];
  const isCodeTab = location.pathname === '/grammar/code';

  const headerActions = document.getElementById('header-actions');

  return (
    <>
      {headerActions && createPortal(
        <>
          <div className="flex items-center gap-1 hd:mr-2 hd:border-r hd:pr-2">
            <Button
              onClick={undo}
              size="sm"
              variant="ghost"
              className="gap-1 px-2 hd:px-3"
              disabled={!canUndo}
              title="Undo (Cmd/Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4 shrink-0" />
              <span className="hidden hd:inline">Undo</span>
            </Button>
            <Button
              onClick={redo}
              size="sm"
              variant="ghost"
              className="gap-1 px-2 hd:px-3"
              disabled={!canRedo}
              title="Redo (Cmd/Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4 shrink-0" />
              <span className="hidden hd:inline">Redo</span>
            </Button>
          </div>
          <Button
            onClick={() => setShowTutorial(true)}
            size="sm"
            variant="ghost"
            className="gap-1 px-2 hd:px-3"
            title="Tutorial"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="hidden hd:inline">Tutorial</span>
          </Button>
          <Button
            onClick={handleShare}
            size="sm"
            variant="ghost"
            className="gap-1.5 px-2 hd:px-3"
            disabled={!grammarText.trim()}
            title="Share"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span className="hidden hd:inline">Share</span>
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!grammarText.trim()}
            className="gap-1.5 px-3 hd:px-4 font-semibold"
            title="Visualize"
          >
            <span className="hidden hd:inline">Visualize</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Button>
        </>,
        headerActions
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden container mx-auto px-4 py-3 gap-3">
          {error && (
            <Alert variant="destructive" className="flex-none">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 sm:gap-3 flex-none">
            <label className="hidden sm:block text-sm font-medium text-muted-foreground whitespace-nowrap">
              Example:
            </label>
            <Select onValueChange={handleExampleSelect}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose an example grammar..." />
              </SelectTrigger>
              <SelectContent>
                {exampleGrammars.map((example) => (
                  <SelectItem key={example.id} value={example.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{example.name}</span>
                      <span className="hidden sm:inline text-xs text-muted-foreground">- {example.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className={`${isCodeTab ? 'w-full h-fit' : 'flex-1 min-h-0'} flex flex-col overflow-hidden border transition-colors ${
            grammarValidation?.valid ? 'border-good/50' :
            grammarValidation?.error ? 'border-bad/50' : ''
          }`}>
            <CardHeader className="pb-2 flex-none px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="hidden sm:block text-base">Ohm.js Grammar</CardTitle>
                <div className="flex items-center gap-2" role="status" aria-live="polite">
                  {grammarValidation?.valid && (
                    <span className="text-xs text-good">
                      Valid
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {grammarLineCount} lines
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className={`pt-2 ${isCodeTab ? '' : 'flex-1 min-h-0'} flex flex-col overflow-hidden gap-3 px-3 sm:px-6`}>
              <div className="flex border-b flex-none">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors
                        border-b-2 -mb-[1px]
                        ${isActive
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                        }
                      `}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.label === 'Dependencies' ? 'Deps' : item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className={`${isCodeTab ? '' : 'flex-1 min-h-0'} flex flex-col overflow-hidden`}>
                <Outlet />
              </div>

              {grammarValidation?.error && (
                <Alert variant="destructive" aria-live="assertive" className="flex-none">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{grammarValidation.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {showTutorial && <GrammarTutorial onClose={() => setShowTutorial(false)} />}

        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share Grammar</DialogTitle>
              <DialogDescription>
                Share a snapshot of your grammar with others.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                    className="gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
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

              <p className="text-xs text-muted-foreground">
                All data is encoded in the URL -- nothing is stored on a server.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
};

export default GrammarEditorLayout;
