import { useState } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';

function AIHelper() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.post('/ai/generate', { prompt });
      setResponse(result.data.response);
      toast.success('Response generated successfully!');
    } catch (error) {
      toast.error('Failed to generate response');
      console.error('AI generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Helper</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            Your Question
          </label>
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Ask anything..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>

      {response && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Response:</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="whitespace-pre-wrap text-gray-700">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIHelper;