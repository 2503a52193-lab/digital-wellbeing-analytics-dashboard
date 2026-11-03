import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = "Calculating analytics..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

