import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function ErrorMessage({ message }) {
  return (
    <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 rounded-lg border border-red-200">
      <AlertTriangle className="w-5 h-5" />
      <p>{message}</p>
    </div>
  );
}
