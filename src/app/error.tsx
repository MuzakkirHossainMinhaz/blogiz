"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FiAlertTriangle, FiRefreshCw, FiHome, FiMail } from "react-icons/fi";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
    
    // In production, you could send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToSentry(error);
    }
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-neutral-50">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <FiAlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          
          {/* Error Title */}
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Something went wrong
          </h1>
          
          {/* Error Description */}
          <p className="text-lg text-neutral-600 mb-8">
            We're sorry, but something unexpected happened. Our team has been notified 
            and is working to fix this issue.
          </p>
          
          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-8 text-left bg-neutral-50 rounded-lg p-4 max-w-2xl mx-auto">
              <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-3 hover:text-neutral-900">
                🐛 Error Details (Development Only)
              </summary>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-sm">Message:</span>
                  <p className="text-sm font-mono text-red-600 mt-1">{error.message}</p>
                </div>
                {error.digest && (
                  <div>
                    <span className="font-semibold text-sm">Digest:</span>
                    <p className="text-sm font-mono text-neutral-600 mt-1">{error.digest}</p>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <span className="font-semibold text-sm">Stack Trace:</span>
                    <pre className="text-xs font-mono text-neutral-700 mt-1 whitespace-pre-wrap overflow-auto max-h-48 bg-white p-2 rounded border">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button onClick={reset} className="flex items-center gap-2">
              <FiRefreshCw className="w-5 h-5" />
              Try Again
            </Button>
            
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <FiHome className="w-5 h-5" />
                Go Home
              </Button>
            </Link>
          </div>
          
          {/* Support Info */}
          <div className="bg-white rounded-lg p-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 mb-4">
              If the problem persists, please contact our support team.
            </p>
            <a
              href="mailto:support@blogiz.com"
              className="inline-flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <FiMail className="w-4 h-4" />
              support@blogiz.com
            </a>
          </div>
          
          {/* Error ID */}
          <div className="mt-8">
            <p className="text-xs text-neutral-500">
              Error ID: {error.digest || 'unknown'}
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
              
