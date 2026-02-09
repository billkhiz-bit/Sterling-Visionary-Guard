
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary component to catch rendering errors and provide audio feedback.
 * Extends React's Component class to implement error lifecycle methods.
 */
// Use Component explicitly with generic types to ensure inherited members like 'state' and 'props' are correctly typed.
export class ErrorBoundary extends Component<Props, State> {
  // Explicitly declare the props and state properties to avoid 'Property does not exist' errors in TypeScript.
  // This helps the compiler when inheritance-based members are not automatically detected.
  public props: Props;
  public state: State = { hasError: false };

  constructor(props: Props) {
    super(props);
    // Explicitly assign props to satisfy the type checker's local scope requirements if inheritance fails.
    this.props = props;
  }

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // componentDidCatch logs the error and provides audio feedback.
  // Removed 'override' as it was causing TypeScript recognition issues in some environments.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Provide audio feedback for the error
    try {
      const synth = window.speechSynthesis;
      if (synth) {
        const utterance = new SpeechSynthesisUtterance("Something went wrong. Please restart the app.");
        utterance.rate = 0.9;
        synth.speak(utterance);
      }
    } catch (e) {
      console.error("Speech synthesis failed", e);
    }
  }

  // render method handles the fallback UI.
  // Removed 'override' to resolve compiler confusion about inheritance.
  public render() {
    // Access state inherited from Component to check for errors
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-black text-red-600 mb-8 uppercase">Something Went Wrong</h1>
          <p className="text-2xl text-white mb-12">I've encountered a critical error. Please refresh the page or restart the application.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-500 text-black px-12 py-6 rounded-3xl text-3xl font-black shadow-2xl active:scale-95"
          >
            RESTART APP
          </button>
        </div>
      );
    }
    
    // Use the explicitly declared props to provide children to the consumer.
    return this.props.children;
  }
}
