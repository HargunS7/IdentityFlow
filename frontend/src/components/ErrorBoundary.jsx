import React from "react";

/**
 * Catches render/load errors in the routed tree so a failure shows a friendly
 * "Reload" card instead of a blank black screen. Key it by route so navigating
 * elsewhere clears a stuck error.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Route error boundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-7 text-center max-w-md text-white">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
            Something went wrong
          </div>
          <h2 className="mt-1 text-2xl font-semibold">Couldn't load this page</h2>
          <p className="mt-2 text-sm text-white/60">
            This usually happens right after the app updates. Reloading fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-2xl px-5 py-2.5 text-sm font-semibold text-black bg-white hover:bg-white/90 transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
