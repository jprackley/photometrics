import React from "react";

function getErrorCode(error) {
    if (!error) return "APP_RENDER_ERROR";
    return error.code || error.status || error.name || "APP_RENDER_ERROR";
}

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("[photometrics:error-boundary]", error, errorInfo);
    }

    render() {
        const { error, errorInfo } = this.state;

        if (!error) {
            return this.props.children;
        }

        const code = getErrorCode(error);
        const message = error?.message || "The application could not render this page.";
        const componentStack = errorInfo?.componentStack || "No component stack available.";

        return (
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-6 text-slate-950">
                <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">
                        Error code: {code}
                    </div>
                    <h1 className="text-2xl font-black text-slate-950">This page could not load.</h1>
                    <p className="mt-2 text-sm text-slate-700">
                        PhotoMetrics caught the crash and displayed the error below.
                    </p>

                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                        <div className="text-sm font-bold text-red-800">Error message</div>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-red-900">{message}</pre>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-bold text-slate-800">Component stack</div>
                        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">{componentStack}</pre>
                    </div>

                    <button
                        type="button"
                        className="mt-5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                        onClick={() => window.location.reload()}
                    >
                        Reload application
                    </button>
                </div>
            </div>
        );
    }
}
