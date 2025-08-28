// src/components/common/ErrorBoundary.jsx
import React from 'react';
import { 
  ExclamationTriangleIcon as AlertTriangle, 
  ArrowPathIcon as RefreshCw
} from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-2 text-xl font-semibold text-gray-900">
                Oops! Something went wrong
              </h3>
              <p className="mt-2 text-gray-600">
                An unexpected error occurred while loading the page.
              </p>
              {this.state.error && (
                <div className="mt-4 p-4 bg-red-50 rounded-md text-left">
                  <p className="text-sm text-red-800 font-medium">Error details:</p>
                  <p className="text-sm text-red-600 mt-1 font-mono overflow-auto">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Refresh Page</span>
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;