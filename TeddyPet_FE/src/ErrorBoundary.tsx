import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            maxWidth: 640,
            margin: "40px auto",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
          }}
        >
          <h2 style={{ color: "#b91c1c", marginTop: 0 }}>Đã xảy ra lỗi</h2>
          <pre style={{ overflow: "auto", fontSize: 14 }}>{this.state.error.message}</pre>
          <p style={{ color: "#666", fontSize: 14 }}>
            Mở DevTools (F12) → Console để xem chi tiết.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
