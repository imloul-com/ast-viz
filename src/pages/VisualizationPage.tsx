import React, { useEffect, useState, useRef } from 'react';
import { useGrammar } from '@/context/GrammarContext';
import { VisualizationInputCard } from '@/pages/components/VisualizationInputCard';
import { VisualizationTreeContent } from '@/pages/components/VisualizationTreeContent';
import { VisualizationJsonContent } from '@/pages/components/VisualizationJsonContent';
import { MobileVisualizationLayout } from '@/pages/components/MobileVisualizationLayout';
import { DesktopVisualizationLayout } from '@/pages/components/DesktopVisualizationLayout';

const VisualizationPage: React.FC = () => {
  const {
    ast,
    optimizedTree,
    fullTree,
    error,
    programText,
    setProgramText,
    parseGrammar,
    grammar,
    getGrammarAsText,
    fullNodeCount,
    optimizedNodeCount,
  } = useGrammar();

  const [optimizeEnabled, setOptimizeEnabled] = useState(true);
  const tree = optimizeEnabled ? optimizedTree : fullTree;

  const [inputFocused, setInputFocused] = useState(false);
  const [isInputPanelCollapsed, setIsInputPanelCollapsed] = useState(false);
  const [autoParseEnabled, setAutoParseEnabled] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<{ startIdx: number; endIdx: number } | null>(null);
  const inputPanelRef = useRef<any>(null);
  const panelGroupContainerRef = useRef<HTMLDivElement>(null);
  const [panelGroupWidth, setPanelGroupWidth] = useState(window.innerWidth);

  useEffect(() => {
    const el = panelGroupContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setPanelGroupWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const leftPanelMinSize = Math.min(50, (600 / panelGroupWidth) * 100);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const grammarText = getGrammarAsText();
    if (!autoParseEnabled || !programText.trim() || !grammarText.trim()) {
      setIsParsing(false);
      return;
    }

    setIsParsing(true);
    const timeoutId = setTimeout(() => {
      parseGrammar();
      setIsParsing(false);
    }, 600);

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

  const inputContent = (
    <VisualizationInputCard
      error={error}
      inputFocused={inputFocused}
      isParsing={isParsing}
      autoParseEnabled={autoParseEnabled}
      onAutoParseChange={setAutoParseEnabled}
      programLineCount={programLineCount}
      programText={programText}
      ast={ast}
      onProgramTextChange={setProgramText}
      onFocus={() => setInputFocused(true)}
      onBlur={() => setInputFocused(false)}
      selectedInterval={selectedInterval}
      onParse={handleParse}
    />
  );

  const treeContent = (
    <VisualizationTreeContent
      tree={tree}
      optimizeEnabled={optimizeEnabled}
      fullNodeCount={fullNodeCount}
      optimizedNodeCount={optimizedNodeCount}
      onToggleOptimize={handleToggleOptimize}
      onNodeClick={setSelectedInterval}
      hasError={Boolean(error)}
    />
  );

  const jsonContent = <VisualizationJsonContent ast={ast} hasError={Boolean(error)} />;

  if (isMobile) {
    return (
      <MobileVisualizationLayout
        inputContent={inputContent}
        treeContent={treeContent}
        jsonContent={jsonContent}
        showAutoParseNote={autoParseEnabled}
      />
    );
  }

  return (
    <DesktopVisualizationLayout
      panelGroupContainerRef={panelGroupContainerRef}
      inputPanelRef={inputPanelRef}
      leftPanelMinSize={leftPanelMinSize}
      isInputPanelCollapsed={isInputPanelCollapsed}
      setIsInputPanelCollapsed={setIsInputPanelCollapsed}
      onToggleInputPanel={handleToggleInputPanel}
      inputContent={inputContent}
      treeContent={treeContent}
      jsonContent={jsonContent}
      showAutoParseNote={autoParseEnabled}
    />
  );
};

export default VisualizationPage;
