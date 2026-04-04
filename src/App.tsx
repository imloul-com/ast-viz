import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { GrammarProvider } from '@/context/GrammarContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { createAppRouter } from '@/router/appRouter';

function App() {
  const basename = document.querySelector('base')
    ? new URL(document.baseURI).pathname.replace(/\/$/, '') || '/'
    : '/';
  const router = useMemo(() => createAppRouter(basename), [basename]);

  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <GrammarProvider>
        <RouterProvider router={router} />
      </GrammarProvider>
    </ErrorBoundary>
  );
}

export default App;
