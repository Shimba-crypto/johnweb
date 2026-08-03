import { Component } from "react";

export default class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(err: any) {
    return { error: err?.message || "Something went wrong" };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-600 text-sm mb-4">{this.state.error}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
