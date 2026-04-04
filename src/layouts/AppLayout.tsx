import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

const AstLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className} aria-hidden="true">
    <style>{`
      .logo-bg     { fill: #f7f5f0; }
      .logo-edge   { stroke: #c9501f; stroke-width: 1.8; stroke-linecap: round; }
      .logo-node   { fill: #c9501f; }
      .logo-hollow { fill: #f7f5f0; stroke: #c9501f; stroke-width: 1.8; }
      .dark .logo-bg     { fill: #0e0c0a; }
      .dark .logo-edge   { stroke: #e8613a; }
      .dark .logo-node   { fill: #e8613a; }
      .dark .logo-hollow { fill: #0e0c0a; stroke: #e8613a; }
    `}</style>
    <rect className="logo-bg" width="32" height="32" rx="7"/>
    <line className="logo-edge" x1="16" y1="10" x2="9"  y2="21"/>
    <line className="logo-edge" x1="16" y1="10" x2="23" y2="21"/>
    <circle className="logo-hollow" cx="9"  cy="22" r="3.2"/>
    <circle className="logo-hollow" cx="23" cy="22" r="3.2"/>
    <circle className="logo-node"   cx="16" cy="9"  r="3.5"/>
  </svg>
);

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  
  const isVisualizePage = location.pathname === '/visualize';
  const isGrammarPage = location.pathname.startsWith('/grammar');
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-background focus:border focus:rounded-md focus:m-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <header className="border-b bg-background">
        <div className="container mx-auto px-3 hd:px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 hd:gap-4 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <AstLogo className="h-7 w-7" />
                <h1 className="text-base hd:text-lg font-semibold text-foreground">
                  AST Visualizer
                </h1>
              </div>

              {isVisualizePage && (
                <>
                  <div className="h-5 w-px bg-border shrink-0" />
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="gap-1 hd:gap-2 text-muted-foreground hover:text-foreground px-1 hd:px-3"
                  >
                    <Link to="/grammar/code">
                      <ArrowLeft className="h-4 w-4 shrink-0" />
                      <span className="hidden hd:inline">Back to Editor</span>
                    </Link>
                  </Button>
                </>
              )}

              {isGrammarPage && (
                <>
                  <div className="hidden hd:block h-5 w-px bg-border" />
                  <span className="hidden hd:inline text-sm text-muted-foreground">
                    Grammar Editor
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div id="header-actions" className="flex items-center gap-2" />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="h-8 w-8"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div id="main-content" className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
