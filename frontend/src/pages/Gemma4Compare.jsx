import { useState, useEffect } from 'react'
import MetricsPanel from '../components/MetricsPanel'
import ComparisonStats from '../components/ComparisonStats'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Gemma4Compare() {
  const [compareState, setCompareState] = useState('idle') // idle, streaming, complete
  const [prompt, setPrompt] = useState('')
  const [standardData, setStandardData] = useState({
    text: '',
    tokens: [],
    metrics: { tps: 0, ttft: 0, totalTime: 0, tokenCount: 0 }
  })
  const [quantizedData, setQuantizedData] = useState({
    text: '',
    tokens: [],
    metrics: { tps: 0, ttft: 0, totalTime: 0, tokenCount: 0 }
  })

  const samplePrompts = [
    "Explain how transformers work in machine learning in detail.",
    "Write a Python function to implement a binary search tree with insert and search methods.",
    "Describe the benefits and challenges of microservices architecture.",
    "What are the key differences between supervised and unsupervised learning?"
  ]

  const startComparison = () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    setCompareState('streaming')
    setStandardData({ text: '', tokens: [], metrics: { tps: 0, ttft: 0, totalTime: 0, tokenCount: 0 } })
    setQuantizedData({ text: '', tokens: [], metrics: { tps: 0, ttft: 0, totalTime: 0, tokenCount: 0 } })

    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
    const ws = new WebSocket(`${wsUrl}/ws/compare`)

    let standardStart = null
    let quantizedStart = null
    let standardFirstToken = null
    let quantizedFirstToken = null

    ws.onopen = () => {
      ws.send(JSON.stringify({
        prompt: prompt,
        max_tokens: 200
      }))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'token') {
        const { racer, token, index, timestamp, tokens_per_sec } = message.data

        if (racer === 'standard') {
          if (!standardStart) standardStart = timestamp
          if (!standardFirstToken) standardFirstToken = timestamp

          setStandardData(prev => ({
            text: prev.text + token,
            tokens: [...prev.tokens, message.data],
            metrics: {
              tps: tokens_per_sec,
              ttft: standardFirstToken - standardStart,
              totalTime: timestamp - standardStart,
              tokenCount: index
            }
          }))
        } else if (racer === 'quantized') {
          if (!quantizedStart) quantizedStart = timestamp
          if (!quantizedFirstToken) quantizedFirstToken = timestamp

          setQuantizedData(prev => ({
            text: prev.text + token,
            tokens: [...prev.tokens, message.data],
            metrics: {
              tps: tokens_per_sec,
              ttft: quantizedFirstToken - quantizedStart,
              totalTime: timestamp - quantizedStart,
              tokenCount: index
            }
          }))
        }
      } else if (message.type === 'complete') {
        setCompareState('complete')
        ws.close()
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setCompareState('idle')
      alert('Connection error. Check console for details.')
    }
  }

  const reset = () => {
    setCompareState('idle')
    setStandardData({ text: '', tokens: [], metrics: { tps: 0, ttft: 0, totalTime: 0, tokenCount: 0 } })
    setQuantizedData({ text: '', tokens: [], metrics: { tps: 0, ttft: 0, totalTime: 0, tokenCount: 0 } })
  }

  return (
    <div className="min-h-screen bg-redhat-dark-bg text-redhat-text-primary">
      {/* Grid background */}
      <div className="grid-background"></div>

      {/* Header */}
      <header className="bg-redhat-dark-surface border-b border-redhat-grid-line relative z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold text-redhat-red">Gemma 4 Comparison</h1>
              <p className="text-redhat-text-secondary mt-2 font-mono text-sm uppercase tracking-wider">
                Standard vs. Quantized (FP8-Dynamic)
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-redhat-text-tertiary uppercase tracking-wider">Powered by</div>
              <div className="text-redhat-red font-display font-bold text-xl">Red Hat AI + vLLM</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Prompt Input */}
        <div className="bg-redhat-dark-elevated border border-redhat-grid-line rounded-lg p-6 mb-6">
          <label className="block text-sm font-mono text-redhat-text-secondary uppercase tracking-wider mb-3">
            Enter your prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here..."
            className="w-full bg-redhat-dark-bg border border-redhat-grid-line rounded px-4 py-3 text-redhat-text-primary font-mono text-sm focus:outline-none focus:border-redhat-red resize-none"
            rows={3}
            disabled={compareState === 'streaming'}
          />

          {/* Sample Prompts */}
          <div className="mt-4">
            <div className="text-xs font-mono text-redhat-text-tertiary uppercase tracking-wider mb-2">
              Quick prompts:
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(sample)}
                  disabled={compareState === 'streaming'}
                  className="px-3 py-1 bg-redhat-dark-bg border border-redhat-grid-line rounded text-xs font-mono hover:border-redhat-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sample.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={startComparison}
              disabled={compareState === 'streaming'}
              className="px-6 py-3 bg-redhat-red text-white font-mono font-bold rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {compareState === 'streaming' ? 'Streaming...' : 'Start Comparison'}
            </button>
            {compareState === 'complete' && (
              <button
                onClick={reset}
                className="px-6 py-3 bg-redhat-dark-bg border border-redhat-grid-line text-redhat-text-primary font-mono rounded hover:border-redhat-red transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Comparison Stats - Only show when complete */}
        {compareState === 'complete' && (
          <ComparisonStats
            standardMetrics={standardData.metrics}
            quantizedMetrics={quantizedData.metrics}
          />
        )}

        {/* Side-by-Side Panels */}
        <div className="grid grid-cols-2 gap-6">
          {/* Standard Model Panel */}
          <MetricsPanel
            title="Standard Gemma 4"
            subtitle="google/gemma-4-31b-it"
            data={standardData}
            isStreaming={compareState === 'streaming'}
            accentColor="blue"
          />

          {/* Quantized Model Panel */}
          <MetricsPanel
            title="Quantized Gemma 4"
            subtitle="RedHatAI/gemma-4-31B-it-FP8-Dynamic"
            data={quantizedData}
            isStreaming={compareState === 'streaming'}
            accentColor="green"
            isQuantized={true}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-redhat-dark-surface border-t border-redhat-grid-line mt-8 py-4 relative z-10">
        <div className="container mx-auto px-6 text-center font-mono text-redhat-text-tertiary text-xs uppercase tracking-wider">
          <p>Open Source AI • Quantized with Red Hat AI • Accelerated by vLLM</p>
        </div>
      </footer>
    </div>
  )
}

export default Gemma4Compare
