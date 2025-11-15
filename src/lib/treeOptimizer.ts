import type { ASTNode, TreeNode } from '@/types/ast';

/**
 * Tree Optimizer - Simplifies AST for better visualization
 * 
 * PURPOSE:
 * - Remove Ohm.js internal nodes (_iter, _terminal) that clutter the tree
 * - Collapse linear chains of single-child nodes for readability
 * - Hide lowercase lexical rules (tokens) that don't add structural value
 * 
 * STRATEGY:
 * 1. Clean: Remove Ohm.js framework nodes (_iter, _terminal)
 * 2. Collapse: Merge single-child chains (A → B → C becomes "A → B → C")
 * 3. Filter: Hide lowercase leaf nodes (lexical tokens like 'space', 'digit')
 */

/**
 * Clean AST by removing Ohm.js framework nodes
 * 
 * Removes:
 * - _iter nodes: Iteration wrappers (e.g., for `rule+` or `rule*`)
 * - _terminal nodes: Literal punctuation from grammar definitions
 * 
 * Strategy: Flatten _iter children into parent, skip _terminal entirely
 */
function cleanAST(node: ASTNode): ASTNode | null {
  // Skip Ohm.js internal nodes that should be removed
  if (node.name === '_iter' || node.name === '_terminal') {
    return null;
  }
  
  // Recursively clean children and flatten _iter nodes
  const cleanedChildren: ASTNode[] = [];
  
  for (const child of node.children) {
    if (child.name === '_iter') {
      // Flatten _iter: add its children directly to parent
      for (const iterChild of child.children) {
        const cleanedIterChild = cleanAST(iterChild);
        if (cleanedIterChild) {
          cleanedChildren.push(cleanedIterChild);
        }
      }
    } else {
      // Regular child: clean recursively
      const cleaned = cleanAST(child);
      if (cleaned) {
        cleanedChildren.push(cleaned);
      }
    }
  }
  
  return {
    ...node,
    children: cleanedChildren,
  };
}

/**
 * Check if a node is a lowercase (lexical) rule
 * 
 * Ohm.js convention:
 * - Uppercase rules (e.g., Expression, Statement) = structural nodes, shown in AST
 * - Lowercase rules (e.g., identifier, number) = lexical tokens, hidden from AST
 */
function isLexicalNode(node: ASTNode): boolean {
  return /^[a-z]/.test(node.name);
}

/**
 * Skip through lexical nodes to find the next structural node
 * 
 * Used when traversing single-child chains to find meaningful nodes.
 * Lexical nodes are intermediate parsing artifacts we want to hide.
 */
function skipLexicalNodes(node: ASTNode): ASTNode {
  let current = node;
  
  // Follow single-child lexical nodes until we find a structural node or end
  while (current.children.length === 1 && isLexicalNode(current)) {
    current = current.children[0];
  }
  
  return current;
}

/**
 * Determine if a node starts a linear path that should be collapsed
 * 
 * A linear path is a chain of single-child structural nodes like:
 * - Short: Program → Statement (2 nodes)
 * - Long: Program → Statement → Expression → Term (4 nodes)
 * 
 * We collapse these to: "Program → Statement" or "Program → ... → Term"
 * This reduces visual clutter and makes the tree more readable.
 * 
 * We STOP collapsing when we hit:
 * - A branching node (multiple children)
 * 
 * We ALLOW collapsing for:
 * - Chains ending at leaf nodes (includes 2-node chains)
 * - Chains of any length ≥ 2
 */
function shouldCollapse(node: ASTNode): boolean {
  // Stop if leaf (nothing to collapse) or branching node
  if (node.children.length !== 1) {
    return false;
  }
  
  // Look ahead: skip lexical nodes to find the next structural node
  const nextStructural = skipLexicalNodes(node.children[0]);
  
  // If next node is lexical, don't collapse
  if (isLexicalNode(nextStructural)) {
    return false;
  }
  
  // Stop if next node branches (has multiple children)
  // But ALLOW if next node is a leaf (0 children) - this enables 2-node chains
  if (nextStructural.children.length > 1) {
    return false;
  }
  
  // Debug logging for 2-node chains
  if (nextStructural.children.length === 0) {
    console.log(`🔍 2-node chain detected: "${node.name}" → "${nextStructural.name}" (leaf)`);
  }
  
  // Collapse if:
  // - Next node is a leaf (0 children) → 2-node chain like A → B
  // - Next node has 1 child → longer chain like A → B → C
  return true;
}

/**
 * Collapse a linear path into a single node with combined name
 * 
 * Example:
 * Input:  Program → Statement → Expression → Term (each with single child)
 * Output: "Program → Statement → Expression → Term" (single collapsed node)
 * 
 * This makes deep single-child chains more readable and less cluttered.
 */
