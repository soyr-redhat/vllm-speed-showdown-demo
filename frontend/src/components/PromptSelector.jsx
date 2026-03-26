import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CATEGORIES = [
  { value: 'short', label: 'Short Answer', icon: '⚡' },
  { value: 'long', label: 'Detailed', icon: '📝' },
  { value: 'code', label: 'Code Generation', icon: '💻' },
  { value: 'creative', label: 'Creative Writing', icon: '✨' },
  { value: 'technical', label: 'Technical Explanation', icon: '🔧' }
]

function PromptSelector({ selectedPrompt, setSelectedPrompt, onStart }) {
  const [category, setCategory] = useState('short')
  const [samplePrompts, setSamplePrompts] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/prompts/${category}`)
      .then(res => res.json())
      .then(data => setSamplePrompts(data.prompts))
      .catch(err => console.error('Failed to load prompts:', err))
  }, [category])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-8 mb-6">
        <h2 className="text-2xl font-bold mb-4">Welcome to Speed Showdown!</h2>
        <p className="text-gray-300 mb-4">
          Watch two inference engines race to generate tokens. vLLM-optimized inference
          demonstrates the performance benefits of specialized serving infrastructure.
        </p>
        <div className="bg-gray-900 rounded p-4">
          <h3 className="font-bold mb-2">How it works:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            <li>Two racers: Standard inference vs vLLM optimized</li>
            <li>Real-time token generation visualization</li>
            <li>Performance metrics: tokens/sec, latency, speedup</li>
            <li>Try different prompt types to see performance differences</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Choose Your Prompt</h3>

        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-lg text-center transition ${
                  category === cat.value
                    ? 'bg-redhat-red text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sample Prompts */}
        {samplePrompts.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Sample Prompts</label>
            <div className="space-y-2">
              {samplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPrompt(prompt)}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Or Enter Your Own</label>
          <textarea
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
            className="w-full bg-gray-900 text-white px-4 py-3 rounded h-32"
            placeholder="Type your prompt here..."
          />
        </div>

        <button
          onClick={onStart}
          disabled={!selectedPrompt.trim()}
          className="w-full bg-redhat-red text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Start Race! 🏁
        </button>
      </div>
    </div>
  )
}

export default PromptSelector
