import React from 'react';

interface TreeLegendProps {
  optimizeEnabled: boolean;
}

export const TreeLegend: React.FC<TreeLegendProps> = ({ optimizeEnabled }) => {
  return (
    <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-background/90 px-3 py-2 rounded border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#a87a3a]" />
          <span>Branch</span>
        </div>
        {optimizeEnabled && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#4caf82]" />
            <span>Collapsed</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#7a9ab5]" />
          <span>Terminal</span>
        </div>
      </div>
    </div>
  );
};
