import React from 'react';

interface TreeTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

export const TreeTooltip: React.FC<TreeTooltipProps> = ({ visible, x, y, text }) => {
  if (!visible) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none bg-background/95 border text-foreground px-3 py-2 rounded text-xs font-mono max-w-lg"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
        wordBreak: 'break-word',
      }}
    >
      {text}
    </div>
  );
};
