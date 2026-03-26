import { useEffect, useState } from 'react'

function RaceTrack({ standardTokens, vllmTokens, raceState, winner, wins }) {
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

  const CrownIcon = () => (
    <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 3l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" />
    </svg>
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">

        {/* Side-by-side racers */}
        <div className="grid grid-cols-2 gap-6">
          {/* vLLM Racer - LEFT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-2xl">🚀</div>
                <div>
                  <div className="font-bold text-green-400 flex items-center gap-2">
                    vLLM Optimized
                    {winner === 'vllm' && <CrownIcon />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getTokensPerSec(vllmTokens)} tokens/sec | {vllmTokens.length} tokens
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-12 bg-gray-900 rounded-lg overflow-hidden border-2 border-green-500 mb-3">
              <div
                className="absolute h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200"
                style={{ width: `${vllmProgress}%` }}
              />
            </div>

            {/* Token output */}
            <div className={`bg-gray-900 rounded p-3 h-64 overflow-y-auto text-sm font-mono border-2 transition-all ${
              winner === 'vllm'
                ? 'border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
                : 'border-transparent'
            }`}>
              {vllmTokens.map((token, i) => (
                <span key={i} className="text-green-300">{token.token}</span>
              ))}
              {vllmTokens.length === 0 && (
                <span className="text-gray-500">Waiting for input...</span>
              )}
            </div>
          </div>

          {/* Standard Racer - RIGHT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-2xl">🐢</div>
                <div>
                  <div className="font-bold text-orange-400 flex items-center gap-2">
                    Standard Inference
                    {winner === 'standard' && <CrownIcon />}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getTokensPerSec(standardTokens)} tokens/sec | {standardTokens.length} tokens
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-12 bg-gray-900 rounded-lg overflow-hidden border-2 border-orange-500 mb-3">
              <div
                className="absolute h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-200"
                style={{ width: `${standardProgress}%` }}
              />
            </div>

            {/* Token output */}
            <div className={`bg-gray-900 rounded p-3 h-64 overflow-y-auto text-sm font-mono border-2 transition-all ${
              winner === 'standard'
                ? 'border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
                : 'border-transparent'
            }`}>
              {standardTokens.map((token, i) => (
                <span key={i} className="text-orange-300">{token.token}</span>
              ))}
              {standardTokens.length === 0 && (
                <span className="text-gray-500">Waiting for input...</span>
              )}
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="mt-6 flex justify-center">
          <div className="bg-gray-900 rounded-lg p-4 inline-flex items-center gap-6">
            <div className="text-sm text-gray-400">Overall Score</div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-green-400 font-bold text-2xl">{wins.vllm}</div>
                <div className="text-xs text-gray-400">vLLM</div>
              </div>
              <div className="text-gray-600 font-bold text-xl">-</div>
              <div className="text-center">
                <div className="text-orange-400 font-bold text-2xl">{wins.standard}</div>
                <div className="text-xs text-gray-400">Standard</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RaceTrack
