import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { TreeNode } from '@/types/ast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Shrink } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { convertToCytoscape } from '@/components/tree-view/treeViewUtils';
import { createTreeStylesheet } from '@/components/tree-view/treeViewStyles';
import { TreeLegend } from '@/components/tree-view/TreeLegend';
import { TreeTooltip } from '@/components/tree-view/TreeTooltip';
import { SelectedNodePanel } from '@/components/tree-view/SelectedNodePanel';

cytoscape.use(dagre);

interface TreeViewProps {
  data: TreeNode | null;
  optimizeEnabled: boolean;
  fullNodeCount: number;
  optimizedNodeCount: number;
  onToggleOptimize: () => void;
  onNodeClick?: (interval: { startIdx: number; endIdx: number } | null) => void;
}


const TreeView: React.FC<TreeViewProps> = ({ 
  data, 
  optimizeEnabled, 
  fullNodeCount, 
  optimizedNodeCount, 
  onToggleOptimize, 
  onNodeClick 
}) => {
  const [elements, setElements] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{ name: string; fullName: string; value: string; fullValue: string } | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({
    visible: false, x: 0, y: 0, text: '',
  });
  const cyRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const isDark = useIsDarkMode();

  const nodeCount = optimizeEnabled ? optimizedNodeCount : fullNodeCount;
  const compressionPercent = fullNodeCount > 0 
    ? Math.round(((fullNodeCount - optimizedNodeCount) / fullNodeCount) * 100) 
    : 0;

  useEffect(() => {
    if (!data) {
      setElements([]);
      isInitializedRef.current = false;
      return;
    }

    const { nodes, edges } = convertToCytoscape(data);
    setElements([...nodes, ...edges]);
    isInitializedRef.current = false;
  }, [data]);

  const stylesheet = useMemo(() => createTreeStylesheet(isDark), [isDark]);

  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.zoom(cy.zoom() * 1.2);
      cy.center();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.zoom(cy.zoom() * 0.8);
      cy.center();
    }
  }, []);

  const handleReset = useCallback(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.resize();
      if (cy.elements().length > 0) {
        cy.fit(cy.elements(), 30);
      }
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await cardRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        if (cyRef.current && cyRef.current.elements().length > 0) {
          cyRef.current.fit(cyRef.current.elements(), 30);
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Tree Visualization</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-4rem)] text-muted-foreground text-sm">
          No tree data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={cardRef} className="h-full flex flex-col">
      <CardHeader className="flex-none pb-2 px-3 sm:px-6">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <CardTitle className="text-base">Tree Visualization</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {optimizeEnabled ? (
                <>
                  Optimized: <strong>{nodeCount}</strong> nodes (from {fullNodeCount}, {compressionPercent}% compression)
                </>
              ) : (
                <>
                  Full tree: <strong>{nodeCount}</strong> nodes
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant={optimizeEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggleOptimize}
              className="gap-1.5 h-8"
              title={optimizeEnabled ? 'Optimized view' : 'Full view'}
            >
              <Minimize2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{optimizeEnabled ? 'Optimized' : 'Full'}</span>
            </Button>
            <div className="border-l mx-0.5 h-5" />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="Fit to Screen">
              <Shrink className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div className="w-full h-full bg-muted/30">
          <CytoscapeComponent
            elements={elements}
            cy={(cy) => {
              cyRef.current = cy;
              
              if (isInitializedRef.current) return;
              isInitializedRef.current = true;
              
              cy.on('tap', 'node', (event: any) => {
                const node = event.target;
                const nodeData = node.data();
                setSelectedNode({
                  name: nodeData.label,
                  fullName: nodeData.fullName,
                  value: nodeData.valueLabel || '(no value)',
                  fullValue: nodeData.fullValue || '(no value)',
                });
                
                if (onNodeClick && nodeData.interval) {
                  onNodeClick(nodeData.interval);
                } else if (onNodeClick) {
                  onNodeClick(null);
                }
              });
              
              cy.on('tap', (event: any) => {
                if (event.target === cy) {
                  setSelectedNode(null);
                  if (onNodeClick) onNodeClick(null);
                }
              });
              
              cy.on('mouseover', 'node[isTruncated = true]', (event: any) => {
                const node = event.target;
                const nodeData = node.data();
                const renderedPosition = node.renderedPosition();
                
                let tooltipText = nodeData.fullName;
                if (nodeData.isCollapsed && nodeData.chainDepth > 1) {
                  tooltipText = `${nodeData.fullName} (${nodeData.chainDepth} nodes collapsed)`;
                }
                
                setTooltip({
                  visible: true,
                  x: renderedPosition.x,
                  y: renderedPosition.y - 30,
                  text: tooltipText,
                });
              });
              
              cy.on('mouseout', 'node[isTruncated = true]', () => {
                setTooltip({ visible: false, x: 0, y: 0, text: '' });
              });
              
              if (elements.length > 0) {
                cy.layout({
                  name: 'dagre',
                  rankDir: 'TB',
                  nodeSep: 20,
                  rankSep: 50,
                  fit: true,
                  padding: 30,
                  animate: false,
                } as any).run();

                setTimeout(() => {
                  if (cy.elements().length > 0) {
                    const bb = cy.elements().boundingBox({});
                    const containerH = cy.height();
                    const containerW = cy.width();
                    // Height capped at 75%, width allowed up to 100%
                    const zoomForHeight = (containerH * 0.75) / bb.h;
                    const zoomForWidth = containerW / bb.w;
                    const targetZoom = Math.min(zoomForHeight, zoomForWidth);
                    cy.zoom(Math.max(targetZoom, cy.minZoom()));
                    cy.center();
                  }
                }, 100);
              }
            }}
            style={{ width: '100%', height: '100%' }}
            stylesheet={stylesheet}
            wheelSensitivity={0.2}
            minZoom={0.1}
            maxZoom={3}
          />
        </div>
        
        <TreeTooltip {...tooltip} />
        <SelectedNodePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        <TreeLegend optimizeEnabled={optimizeEnabled} />
      </CardContent>
    </Card>
  );
};

export default TreeView;
