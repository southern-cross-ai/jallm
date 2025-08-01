'use client';

import { useState } from 'react';

export default function HaikuGenerator() {
  const [prompt, setPrompt] = useState('');
  const [haiku, setHaiku] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateHaiku = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setHaiku('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate haiku');
      }

      const data = await response.json();
      setHaiku(data.haiku);
    } catch (err) {
      setError('Error generating haiku. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateHaiku();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800" style={{ fontFamily: "'Cedarville Cursive', serif" }}>
            Haikus by Joey ~ 🩴
          </h1>
          <p className="text-gray-600">
            <br></br>
            G'day... 
            <br></br>
            Ya ever wonder how a stereotypical Australian would write a haiku?
            <br></br>
            Prolly not.  But, this demo exists now.  It's here to will show ya how.
            <br></br><br></br>
            Enter ya prompt into the window below and let JoeyLLM inspire ya~
            <br></br>
            <i>( actual haiku not guaranteed )</i>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Your Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a theme, mood, or scene for your haiku..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 text-gray-700 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          <button
            onClick={generateHaiku}
            disabled={loading || !prompt.trim()}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </div>
            ) : (
              'Generate Haiku'
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {haiku && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Your (Ripper) Haiku
            </h2>
            <div className="bg-gray-50 rounded-md p-6 text-center">
              <div className="text-lg text-gray-800 leading-relaxed font-medium" style={{ fontFamily: "'Cedarville Cursive', serif" }}>
                {haiku.split('\n').map((line, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(haiku);
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium" id="copybutton"
              >
                Top-notch poem? 📋 Copy to clipboard!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
