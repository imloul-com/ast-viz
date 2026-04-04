export function createTreeStylesheet(isDark: boolean) {
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        label: 'data(label)',
        width: 'data(width)',
        height: 'data(height)',
        shape: 'roundrectangle',
        'text-valign': 'center',
        'text-halign': 'center',
        color: '#ffffff',
        'font-size': '12px',
        'font-weight': 500,
        'text-wrap': 'none',
        'text-max-width': '150px',
        'border-width': 1,
        'border-color': isDark ? '#242430' : '#d5d0c6',
        cursor: 'pointer',
      },
    },
    {
      selector: 'node:active',
      style: {
        'overlay-color': '#e8613a',
        'overlay-opacity': 0.3,
        'overlay-padding': 4,
      },
    },
    {
      selector: 'node[valueLabel]',
      style: {
        'source-label': 'data(valueLabel)',
        'source-text-offset': 25,
        'source-text-background-color': isDark ? '#141210' : '#f0ede6',
        'source-text-background-opacity': 0.95,
        'source-text-background-padding': '3px',
        'source-text-background-shape': 'roundrectangle',
        'source-text-color': isDark ? '#e8e6e0' : '#1c1a16',
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
        width: 1.5,
        'line-color': isDark ? '#8a8880' : '#7a756d',
        'target-arrow-color': isDark ? '#8a8880' : '#7a756d',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
      },
    },
  ];
}
