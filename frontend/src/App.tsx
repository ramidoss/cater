import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import FeedbackDisplay from './components/FeedbackDisplay';
import { designAnalysisAPI } from './services/api';
import { AnalysisState } from './types';

function App() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    feedback: null,
    error: null,
  });

  const handleImageSelect = async (file: File) => {
    setAnalysisState({
      isLoading: true,
      feedback: null,
      error: null,
    });

    try {
      const feedback = await designAnalysisAPI.analyzeDesign(file);
      setAnalysisState({
        isLoading: false,
        feedback,
        error: null,
      });
    } catch (error) {
      setAnalysisState({
        isLoading: false,
        feedback: null,
        error: error instanceof Error ? error.message : 'An error occurred during analysis',
      });
    }
  };

  const handleNewAnalysis = () => {
    setAnalysisState({
      isLoading: false,
      feedback: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Product Design Coach AI</h1>
            </div>
            {analysisState.feedback && (
              <button
                onClick={handleNewAnalysis}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysisState.feedback && !analysisState.error && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Get Expert Design Feedback in Seconds
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your screen design and receive comprehensive feedback on UX, UI, and behavioral design principles from our AI-powered design coach.
              </p>
            </div>

            <ImageUpload
              onImageSelect={handleImageSelect}
              isLoading={analysisState.isLoading}
            />

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">UX Analysis</h3>
                <p className="text-gray-600">Navigation flow, information architecture, and user journey optimization</p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">UI Evaluation</h3>
                <p className="text-gray-600">Visual hierarchy, typography, color schemes, and design consistency</p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Behavioral Design</h3>
                <p className="text-gray-600">Psychological principles, user motivation, and engagement patterns</p>
              </div>
            </div>
          </div>
        )}

        {analysisState.error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
              <p className="text-red-700 mb-4">{analysisState.error}</p>
              <button
                onClick={handleNewAnalysis}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {analysisState.feedback && (
          <FeedbackDisplay feedback={analysisState.feedback} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Product Design Coach AI. Powered by advanced AI for better design decisions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
