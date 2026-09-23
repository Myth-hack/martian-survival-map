import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080B10] flex items-center justify-center p-6 text-slate-100 font-mono">
          <div className="max-w-md w-full bg-slate-950/90 border border-red-500/40 rounded-xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center space-x-3 mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h2 className="font-['Orbitron'] font-bold text-lg text-white">
                TELEMETRY SUBSYSTEM RECOVERY
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              A momentary render disturbance was isolated by the mission telemetry safety boundary.
              Subsystem status has been safeguarded.
            </p>
            {this.state.error && (
              <div className="bg-red-950/30 border border-red-900/60 rounded-lg p-3 text-[11px] text-red-300 font-mono mb-4 break-words">
                {this.state.error.message || 'Anomaly safely contained.'}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-600/60 rounded-lg text-xs font-bold text-red-200 transition-colors shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REINITIALIZE INTERFACE</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
