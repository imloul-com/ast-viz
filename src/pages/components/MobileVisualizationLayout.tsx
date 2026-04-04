import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Braces, Network, Play } from 'lucide-react';

interface MobileVisualizationLayoutProps {
  inputContent: React.ReactNode;
  treeContent: React.ReactNode;
  jsonContent: React.ReactNode;
  showAutoParseNote: boolean;
}

export const MobileVisualizationLayout: React.FC<MobileVisualizationLayoutProps> = ({
  inputContent,
  treeContent,
  jsonContent,
  showAutoParseNote,
}) => {
  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      <Tabs defaultValue="input" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-2 flex-none">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="input" className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Input
            </TabsTrigger>
            <TabsTrigger value="tree" className="gap-1.5">
              <Network className="h-3.5 w-3.5" />
              Tree
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-1.5">
              <Braces className="h-3.5 w-3.5" />
              JSON
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden mt-2">
          <TabsContent value="input" className="h-full m-0 overflow-hidden">
            <div className="h-full flex flex-col p-3 gap-3">
              {inputContent}
              {showAutoParseNote && (
                <p className="text-xs text-muted-foreground flex-none">
                  Auto-parse active: tree updates as you type (600ms debounce).
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tree" className="h-full m-0 overflow-hidden p-3">
            {treeContent}
          </TabsContent>

          <TabsContent value="json" className="h-full m-0 overflow-hidden p-3">
            {jsonContent}
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
};
