import type { TreeNode } from '@/types/ast';

export type CytoscapeElement = { data: Record<string, unknown> };

export function convertToCytoscape(
  tree: TreeNode,
  parentId: string | null = null,
  nodes: CytoscapeElement[] = [],
  edges: CytoscapeElement[] = [],
  idCounter = { value: 0 }
): { nodes: CytoscapeElement[]; edges: CytoscapeElement[] } {
  const id = `node-${idCounter.value++}`;

  const hasChildren = tree.children && tree.children.length > 0;
  const isTerminal = !hasChildren;
  const isCollapsed =
    tree.attributes?.type === 'collapsed' || tree.attributes?.type === 'collapsed-terminal';
  const nodeValue = tree.attributes?.value;

  let displayName: string;
  let isTruncated = false;

  const isCollapsedPath = isCollapsed || tree.name.includes(' -> ') || tree.name.includes(' → ');
  const pathSeparator = tree.name.includes(' → ') ? ' → ' : ' -> ';

  if (isCollapsedPath && tree.name.includes(pathSeparator)) {
    const pathParts = tree.name.split(pathSeparator);
    const chainDepth = pathParts.length;
    displayName = pathParts[pathParts.length - 1];
    isTruncated = chainDepth > 1;
  } else {
    const maxNameLength = 30;
    isTruncated = tree.name.length > maxNameLength;
    displayName = isTruncated ? `${tree.name.substring(0, maxNameLength - 3)}...` : tree.name;
  }

  let displayValue = '';
  let fullValue = '';
  if (nodeValue !== undefined && nodeValue !== null) {
    const valueStr = String(nodeValue);
    fullValue = valueStr;
    const maxValueLength = 40;
    displayValue =
      valueStr.length > maxValueLength ? `${valueStr.substring(0, maxValueLength - 3)}...` : valueStr;
  }

  const charWidth = 6;
  const padding = 16;
  const width = Math.max(displayName.length * charWidth + padding, 50);
  const height = 28;

  const color = isCollapsed ? '#4caf82' : isTerminal ? '#7a9ab5' : '#a87a3a';

  nodes.push({
    data: {
      id,
      label: displayName,
      fullName: tree.name,
      isTruncated,
      valueLabel: displayValue,
      fullValue,
      isTerminal,
      isCollapsed,
      color,
      width,
      height,
      interval: tree.interval,
      chainDepth: tree.name.includes(pathSeparator) ? tree.name.split(pathSeparator).length : 1,
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
}
