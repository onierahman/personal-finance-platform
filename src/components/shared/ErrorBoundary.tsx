'use client';
import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message:  string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="card p-8 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-warning-500" />
        <p className="text-sm font-medium text-slate-700">Something went wrong</p>
        <p className="text-xs text-slate-400">{this.state.message}</p>
        <button
          onClick={() => this.setState({ hasError: false, message: '' })}
          className="text-xs text-primary-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }
}
