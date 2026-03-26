import { useEffect, useState } from 'react'

function RaceTrack({ standardTokens, vllmTokens }) {
  const [standardProgress, setStandardProgress] = useState(0)
  const [vllmProgress, setVllmProgress] = useState(0)

  useEffect(() => {
    // Update progress based on token count (each token = progress increment)
    const maxTokens = 100 // match the max in App.jsx
    setStandardProgress((standardTokens.length / maxTokens) * 100)
    setVllmProgress((vllmTokens.length / maxTokens) * 100)
  }, [standardTokens, vllmTokens])

  const getTokensPerSec = (tokens) => {
    if (tokens.length === 0) return 0
    return tokens[tokens.length - 1]?.tokens_per_sec?.toFixed(2) || 0
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Race in Progress! 🏁</h2>

        {/* vLLM Racer */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🚀</div>
              <div>
                <div className="font-bold text-lg text-green-400">vLLM Optimized</div>
                <div className="text-sm text-gray-400">
                  {getTokensPerSec(vllmTokens)} tokens/sec | {vllmTokens.length} tokens
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {vllmProgress.toFixed(0)}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-16 bg-gray-900 rounded-lg overflow-hidden border-2 border-green-500">
            <div
              className="absolute h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200"
              style={{ width: `${vllmProgress}%` }}
            />
            {/* Race car icon */}
            <div
              className="absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-200"
              style={{ left: `${Math.min(vllmProgress, 95)}%` }}
            >
              🏎️
            </div>
          </div>

          {/* Token output */}
          <div className="mt-4 bg-gray-900 rounded p-4 h-32 overflow-y-auto text-sm font-mono">
            {vllmTokens.map((token, i) => (
              <span key={i} className="text-green-300">{token.token}</span>
            ))}
            {vllmTokens.length === 0 && (
              <span className="text-gray-500">Waiting to start...</span>
            )}
          </div>
        </div>

        {/* Standard Racer */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🐢</div>
              <div>
                <div className="font-bold text-lg text-orange-400">Standard Inference</div>
                <div className="text-sm text-gray-400">
                  {getTokensPerSec(standardTokens)} tokens/sec | {standardTokens.length} tokens
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {standardProgress.toFixed(0)}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-16 bg-gray-900 rounded-lg overflow-hidden border-2 border-orange-500">
            <div
              className="absolute h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-200"
              style={{ width: `${standardProgress}%` }}
            />
            {/* Race car icon */}
            <div
              className="absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-200"
              style={{ left: `${Math.min(standardProgress, 95)}%` }}
            >
              🚗
            </div>
          </div>

          {/* Token output */}
          <div className="mt-4 bg-gray-900 rounded p-4 h-32 overflow-y-auto text-sm font-mono">
            {standardTokens.map((token, i) => (
              <span key={i} className="text-orange-300">{token.token}</span>
            ))}
            {standardTokens.length === 0 && (
              <span className="text-gray-500">Waiting to start...</span>
            )}
          </div>
        </div>

        {/* Live comparison stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Speed Difference</div>
            <div className="text-2xl font-bold text-redhat-red">
              {vllmTokens.length > 0 && standardTokens.length > 0
                ? `${((getTokensPerSec(vllmTokens) / (getTokensPerSec(standardTokens) || 1)) || 1).toFixed(1)}x`
                : '-'
              }
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">vLLM Leading By</div>
            <div className="text-2xl font-bold text-green-400">
              {vllmTokens.length - standardTokens.length > 0
                ? `+${vllmTokens.length - standardTokens.length} tokens`
                : '-'
              }
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Current Leader</div>
            <div className="text-2xl font-bold">
              {vllmTokens.length > standardTokens.length ? '🚀 vLLM' :
               standardTokens.length > vllmTokens.length ? '🐢 Standard' : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RaceTrack
