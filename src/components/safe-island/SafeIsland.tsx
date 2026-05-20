import React, { Component, ErrorInfo } from 'react';
import { SafeRenderer } from './SafeRenderer';

interface Props {
  data: unknown; // Unvalidated JSON
  onAction: (actionId: string, payload?: any) => void;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SafeIsland extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SafeIsland Crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-500 text-sm">
          Something went wrong in this widget.
        </div>
      );
    }

    return (
      <div className="relative z-0 group" data-safe-island="true">
        {/* Logical CSS Isolation Container */}
        <SafeRenderer data={this.props.data} onAction={this.props.onAction} />
      </div>
    );
  }
}
