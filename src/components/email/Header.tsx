import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../lib/avatarUtils';

export function Header(): React.ReactElement {
  const { user, logout } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = getInitials(user?.name, user?.email);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 py-3 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand logo + title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
            <svg
              className="w-4 h-4 text-white"
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
          <span className="text-base font-bold text-gray-900 tracking-tight">
            ReachInbox
          </span>
        </div>

        {/* User profile + Logout */}
        {user && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar with fallback */}
              {user.avatarUrl && !imageError ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User avatar'}
                  onError={() => setImageError(true)}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0 uppercase select-none"
                >
                  {initials}
                </div>
              )}

              {/* Name & Email with truncation */}
              <div className="hidden sm:flex flex-col text-left min-w-0">
                <span
                  title={user.name}
                  className="text-xs font-semibold text-gray-900 truncate max-w-[140px] md:max-w-[180px] leading-tight"
                >
                  {user.name || 'User'}
                </span>
                <span
                  title={user.email}
                  className="text-[11px] text-gray-500 truncate max-w-[140px] md:max-w-[180px] leading-tight"
                >
                  {user.email}
                </span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
              aria-label="Log out of application"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
