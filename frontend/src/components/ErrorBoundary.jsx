import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-[#141720] border border-[#ff4444]/30 rounded-xl m-4 text-center">
          <h2 className="text-xl font-bold text-[#ff4444] mb-2">Component Crashed</h2>
          <p className="text-[#8a9ab5] text-sm mb-4">
            Something went wrong while rendering this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-[#ff4444]/20 text-[#ff4444] border border-[#ff4444]/40 rounded hover:bg-[#ff4444]/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