function collapseLinearPath(node: ASTNode): { name: string; finalNode: ASTNode } {
  const path: string[] = [node.name];
  let current = node;
  
  // Traverse down the single-child chain
  while (current.children.length === 1) {
    const child = current.children[0];
    
    // Skip lexical nodes (we don't include them in the path name)
    const nextStructural = skipLexicalNodes(child);
    
    // Stop at leaf or branching node
    if (nextStructural.children.length === 0 || nextStructural.children.length > 1) {
      current = nextStructural;
      // Add final structural node to path if it's not lexical
      if (!isLexicalNode(nextStructural)) {
        path.push(nextStructural.name);
      }
      break;
    }
    
    // Add structural node to path and continue
    if (!isLexicalNode(nextStructural)) {
      path.push(nextStructural.name);
      current = nextStructural;
    } else {
      // Reached a lexical leaf, stop
      current = nextStructural;
      break;
    }
  }
  
  const collapsedName = path.join(' → ');
  console.log(`✅ Collapsed: ${collapsedName} (${path.length} nodes, final has ${current.children.length} children)`);
  
  return {
    name: collapsedName,
    finalNode: current,
  };
}

/**
 * Recursively optimize children nodes
 * 
 * Filters out lowercase lexical leaf nodes (e.g., 'space', 'digit')
 * These are parsing artifacts that don't add value to the visualization.
 * 
 * Strategy:
 * - Skip lexical leaf nodes (lowercase with no children)
 * - Recursively optimize all other children
 */
function optimizeChildren(children: ASTNode[]): TreeNode[] {
  const optimized: TreeNode[] = [];
  
  for (const child of children) {
    // Filter: Skip lowercase lexical leaf nodes
    // These are tokens like 'space', 'digit', 'comma' that clutter the tree
    if (isLexicalNode(child) && child.children.length === 0) {
      continue;
    }
    
    // Recursively optimize this child
    optimized.push(optimizeTree(child));
  }
  
  return optimized;
}

/**
 * Convert AST to optimized Tree structure for visualization
 * 
 * OPTIMIZATION STEPS:
 * 1. Clean: Remove Ohm.js internal nodes (_iter, _terminal)
 * 2. Collapse: Merge single-child chains for readability
 * 3. Filter: Hide lowercase lexical leaf nodes
 * 
 * RESULT: A simplified tree that's easier to visualize and understand
 * 
 * Example:
 * Before: Program → [Statement → [Expression → [Term → [Factor → [digit]]]]]
 * After:  Program → Statement → Expression → Term → Factor
 */
export function optimizeTree(ast: ASTNode): TreeNode {
  // Step 1: Clean Ohm.js framework nodes
  const cleaned = cleanAST(ast);
  if (!cleaned) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  // Leaf node: return as terminal
  if (cleaned.children.length === 0) {
    return {
      name: cleaned.name,
      attributes: {
        value: cleaned.value,
        type: 'terminal',
      },
      interval: cleaned.interval,
    };
  }
  
  // Step 2: Check if this starts a collapsible linear path
  if (shouldCollapse(cleaned)) {
    const { name, finalNode } = collapseLinearPath(cleaned);
    
    // Collapsed path ends at leaf (terminal node)
    // Example: "Program → Statement → Expression → Term" with no children
    // This will be rendered as a purple (collapsed) terminal node
    if (finalNode.children.length === 0) {
      return {
        name,
        attributes: {
          value: finalNode.value,
          type: 'collapsed-terminal', // Special type for collapsed leaf nodes
        },
        interval: finalNode.interval,
      };
    }
    
    // Collapsed path has children: recursively optimize them
    // Example: "Program → Statement → Expression" with children
    // This will be rendered as a purple (collapsed) branch node
    return {
      name,
      attributes: {
        value: finalNode.value,
        type: 'collapsed', // Type for collapsed branch nodes
      },
      interval: finalNode.interval,
      children: optimizeChildren(finalNode.children),
    };
  }
  
  // Step 3: Branching node - optimize children and filter lexical leaves
  return {
    name: cleaned.name,
    attributes: {
      // Truncate long values for readability
      value: cleaned.value && cleaned.value.length < 50 ? cleaned.value : undefined,
      type: 'branch',
    },
    interval: cleaned.interval,
    children: optimizeChildren(cleaned.children),
  };
}

/**
 * Convert AST to non-optimized tree (for comparison/debugging)
 * 
 * Provides a "raw" view of the AST with minimal processing:
 * - Removes Ohm.js internal nodes (_iter, _terminal)
 * - Filters lowercase lexical leaf nodes
 * - NO collapsing of single-child chains
 * 
 * Use this when you want to see the full structure without optimization.
 */
export function astToTree(ast: ASTNode): TreeNode {
  // Clean Ohm.js internal nodes
  const cleaned = cleanAST(ast);
  if (!cleaned) {
    return {
      name: 'empty',
      attributes: { type: 'terminal' },
    };
  }
  
  // Recursively convert children, filtering out lexical leaf nodes
  const filteredChildren = cleaned.children
    .filter(child => !(isLexicalNode(child) && child.children.length === 0))
    .map(child => astToTree(child));
  
  return {
    name: cleaned.name,
    attributes: {
      value: cleaned.value,
      type: cleaned.children.length === 0 ? 'terminal' : 'non-terminal',
    },
    interval: cleaned.interval,
    children: filteredChildren,
  };
}

