'use client';

import { useState } from 'react';

export default function ResumeForm() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.elements.namedItem('resume') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError('Please upload a PDF resume.');
      setLoading(false);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      setLoading(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
        e.currentTarget.reset();
      } else {
        setError(data.error || 'An error occurred.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Resume (PDF):
            <input
              type="file"
              name="resume"
              accept=".pdf"
              required
              className="mt-2 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description:
            <textarea
              name="job"
              required
              className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 p-2 text-gray-900 min-h-[100px]"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Evaluating...' : 'Evaluate'}
        </button>
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded p-2 text-sm text-center">
            {error}
          </div>
        )}
        {result && (
          <pre className="bg-gray-100 border border-gray-200 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </form>
    </div>
  );
}
