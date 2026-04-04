import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Braces, GripVertical, Network, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface DesktopVisualizationLayoutProps {
  panelGroupContainerRef: React.RefObject<HTMLDivElement | null>;
  inputPanelRef: React.RefObject<any>;
  leftPanelMinSize: number;
  isInputPanelCollapsed: boolean;
  setIsInputPanelCollapsed: (value: boolean) => void;
  onToggleInputPanel: () => void;
  inputContent: React.ReactNode;
  treeContent: React.ReactNode;
  jsonContent: React.ReactNode;
  showAutoParseNote: boolean;
}

export const DesktopVisualizationLayout: React.FC<DesktopVisualizationLayoutProps> = ({
  panelGroupContainerRef,
  inputPanelRef,
  leftPanelMinSize,
  isInputPanelCollapsed,
  setIsInputPanelCollapsed,
  onToggleInputPanel,
  inputContent,
  treeContent,
  jsonContent,
  showAutoParseNote,
}) => {
  return (
    <main className="flex-1 overflow-hidden">
      <div ref={panelGroupContainerRef} className="h-full">
        <PanelGroup direction="horizontal">
          <Panel
            ref={inputPanelRef}
            defaultSize={30}
            minSize={leftPanelMinSize}
            maxSize={50}
            collapsible
            onCollapse={() => setIsInputPanelCollapsed(true)}
            onExpand={() => setIsInputPanelCollapsed(false)}
          >
            <div className="h-full flex flex-col overflow-hidden p-4 gap-3">
              {inputContent}
              {showAutoParseNote && (
                <p className="text-xs text-muted-foreground flex-none">
                  Auto-parse active: tree updates as you type (600ms debounce).
                </p>
              )}
            </div>
          </Panel>

          <PanelResizeHandle
            className={`transition-all relative group ${
              isInputPanelCollapsed
                ? 'w-3 bg-border/60 hover:bg-primary/40 cursor-col-resize'
                : 'w-1 bg-border hover:bg-primary/50'
            }`}
          >
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded p-1 transition-opacity ${
                isInputPanelCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </PanelResizeHandle>

          <Panel defaultSize={70} minSize={30}>
            <div className="h-full overflow-hidden p-4 flex flex-col gap-3">
              <Tabs defaultValue="tree" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between flex-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleInputPanel}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    title={isInputPanelCollapsed ? 'Show Input Panel' : 'Hide Input Panel'}
                  >
                    {isInputPanelCollapsed ? (
                      <>
                        <PanelLeftOpen className="h-4 w-4" />
                        <span className="text-xs">Show Input</span>
                      </>
                    ) : (
                      <>
                        <PanelLeftClose className="h-4 w-4" />
                        <span className="text-xs">Hide Input</span>
                      </>
                    )}
                  </Button>

                  <TabsList className="w-fit">
                    <TabsTrigger value="tree" className="gap-1.5">
                      <Network className="h-4 w-4" />
                      Tree
                    </TabsTrigger>
                    <TabsTrigger value="json" className="gap-1.5">
                      <Braces className="h-4 w-4" />
                      JSON
                    </TabsTrigger>
                  </TabsList>

                  <div className="w-[100px]" />
                </div>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="tree" className="h-full m-0">
                    {treeContent}
                  </TabsContent>
                  <TabsContent value="json" className="h-full m-0">
                    {jsonContent}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </main>
  );
};
