"use client";

import React from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";
import Link from "next/link";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
    
    // In production, you could send this to an error reporting service
    // like Sentry, LogRocket, etc.
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-soft-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiAlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-neutral-600 mb-6">
          We're sorry, but something unexpected happened. Our team has been notified.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-2">
              Error Details (Development Only)
            </summary>
            <div className="bg-neutral-100 rounded-lg p-3 text-xs font-mono text-neutral-800 overflow-auto max-h-32">
              {error.message}
              {error.stack && (
                <pre className="whitespace-pre-wrap mt-2">{error.stack}</pre>
              )}
            </div>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <FiHome className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Specialized error boundaries for different parts of the app
export function BlogErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={BlogErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}

function BlogErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiAlertTriangle className="w-6 h-6 text-amber-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        Unable to load blog
      </h3>
      
      <p className="text-neutral-600 text-sm mb-4">
        This blog couldn't be loaded. Please try again later.
      </p>
      
      <button
        onClick={reset}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
      >
        <FiRefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={DashboardErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}

function DashboardErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiAlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        Dashboard Error
      </h3>
      
      <p className="text-neutral-600 text-sm mb-4">
        The dashboard encountered an error. Please refresh the page.
      </p>
      
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
      >
        <FiRefreshCw className="w-3 h-3" />
        Refresh Page
      </button>
    </div>
  );
}

export default ErrorBoundary;
