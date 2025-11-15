import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GrammarProvider } from '@/context/GrammarContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/layouts/AppLayout';
import GrammarEditorLayout from '@/pages/GrammarEditorLayout';
import GrammarVisualBuilderPage from '@/pages/GrammarVisualBuilderPage';
import GrammarCodeEditorPage from '@/pages/GrammarCodeEditorPage';
import GrammarDependenciesPage from '@/pages/GrammarDependenciesPage';
import GrammarSuggestionsPage from '@/pages/GrammarSuggestionsPage';
import VisualizationPage from '@/pages/VisualizationPage';

function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <GrammarProvider>
        <Router>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/grammar" element={<GrammarEditorLayout />}>
                <Route 
                  path="builder" 
                  element={
                    <ErrorBoundary fallbackTitle="Visual Builder Error">
                      <GrammarVisualBuilderPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="code" 
                  element={
                    <ErrorBoundary fallbackTitle="Code Editor Error">
                      <GrammarCodeEditorPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="dependencies" 
                  element={
                    <ErrorBoundary fallbackTitle="Dependencies View Error">
                      <GrammarDependenciesPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="suggestions" 
                  element={
                    <ErrorBoundary fallbackTitle="Suggestions View Error">
                      <GrammarSuggestionsPage />
                    </ErrorBoundary>
                  } 
                />
              </Route>
              <Route 
                path="/visualize"
                element={
                  <ErrorBoundary fallbackTitle="Visualization Error">
                    <VisualizationPage />
                  </ErrorBoundary>
                } 
              />
            </Route>
            <Route path="/" element={<Navigate to="/grammar/builder" replace />} />
            <Route path="*" element={<Navigate to="/grammar/builder" replace />} />
          </Routes>
        </Router>
      </GrammarProvider>
    </ErrorBoundary>
  );
}

export default App;
