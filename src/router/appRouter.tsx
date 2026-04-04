import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useGrammar } from '@/context/GrammarContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/layouts/AppLayout';
import GrammarEditorLayout from '@/pages/GrammarEditorLayout';
import GrammarCodeEditorPage from '@/pages/GrammarCodeEditorPage';
import GrammarDependenciesPage from '@/pages/GrammarDependenciesPage';
import GrammarSuggestionsPage from '@/pages/GrammarSuggestionsPage';
import VisualizationPage from '@/pages/VisualizationPage';

function RequireGrammar({ children }: { children: React.ReactNode }) {
  const { getGrammarAsText } = useGrammar();
  if (!getGrammarAsText().trim()) {
    return <Navigate to="/grammar/code" replace />;
  }
  return <>{children}</>;
}

export function createAppRouter(basename: string) {
  return createBrowserRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="grammar/code" replace /> },
          {
            path: 'grammar',
            element: <GrammarEditorLayout />,
            children: [
              { index: true, element: <Navigate to="code" replace /> },
              {
                path: 'code',
                element: (
                  <ErrorBoundary fallbackTitle="Code Editor Error">
                    <GrammarCodeEditorPage />
                  </ErrorBoundary>
                ),
              },
              {
                path: 'dependencies',
                element: (
                  <ErrorBoundary fallbackTitle="Dependencies View Error">
                    <GrammarDependenciesPage />
                  </ErrorBoundary>
                ),
              },
              {
                path: 'suggestions',
                element: (
                  <ErrorBoundary fallbackTitle="Suggestions View Error">
                    <GrammarSuggestionsPage />
                  </ErrorBoundary>
                ),
              },
            ],
          },
          {
            path: 'visualize',
            element: (
              <ErrorBoundary fallbackTitle="Visualization Error">
                <RequireGrammar>
                  <VisualizationPage />
                </RequireGrammar>
              </ErrorBoundary>
            ),
          },
          { path: '*', element: <Navigate to="grammar/code" replace /> },
        ],
      },
    ],
    { basename }
  );
}
