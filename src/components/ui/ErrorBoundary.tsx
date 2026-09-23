import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Preserves error logging for debugging without user-facing console noise
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/dashboard/scheduled';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-canvas flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-gray-100 p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Something unexpected happened
            </h1>
            <p className="text-sm text-gray-500 mt-2 mb-6 max-w-sm leading-relaxed">
              An unhandled interface error occurred. You can reload the page or return to your dashboard.
            </p>

            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-left font-mono text-xs text-rose-700 max-h-32 overflow-y-auto mb-6">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 w-full justify-center">
              <Button
                variant="outline"
                size="md"
                onClick={this.handleReload}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reload page
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
