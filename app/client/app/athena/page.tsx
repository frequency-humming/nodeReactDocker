'use client';

import { useState } from 'react';

interface AthenaResponse {
  results?: any[];
  query?: string;
  error?: string;
  executionTime?: number;
}

export default function AthenaPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResults, setQueryResults] = useState<AthenaResponse | null>(null);

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsQuerying(true);
    setSubmittedQuery(query);
    
    try {
      const response = await fetch('/api/athena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.status}`);
      }

      const result: AthenaResponse = await response.json();
      setQueryResults(result);
    } catch (error) {
      setQueryResults({
        error: error instanceof Error ? error.message : 'Query failed',
      });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Athena Query Interface</h1>
      
      {/* Query Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Execute Query</h2>
        <form onSubmit={handleSubmitQuery}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
            disabled={isQuerying}
          />
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={isQuerying || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isQuerying ? 'Executing...' : 'Run Query'}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setQueryResults(null);
              }}
              disabled={isQuerying}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </form>
        
        {/* Sample Queries */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Sample queries:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuery('SELECT * FROM your_table WHERE YEAR=2025 AND MONTH=9 AND DAY=7 LIMIT 10')}
              className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Select All with Date (Limit 10)
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {queryResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Query Results</h2>
          
          {submittedQuery && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="text-xs text-gray-600">Query:</p>
              <code className="text-sm">{submittedQuery}</code>
            </div>
          )}
          
          {queryResults.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              Error: {queryResults.error}
            </div>
          ) : (
            <>
              {queryResults.executionTime && (
                <p className="text-sm text-gray-600 mb-2">
                  Execution time: {queryResults.executionTime}ms
                </p>
              )}
              
              {queryResults.results && queryResults.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(queryResults.results[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-700 border">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.results.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.values(row).map((value, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-2 text-sm border">
                              {value !== null && value !== undefined ? String(value) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No results returned</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}