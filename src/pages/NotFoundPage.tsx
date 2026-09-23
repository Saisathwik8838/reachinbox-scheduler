import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-gray-100 p-8 text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-bold text-lg">
          404
        </div>

        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-gray-500 mt-2 mb-6 max-w-sm leading-relaxed">
          The link you followed may be broken or the page may have been moved.
        </p>

        <Link to="/dashboard/scheduled">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
