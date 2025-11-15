import React, { Component, type ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component to catch and display React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Something went wrong' } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <div className="p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{fallbackTitle}</p>
                {error && (
                  <p className="text-sm font-mono">{error.toString()}</p>
                )}
                {import.meta.env.DEV && errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">
                      Stack trace (development only)
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-48 bg-red-950/20 p-2 rounded">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
          <Button onClick={this.handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


