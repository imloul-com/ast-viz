import React, { useCallback, useState, useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { TreeNode } from '@/types/ast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Shrink } from 'lucide-react';

// Register dagre layout
cytoscape.use(dagre);

interface TreeViewProps {
  data: TreeNode | null;
  optimizeEnabled: boolean;
  fullNodeCount: number;
  optimizedNodeCount: number;
  onToggleOptimize: () => void;
  onNodeClick?: (interval: { startIdx: number; endIdx: number } | null) => void;
}

// Convert TreeNode to Cytoscape elements
const convertToCytoscape = (
  tree: TreeNode,
  parentId: string | null = null,
  nodes: any[] = [],
  edges: any[] = [],
  idCounter = { value: 0 }
): { nodes: any[]; edges: any[] } => {
  const id = `node-${idCounter.value++}`;
  
  // Determine if terminal based on whether it has children
  const hasChildren = tree.children && tree.children.length > 0;
  const isTerminal = !hasChildren;
  // Check for both 'collapsed' and 'collapsed-terminal' types
  const isCollapsed = tree.attributes?.type === 'collapsed' || tree.attributes?.type === 'collapsed-terminal';
  
  // Get node value for display below the node
  const nodeValue = tree.attributes?.value;
  
  // Handle collapsed nodes with special formatting (works for both branch and terminal collapsed nodes)
  let displayName: string;
  let isTruncated = false;
  
  // Check if this is a collapsed node (by type attribute OR by having arrow in name)
  const isCollapsedPath = isCollapsed || tree.name.includes(' → ');
  
  if (isCollapsedPath && tree.name.includes(' → ')) {
    // For collapsed nodes, show only the final node name
    // The color (purple) and bold font indicate it's collapsed
    // Hover shows the full path for complete context
    const pathParts = tree.name.split(' → ');
    const chainDepth = pathParts.length;
    
    // Show final node with subtle indicator of collapse depth
    // e.g., "Term" but stores depth for potential badge/icon
    displayName = pathParts[pathParts.length - 1]; // Just the last node
    isTruncated = chainDepth > 1; // Will show full path on hover
  } else {
    // For regular nodes, truncate long names
    const maxNameLength = 30;
    isTruncated = tree.name.length > maxNameLength;
    displayName = isTruncated 
      ? tree.name.substring(0, maxNameLength - 3) + '...' 
      : tree.name;
  }
  
  // Format value for display below node
  let displayValue = '';
  let fullValue = '';
  if (nodeValue !== undefined && nodeValue !== null) {
    const valueStr = String(nodeValue);
    fullValue = valueStr;
    const maxValueLength = 40;
    displayValue = valueStr.length > maxValueLength 
      ? valueStr.substring(0, maxValueLength - 3) + '...'
      : valueStr;
  }
  
  // Calculate node dimensions based on name only (value will be below)
  const charWidth = 6;
  const padding = 16;
  const width = Math.max(displayName.length * charWidth + padding, 50);
  const height = 28;
  
  // Determine color: collapsed (purple) > terminal (teal) > branch (blue)
  // Collapsed nodes (including collapsed-terminal) should always be purple
  const color = isCollapsed ? '#8b5cf6' : isTerminal ? '#06b6d4' : '#3b82f6';
  
  nodes.push({
    data: {
      id,
      label: displayName,
      fullName: tree.name, // Store full name for tooltip
      isTruncated,
      valueLabel: displayValue,
      fullValue: fullValue, // Store full value for tooltip
      isTerminal,
      isCollapsed,
      color,
      width,
      height,
      interval: tree.interval, // Store interval for source highlighting
      // Store chain depth for potential UI enhancements (badges, etc.)
      chainDepth: tree.name.includes(' → ') ? tree.name.split(' → ').length : 1,
    },
  });

  if (parentId) {
    edges.push({
      data: {
        id: `edge-${parentId}-${id}`,
        source: parentId,
        target: id,
      },
    });
  }

  if (tree.children) {
    tree.children.forEach((child) => {
      convertToCytoscape(child, id, nodes, edges, idCounter);
    });
  }

  return { nodes, edges };
};

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
    visible: false,
    x: 0,
    y: 0,
    text: '',
  });
  const [panelTooltip, setPanelTooltip] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: '',
  });
  const cyRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Use node counts from context (single source of truth)
  const nodeCount = optimizeEnabled ? optimizedNodeCount : fullNodeCount;
  
  // Calculate compression percentage
  const compressionPercent = fullNodeCount > 0 
    ? Math.round(((fullNodeCount - optimizedNodeCount) / fullNodeCount) * 100) 
    : 0;

  // Convert tree data to Cytoscape format
  useEffect(() => {
    if (!data) {
      setElements([]);
      isInitializedRef.current = false;
      return;
    }

    const { nodes, edges } = convertToCytoscape(data);
    setElements([...nodes, ...edges]);
    isInitializedRef.current = false; // Reset flag when data changes
  }, [data]);

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
      // Force Cytoscape to recalculate viewport dimensions
      cy.resize();
      // Fit all nodes to viewport with padding
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
      // Re-fit view when entering/exiting fullscreen
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
          <CardTitle>Tree Visualization</CardTitle>
          <CardDescription>Parse a grammar to see the AST tree</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-5rem)] text-muted-foreground">
          No tree data available. Enter a grammar and program text to visualize the parse tree.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={cardRef} className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tree Visualization</CardTitle>
            <CardDescription>
              {optimizeEnabled ? (
                <span>
                  Optimized tree • <strong>{nodeCount} nodes</strong> (from {fullNodeCount}) • <strong className="text-green-600 dark:text-green-400">{compressionPercent}% compression</strong>
                </span>
              ) : (
                <span>
                  Full tree • <strong>{nodeCount} nodes</strong> (optimized: {optimizedNodeCount})
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={optimizeEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={onToggleOptimize}
              className="gap-2"
            >
              <Minimize2 className="h-4 w-4" />
              {optimizeEnabled ? 'Optimized' : 'Full Tree'}
            </Button>
            <div className="border-l mx-1"></div>
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset} title="Fit to Screen">
              <Shrink className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900">
          <CytoscapeComponent
            elements={elements}
            cy={(cy) => {
              cyRef.current = cy;
              
              // Only initialize event handlers and layout once
              if (isInitializedRef.current) {
                return;
              }
              
              isInitializedRef.current = true;
              
              // Add click handler for nodes
              cy.on('tap', 'node', (event: any) => {
                const node = event.target;
                const nodeData = node.data();
                setSelectedNode({
                  name: nodeData.label,
                  fullName: nodeData.fullName,
                  value: nodeData.valueLabel || '(no value)',
                  fullValue: nodeData.fullValue || '(no value)',
                });
                
                // Emit interval for source code highlighting
                if (onNodeClick && nodeData.interval) {
                  onNodeClick(nodeData.interval);
                } else if (onNodeClick) {
                  onNodeClick(null);
                }
              });
              
              // Click on background to deselect
              cy.on('tap', (event: any) => {
                if (event.target === cy) {
                  setSelectedNode(null);
                  if (onNodeClick) {
                    onNodeClick(null);
                  }
                }
              });
              
              // Add hover handler for truncated nodes (including collapsed chains)
              cy.on('mouseover', 'node[isTruncated = true]', (event: any) => {
                const node = event.target;
                const nodeData = node.data();
                const renderedPosition = node.renderedPosition();
                
                // For collapsed nodes, show full chain path with depth indicator
                let tooltipText = nodeData.fullName;
                if (nodeData.isCollapsed && nodeData.chainDepth > 1) {
                  tooltipText = `${nodeData.fullName} (${nodeData.chainDepth} nodes collapsed)`;
                }
                
                setTooltip({
                  visible: true,
                  x: renderedPosition.x,
                  y: renderedPosition.y - 30, // Position above the node
                  text: tooltipText,
                });
              });
              
              cy.on('mouseout', 'node[isTruncated = true]', () => {
                setTooltip({
                  visible: false,
                  x: 0,
                  y: 0,
                  text: '',
                });
              });
              
              // Apply dagre layout after elements are loaded
              if (elements.length > 0) {
                cy.layout({
                  name: 'dagre',
                  rankDir: 'TB', // Top to bottom
                  nodeSep: 20, // Horizontal spacing between nodes
                  rankSep: 50, // Vertical spacing between ranks (increased for value labels)
                  fit: true,
                  padding: 30,
                  animate: false,
                } as any).run();
                
                // Fit view after layout
                setTimeout(() => {
                  if (cy.elements().length > 0) {
                    cy.fit(cy.elements(), 30);
                  }
                }, 100);
              }
            }}
            style={{ width: '100%', height: '100%' }}
            stylesheet={[
              {
                selector: 'node',
                style: {
                  'background-color': 'data(color)',
                  'label': 'data(label)',
                  'width': 'data(width)',
                  'height': 'data(height)',
                  'shape': 'roundrectangle',
                  'text-valign': 'center',
                  'text-halign': 'center',
                  'color': '#ffffff',
                  'font-size': '12px',
                  'font-weight': 500,
                  'text-wrap': 'none',
                  'text-max-width': '150px',
                  'border-width': 2,
                  'border-color': '#ffffff',
                  'cursor': 'pointer',
                },
              },
              {
                selector: 'node:active',
                style: {
                  'overlay-color': '#3b82f6',
                  'overlay-opacity': 0.3,
                  'overlay-padding': 4,
                },
              },
              // Display value below the node using source-label
              {
                selector: 'node[valueLabel]',
                style: {
                  'source-label': 'data(valueLabel)',
                  'source-text-offset': 25,
                  'source-text-background-color': '#1e293b',
                  'source-text-background-opacity': 0.9,
                  'source-text-background-padding': '3px',
                  'source-text-background-shape': 'roundrectangle',
                  'color': '#e2e8f0',
                  'font-size': '10px',
                },
              },
              {
                selector: 'node[isTerminal = true]',
                style: {
                  'font-size': '11px',
                  'font-weight': 400,
                },
              },
              {
                selector: 'node[isCollapsed = true]',
                style: {
                  'font-weight': 600,
                },
              },
              {
                selector: 'edge',
                style: {
                  'width': 2,
                  'line-color': '#64748b',
                  'target-arrow-color': '#64748b',
                  'target-arrow-shape': 'triangle',
                  'curve-style': 'bezier',
                  'arrow-scale': 1,
                },
              },
            ]}
            wheelSensitivity={0.2}
            minZoom={0.1}
            maxZoom={3}
          />
        </div>
        
        {/* Tooltip for truncated node names */}
        {tooltip.visible && (
          <div
            className="absolute z-50 pointer-events-none bg-slate-100/95 dark:bg-slate-700/95 backdrop-blur-sm text-slate-900 dark:text-slate-100 px-3 py-2 rounded-md shadow-lg border border-slate-300 dark:border-slate-600 text-xs font-mono max-w-lg"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              wordBreak: 'break-word',
            }}
          >
            {tooltip.text}
          </div>
        )}
        
        {/* Selected Node Info Panel - Only show in fullscreen mode */}
        {selectedNode && isFullscreen && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-primary shadow-lg max-w-md animate-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Selected Node</div>
                <div className="relative">
                  <div 
                    className="font-mono text-sm font-medium text-foreground mb-2 break-all hover:bg-accent/50 px-2 py-1 rounded transition-colors cursor-pointer"
                    onMouseEnter={() => setPanelTooltip({ visible: true, text: selectedNode.fullName })}
                    onMouseLeave={() => setPanelTooltip({ visible: false, text: '' })}
                  >
                    {selectedNode.name}
                  </div>
                  {panelTooltip.visible && panelTooltip.text === selectedNode.fullName && (
                    <div className="absolute bottom-full left-0 mb-2 bg-slate-100/95 dark:bg-slate-700/95 backdrop-blur-sm text-slate-900 dark:text-slate-100 px-3 py-2 rounded-md shadow-lg border border-slate-300 dark:border-slate-600 text-xs font-mono max-w-lg z-50 pointer-events-none"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {panelTooltip.text}
                    </div>
                  )}
                </div>
                {selectedNode.value !== '(no value)' && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Value:</div>
                    <div className="relative">
                      <div 
                        className="font-mono text-sm text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 break-all hover:bg-primary/20 transition-colors cursor-pointer"
                        onMouseEnter={() => setPanelTooltip({ visible: true, text: selectedNode.fullValue })}
                        onMouseLeave={() => setPanelTooltip({ visible: false, text: '' })}
                      >
                        {selectedNode.value}
                      </div>
                      {panelTooltip.visible && panelTooltip.text === selectedNode.fullValue && (
                        <div className="absolute bottom-full left-0 mb-2 bg-slate-100/95 dark:bg-slate-700/95 backdrop-blur-sm text-slate-900 dark:text-slate-100 px-3 py-2 rounded-md shadow-lg border border-slate-300 dark:border-slate-600 text-xs font-mono max-w-lg z-50 pointer-events-none"
                          style={{ wordBreak: 'break-word' }}
                        >
                          {panelTooltip.text}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-3 py-2 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 rounded bg-[#3b82f6] border border-white"></div>
              <span>Branch</span>
            </div>
            {optimizeEnabled && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-3 rounded bg-[#8b5cf6] border border-white"></div>
                <span>Collapsed</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-2.5 rounded bg-[#06b6d4] border border-white"></div>
              <span>Terminal</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreeView;
