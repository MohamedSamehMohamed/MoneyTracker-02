import { useState } from 'react';
import { transactionsApi } from '../../services/api';

export interface ExportButtonProps {
  dateFrom: string;
  dateTo: string;
}

export function ExportButton({ dateFrom, dateTo }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoData(false);

      await transactionsApi.exportCsv({
        dateFrom,
        dateTo,
      });
    } catch (err: any) {
      if (err.error === 'No transactions found for the specified filters' || err.statusCode === 404) {
        setNoData(true);
        setError('No transactions to export');
      } else {
        setError(err.error || err.message || 'Failed to export transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
          loading
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        } transition-colors`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </>
        )}
      </button>

      {noData && (
        <span className="text-sm text-gray-500">
          No transactions to export
        </span>
      )}

      {error && !noData && (
        <span className="text-sm text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
