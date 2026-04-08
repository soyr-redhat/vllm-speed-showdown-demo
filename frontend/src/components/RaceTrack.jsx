import { useEffect, useState } from 'react'

function RaceTrack({ standardTokens, optimizedTokens, quantizedTokens, raceState, winner, wins }) {
  const [standardProgress, setStandardProgress] = useState(0)
  const [optimizedProgress, setOptimizedProgress] = useState(0)
  const [quantizedProgress, setQuantizedProgress] = useState(0)
  const [activeInfo, setActiveInfo] = useState(null) // 'standard', 'optimized', 'quantized', or null

  useEffect(() => {
    // Progress based on tokens generated - fastest racer (highest TPS) generates more tokens faster
    // When race finishes, show 100% for all completed racers
    const maxTokens = 100 // Expected max tokens from App.jsx

    if (raceState === 'finished') {
      // When finished, all racers that completed show 100%
      setStandardProgress(standardTokens.length > 0 ? 100 : 0)
      setOptimizedProgress(optimizedTokens.length > 0 ? 100 : 0)
      setQuantizedProgress(quantizedTokens.length > 0 ? 100 : 0)
    } else {
      // While racing, show progress based on token count
      // Fastest racer (highest TPS) fills bar faster by generating tokens faster
      setStandardProgress(Math.min((standardTokens.length / maxTokens) * 100, 100))
      setOptimizedProgress(Math.min((optimizedTokens.length / maxTokens) * 100, 100))
      setQuantizedProgress(Math.min((quantizedTokens.length / maxTokens) * 100, 100))
    }
  }, [standardTokens, optimizedTokens, quantizedTokens, raceState])

  const getTokensPerSec = (tokens) => {
    if (tokens.length === 0) return 0
    return tokens[tokens.length - 1]?.tokens_per_sec?.toFixed(2) || 0
  }

  const CrownIcon = () => (
    <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 3l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" />
    </svg>
  )

  const InfoButton = ({ onClick }) => (
    <button
      onClick={onClick}
      className="ml-2 w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xs text-gray-300 hover:text-white transition-all border border-gray-600 hover:border-gray-500"
      title="Learn more"
    >
      i
    </button>
  )

  const racerInfo = {
    standard: {
      title: 'Standard vLLM',
      icon: '🐢',
      color: 'orange',
      description: 'Baseline vLLM deployment with default configuration',
      model: 'Mistral-7B-Instruct-v0.3',
      features: [
        { name: 'PagedAttention', desc: 'Efficient KV cache memory management' },
        { name: 'Continuous Batching', desc: 'Process multiple requests without waiting' },
        { name: 'Eager Execution', desc: 'Runs without CUDA graph compilation' },
        { name: 'Standard GPU Utilization', desc: '90% GPU memory utilization' },
        { name: 'OpenAI-compatible API', desc: 'Drop-in replacement for OpenAI endpoints' }
      ],
      optimizations: 'Basic vLLM features without advanced optimizations'
    },
    optimized: {
      title: 'Optimized vLLM',
      icon: '⚡',
      color: 'blue',
      description: 'Enhanced vLLM with CUDA graphs and performance tuning',
      model: 'Mistral-7B-Instruct-v0.3',
      features: [
        { name: 'CUDA Graphs', desc: 'Pre-compiled execution graphs for 1.3-2x faster inference' },
        { name: 'Maximum GPU Utilization', desc: '98% GPU memory utilization for peak performance' },
        { name: 'Reduced Logging Overhead', desc: 'Disabled request logging to minimize latency' },
        { name: 'Optimized Block Size', desc: 'Smaller 16-token blocks for faster memory access' },
        { name: 'Tuned Sequence Handling', desc: '128 max sequences for optimal batching' },
        { name: 'Same Model Quality', desc: 'Identical model to Standard, just faster execution' }
      ],
      optimizations: 'CUDA graph optimization + latency tuning for faster inference'
    },
    quantized: {
      title: 'Quantized vLLM (W4A16)',
      icon: '🚀',
      color: 'green',
      description: 'Optimized vLLM with W4A16 quantization for efficiency',
      model: 'RedHatAI/Mistral-7B-Instruct-v0.3-quantized.w4a16',
      features: [
        { name: 'W4A16 Quantization', desc: '4-bit weights, 16-bit activations for 4x memory efficiency' },
        { name: 'All Core Optimizations', desc: 'Chunked prefill, prefix caching, increased batching' },
        { name: 'Maintained Accuracy', desc: 'W4A16 preserves model quality vs FP16' },
        { name: 'Maximum Efficiency', desc: 'Best tokens/sec per watt and per GB of memory' },
        { name: 'Smaller Memory Footprint', desc: 'Fit larger batches in same GPU memory' },
        { name: 'RedHat AI Optimized', desc: 'Professionally quantized by Red Hat AI team' }
      ],
      optimizations: 'Advanced vLLM configuration with W4A16 quantization for maximum efficiency'
    }
  }

  const InfoModal = ({ racer, onClose }) => {
    const info = racerInfo[racer]
    if (!info) return null

    const colorClasses = {
      orange: 'border-orange-500 from-orange-900/30',
      blue: 'border-blue-500 from-blue-900/30',
      green: 'border-green-500 from-green-900/30'
    }

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
          className={`bg-redhat-dark-surface rounded-lg max-w-2xl w-full border-2 ${colorClasses[info.color]} bg-gradient-to-br ${colorClasses[info.color]} to-gray-900 shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{info.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold">{info.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{info.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Model Info */}
            <div>
              <div className="text-sm text-gray-400 font-mono uppercase tracking-wider mb-1">Model</div>
              <div className="text-lg font-mono bg-redhat-dark-elevated px-3 py-2 rounded border border-gray-700">
                {info.model}
              </div>
            </div>

            {/* Features */}
            <div>
              <div className="text-sm text-gray-400 font-mono uppercase tracking-wider mb-3">Features & Capabilities</div>
              <div className="space-y-3">
                {info.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className={`text-${info.color}-400 mt-1 flex-shrink-0`}>✓</div>
                    <div>
                      <div className="font-bold text-sm">{feature.name}</div>
                      <div className="text-sm text-gray-400">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Level */}
            <div className={`bg-gradient-to-r from-${info.color}-900/20 to-transparent rounded-lg p-4 border border-${info.color}-500/30`}>
              <div className="text-sm text-gray-400 font-mono uppercase tracking-wider mb-1">Optimization Level</div>
              <div className="text-sm">{info.optimizations}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Info Modal */}
      {activeInfo && <InfoModal racer={activeInfo} onClose={() => setActiveInfo(null)} />}

      <div className="bg-redhat-dark-surface rounded-lg p-4">

        {/* Three-way race */}
        <div className="grid grid-cols-3 gap-4">
          {/* Standard Racer - LEFT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-2xl">🐢</div>
                <div>
                  <div className="font-bold text-orange-400 flex items-center">
                    Standard
                    <InfoButton onClick={() => setActiveInfo('standard')} />
                    {winner === 'standard' && <CrownIcon />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getTokensPerSec(standardTokens)} tok/s | {standardTokens.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-10 bg-redhat-dark-elevated rounded-lg overflow-hidden border-2 border-orange-500 mb-2">
              <div
                className="absolute h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-200"
                style={{ width: `${standardProgress}%` }}
              />
            </div>

            {/* Token output */}
            <div className={`bg-redhat-dark-elevated rounded p-3 h-48 overflow-y-auto text-sm font-mono border-2 transition-all ${
              winner === 'standard'
                ? 'border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
                : 'border-transparent'
            }`}>
              {standardTokens.map((token, i) => (
                <span key={i} className="text-orange-300">{token.token}</span>
              ))}
              {standardTokens.length === 0 && (
                <span className="text-gray-500">Waiting...</span>
              )}
            </div>
          </div>

          {/* Optimized Racer - CENTER */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-2xl">⚡</div>
                <div>
                  <div className="font-bold text-blue-400 flex items-center">
                    Optimized
                    <InfoButton onClick={() => setActiveInfo('optimized')} />
                    {winner === 'optimized' && <CrownIcon />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getTokensPerSec(optimizedTokens)} tok/s | {optimizedTokens.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-10 bg-redhat-dark-elevated rounded-lg overflow-hidden border-2 border-blue-500 mb-2">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-200"
                style={{ width: `${optimizedProgress}%` }}
              />
            </div>

            {/* Token output */}
            <div className={`bg-redhat-dark-elevated rounded p-3 h-48 overflow-y-auto text-sm font-mono border-2 transition-all ${
              winner === 'optimized'
                ? 'border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
                : 'border-transparent'
            }`}>
              {optimizedTokens.map((token, i) => (
                <span key={i} className="text-blue-300">{token.token}</span>
              ))}
              {optimizedTokens.length === 0 && (
                <span className="text-gray-500">Waiting...</span>
              )}
            </div>
          </div>

          {/* Quantized Racer - RIGHT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-2xl">🚀</div>
                <div>
                  <div className="font-bold text-green-400 flex items-center">
                    Quantized
                    <InfoButton onClick={() => setActiveInfo('quantized')} />
                    {winner === 'quantized' && <CrownIcon />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getTokensPerSec(quantizedTokens)} tok/s | {quantizedTokens.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-10 bg-redhat-dark-elevated rounded-lg overflow-hidden border-2 border-green-500 mb-2">
              <div
                className="absolute h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200"
                style={{ width: `${quantizedProgress}%` }}
              />
            </div>

            {/* Token output */}
            <div className={`bg-redhat-dark-elevated rounded p-3 h-48 overflow-y-auto text-sm font-mono border-2 transition-all ${
              winner === 'quantized'
                ? 'border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
                : 'border-transparent'
            }`}>
              {quantizedTokens.map((token, i) => (
                <span key={i} className="text-green-300">{token.token}</span>
              ))}
              {quantizedTokens.length === 0 && (
                <span className="text-gray-500">Waiting...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RaceTrack
