import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Fallback component to render, or use the default error UI */
    fallback?: ReactNode;
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    /** If true, shows a minimal inline error instead of full-page */
    inline?: boolean;
    /** Custom className for the error container */
    className?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    copied: boolean;
}

export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            copied: false
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });

        // Log to console for debugging
        console.error("ErrorBoundary caught an error:", error);
        console.error("Component stack:", errorInfo.componentStack);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            copied: false
        });
    };

    handleRefresh = () => {
        window.location.reload();
    };

    handleCopyError = async () => {
        const { error, errorInfo } = this.state;
        const errorText = `Error: ${error?.message || "Unknown error"}

Stack Trace:
${error?.stack || "No stack trace available"}

Component Stack:
${errorInfo?.componentStack || "No component stack available"}

User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Time: ${new Date().toISOString()}`;

        try {
            await navigator.clipboard.writeText(errorText);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        } catch (err) {
            console.error("Failed to copy error:", err);
        }
    };

    render() {
        const { hasError, error, errorInfo, copied } = this.state;
        const { children, fallback, inline, className } = this.props;

        if (!hasError) {
            return children;
        }

        // Use custom fallback if provided
        if (fallback) {
            return fallback;
        }

        // Inline error (for use inside components)
        if (inline) {
            return (
                <div
                    className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-lg border border-destructive/50 bg-destructive/10",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">
                            Something went wrong
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 text-center">
                        {error?.message || "An unexpected error occurred"}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={this.handleReset}
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        // Full error UI (for app-level errors)
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center min-h-dvh p-4 bg-background",
                    className
                )}
            >
                <div className="w-full max-w-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">
                                Something went wrong
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                An error occurred in the application
                            </p>
                        </div>
                    </div>

                    {/* Error details */}
                    <div className="space-y-4 mb-6">
                        {/* Error message */}
                        <div className="rounded-lg border border-border bg-muted/50 p-4">
                            <div className="text-sm font-medium text-destructive mb-1">
                                Error
                            </div>
                            <code className="text-sm break-all">
                                {error?.message || "Unknown error"}
                            </code>
                        </div>

                        {/* Stack trace */}
                        {error?.stack && (
                            <div className="rounded-lg border border-border bg-muted/50 p-4">
                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                    Stack Trace
                                </div>
                                <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto custom-scrollbar">
                                    {error.stack}
                                </pre>
                            </div>
                        )}

                        {/* Component stack */}
                        {errorInfo?.componentStack && (
                            <div className="rounded-lg border border-border bg-muted/50 p-4">
                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                    Component Stack
                                </div>
                                <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto custom-scrollbar">
                                    {errorInfo.componentStack}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={this.handleReset} variant="default">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                        <Button onClick={this.handleRefresh} variant="outline">
                            Refresh Page
                        </Button>
                        <Button
                            onClick={this.handleCopyError}
                            variant="outline"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Error
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-muted-foreground mt-6">
                        If this error persists, try refreshing the page or
                        clearing your browser cache. You can copy the error
                        details above to report the issue.
                    </p>
                </div>
            </div>
        );
    }
}
