"use client";

import { Component, type ReactNode } from "react";
import { SlideErrorFallback } from "@/components/wrapped/slide-error-fallback";
import { reportError } from "@/lib/errors/reporter";

type Props = {
  children: ReactNode;
  onContinue: () => void;
};

type State = {
  hasError: boolean;
};

export class SlideErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    reportError(error, { scope: "wrapped-slide" });
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SlideErrorFallback
          onContinue={this.props.onContinue}
          onRetry={this.retry}
        />
      );
    }
    return this.props.children;
  }
}
