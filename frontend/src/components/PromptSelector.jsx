import { useState } from 'react'

const SAMPLE_PROMPTS = [
  "What is the capital of France?",
  "Explain quantum computing in one sentence.",
  "Write a Python function to implement binary search.",
  "Write a short story about a robot discovering emotions.",
  "Explain how a transformer architecture works in large language models."
]

function PromptSelector({ selectedPrompt, setSelectedPrompt, onStart, isRacing }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-redhat-dark-surface rounded-lg p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Sample Prompts */}
          <div>
            <label className="block text-sm font-medium mb-2">Quick Samples</label>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPrompt(prompt)}
                  disabled={isRacing}
                  className="p-2 rounded-lg text-left text-xs bg-redhat-dark-surface/80 hover:bg-redhat-red/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Middle & Right: Prompt Input */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Enter Your Prompt</label>
            <textarea
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              disabled={isRacing}
              className="w-full bg-redhat-dark-elevated text-white px-4 py-3 rounded h-40 mb-3 disabled:opacity-50"
              placeholder="Type your prompt here or select a sample from the left..."
            />

            <button
              onClick={onStart}
              disabled={!selectedPrompt.trim() || isRacing}
              className="w-full bg-redhat-red text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-red-700 transition disabled:bg-redhat-dark-elevated/50 disabled:cursor-not-allowed"
            >
              {isRacing ? 'Racing... ⏳' : 'Start Race! 🏁'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptSelector
