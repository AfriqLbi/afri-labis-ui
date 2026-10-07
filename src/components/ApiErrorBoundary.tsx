/**
 * ApiErrorBoundary — catches render-time errors and shows a readable overlay
 * instead of a blank page.
 *
 * Wrap any page or section that could crash:
 *   <ApiErrorBoundary label="Admin Products">
 *     <AdminProductsPage />
 *   </ApiErrorBoundary>
 *
 * In production the overlay is still shown (better than blank) but without
 * the raw stack trace. In development the full error + component stack is shown.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Label shown in the error header so you know which section crashed. */
  label?: string;
  /** Fallback rendered instead of the error overlay (optional). */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ApiErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to console so it's always visible even when the overlay is dismissed
    console.error(
      `[ApiErrorBoundary${this.props.label ? ` — ${this.props.label}` : ""}]`,
      error,
      errorInfo.componentStack,
    );
  }

  reset = () => this.setState({ error: null, errorInfo: null });

  render() {
    const { error, errorInfo } = this.state;
    const { children, label, fallback } = this.props;

    if (!error) return children;

    if (fallback) return fallback;

    const isDev = import.meta.env.DEV;

    return (
      <div className="p-8 space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-destructive/10 border border-destructive/30 flex items-center justify-center shrink-0 text-destructive text-lg font-bold">
            !
          </div>
          <div>
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-destructive mb-0.5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {label ? `${label} — ` : ""}Render Error
            </p>
            <p
              className="text-2xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {error.message || "Something went wrong"}
            </p>
          </div>
        </div>

        {/* Hint */}
        <p
          className="text-sm text-muted-foreground font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          This section failed to render. The error has been logged to the console.
          {isDev && " Stack trace is shown below (development only)."}
        </p>

        {/* Dev stack trace */}
        {isDev && errorInfo?.componentStack && (
          <pre className="bg-muted/60 border border-border text-[11px] text-muted-foreground p-4 overflow-x-auto rounded-none leading-relaxed max-h-64 overflow-y-auto">
            {error.stack}
            {"\n\nComponent stack:"}
            {errorInfo.componentStack}
          </pre>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={this.reset}
            className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
