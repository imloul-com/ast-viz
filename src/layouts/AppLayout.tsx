import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Eye, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isVisualizePage = location.pathname === '/visualize';
  const isGrammarPage = location.pathname.startsWith('/grammar');
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Modern Unified Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 shadow-sm">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Navigation */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    AST Visualizer
                  </h1>
                </div>
              </div>
              
              {/* Page Context */}
              {isVisualizePage && (
                <>
                  <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/grammar/builder')}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Editor
                  </Button>
                </>
              )}
              
              {isGrammarPage && (
                <>
                  <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Grammar Editor</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Right: Context Actions - Rendered by child routes */}
            <div id="header-actions" className="flex items-center gap-2" />
          </div>
        </div>
      </header>

      {/* Content - rendered by child routes */}
      <Outlet />
    </div>
  );
};

export default AppLayout;

