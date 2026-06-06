'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Caught by Dashboard Error Boundary:', error);
  }, [error]);

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <h2 className="text-2xl font-bold text-red-600 mb-4">A Client-Side Crash Occurred!</h2>
      <p className="text-slate-600 mb-4">Please copy the text below and send it to your AI assistant:</p>
      <div className="bg-white border border-red-200 text-red-900 p-6 rounded-xl max-w-4xl overflow-auto w-full font-mono text-xs shadow-lg">
        <p className="font-bold mb-2 text-sm">Error Message:</p>
        <p className="mb-4">{error.message}</p>
        <p className="font-bold mb-2 text-sm">Stack Trace:</p>
        <pre className="whitespace-pre-wrap leading-relaxed">{error.stack}</pre>
      </div>
      <button
        className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow hover:bg-slate-800 transition"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
