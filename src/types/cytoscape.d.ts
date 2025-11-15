declare module 'react-cytoscapejs' {
  import { ComponentType } from 'react';
  
  interface CytoscapeComponentProps {
    elements: any[];
    style?: React.CSSProperties;
    cy?: (cy: any) => void;
    stylesheet?: any[];
    layout?: any;
    wheelSensitivity?: number;
    minZoom?: number;
    maxZoom?: number;
  }
  
  const CytoscapeComponent: ComponentType<CytoscapeComponentProps>;
  export default CytoscapeComponent;
}

declare module 'cytoscape-dagre' {
  const dagreExtension: any;
  export default dagreExtension;
}



