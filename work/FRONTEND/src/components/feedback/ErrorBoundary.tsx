import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ServerError500 } from './ErrorPages';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  requestId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    requestId: '',
  };

  public static getDerivedStateFromError(): State {
    return {
      hasError: true,
      requestId: `ui_err_${Date.now().toString(36)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production, log to telemetry service if configured; never log passwords or PII
    console.error('Unhandled UI boundary error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-paper min-h-screen flex items-center justify-center">
          <ServerError500 requestId={this.state.requestId} onRetry={this.handleRetry} />
        </div>
      );
    }

    return this.props.children;
  }
}
