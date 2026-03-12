import { AlertCircle, CheckCircle } from 'lucide-react';

type Props = {
  error?: string;
  success?: string;
  onClose: () => void;
};

/**
 * Renders an error or success message in a fixed overlay centered on the screen.
 * Use for all user-facing alerts so they appear in the middle of the viewport.
 */
export function CenteredAlert({ error, success, onClose }: Props) {
  if (!error && !success) return null;

  const isError = !!error;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-live="polite"
      aria-label={isError ? 'Error' : 'Success'}
    >
      <div
        className={`rounded-xl shadow-2xl max-w-md w-full p-5 flex items-start gap-3 ${
          isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isError ? (
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600 mt-0.5" />
        ) : (
          <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-600 mt-0.5" />
        )}
        <p className={`flex-1 text-sm ${isError ? 'text-red-700' : 'text-green-700'}`}>
          {error || success}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg font-medium transition-colors ${
            isError ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'
          }`}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
