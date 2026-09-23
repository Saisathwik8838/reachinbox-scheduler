import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';

export function LoginPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const errorParam = searchParams.get('error');

  const getErrorMessage = (errorKey: string | null): string | null => {
    if (!errorKey) return null;
    switch (errorKey) {
      case 'consent_denied':
        return 'Google OAuth permission was denied. Please grant the requested permissions to continue.';
      case 'oauth_failed':
        return 'Google sign-in encountered an error. Please try again.';
      case 'session_expired':
        return 'Your session has expired. Please sign in again to access your dashboard.';
      default:
        return 'Unable to authenticate with Google. Please try again.';
    }
  };

  const errorMessage = getErrorMessage(errorParam);

  const handleGoogleSignIn = () => {
    setIsRedirecting(true);
    // Direct browser redirect to backend Google OAuth initiation endpoint
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col items-center justify-center p-4">
      {/* Outer Card */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-card border border-gray-100 p-8 sm:p-10 flex flex-col items-center text-center">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs mb-3">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Brand Name */}
        <span className="text-sm font-semibold text-gray-900 tracking-tight mb-6">
          ReachInbox
        </span>

        {/* Main Heading */}
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
          Schedule and manage your emails
        </h1>
        <p className="text-sm text-gray-500 mt-2 mb-7">
          Sign in with your Google account to continue.
        </p>

        {/* OAuth Error Alert Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="w-full mb-6 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-left flex items-start gap-2.5 text-xs text-rose-700"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isRedirecting}
          className="w-full py-3 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl shadow-xs text-sm font-medium text-gray-700 flex items-center justify-center gap-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRedirecting ? (
            <Spinner size="sm" className="text-blue-600" />
          ) : (
            /* Official Google G Logo SVG */
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{isRedirecting ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {/* Disclaimer Note */}
        <p className="text-xs text-gray-400 mt-7 max-w-xs leading-relaxed">
          Google is the only sign-in method.
          <br />
          By continuing, you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
