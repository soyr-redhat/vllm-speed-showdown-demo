function Results({ results, onReset }) {
  const isVllmWinner = results.winner === 'vLLM'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-redhat-dark-surface rounded-lg p-8">
        {/* Winner Announcement */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {isVllmWinner ? '🏆' : '🎉'}
          </div>
          <h2 className="text-4xl font-bold mb-2">
            {isVllmWinner ? 'vLLM Wins!' : 'Standard Inference Wins!'}
          </h2>
          <p className="text-gray-400">
            {isVllmWinner
              ? 'Optimized inference delivers superior performance'
              : 'An unexpected result!'
            }
          </p>
        </div>

        {/* Performance Stats Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* vLLM Stats */}
          <div className="bg-gradient-to-br from-green-900/30 to-gray-900 rounded-lg p-6 border border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🚀</div>
              <div className="font-bold text-xl text-green-400">vLLM Optimized</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-sm">Generation Time</div>
                <div className="text-2xl font-bold">{results.vllmTime.toFixed(3)}s</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Throughput</div>
                <div className="text-2xl font-bold">{results.vllmTPS.toFixed(2)} tok/s</div>
              </div>
            </div>
          </div>

          {/* Standard Stats */}
          <div className="bg-gradient-to-br from-orange-900/30 to-gray-900 rounded-lg p-6 border border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🐢</div>
              <div className="font-bold text-xl text-orange-400">Standard Inference</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-sm">Generation Time</div>
                <div className="text-2xl font-bold">{results.standardTime.toFixed(3)}s</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Throughput</div>
                <div className="text-2xl font-bold">{results.standardTPS.toFixed(2)} tok/s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Speedup Highlight */}
        <div className="bg-gradient-to-r from-redhat-red/20 to-transparent rounded-lg p-6 mb-8 border border-redhat-red">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm mb-1">Performance Improvement</div>
              <div className="text-4xl font-bold text-redhat-red">
                {results.speedup.toFixed(2)}x faster
              </div>
              <div className="text-gray-400 text-sm mt-1">
                {isVllmWinner
                  ? 'vLLM completed the task faster than standard inference'
                  : 'Comparative performance metric'
                }
              </div>
            </div>
            <div className="text-6xl">⚡</div>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="bg-redhat-dark-elevated rounded-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-3">Why vLLM is Faster</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>Continuous Batching:</strong> Processes multiple requests efficiently without waiting for all to complete</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>PagedAttention:</strong> Optimized memory management for KV cache reduces overhead</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>Kernel Optimizations:</strong> Custom CUDA kernels for faster token generation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>Dynamic Batching:</strong> Adapts to varying request patterns for maximum throughput</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onReset}
            className="flex-1 bg-redhat-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition"
          >
            Race Again 🔄
          </button>
          <button
            onClick={() => {
              // TODO: Navigate to stress test mode
              alert('Stress test mode coming soon!')
            }}
            className="flex-1 bg-redhat-dark-surface/80 text-white px-6 py-3 rounded-lg font-bold hover:bg-redhat-red/20 transition"
          >
            Try Stress Test 💪
          </button>
        </div>
      </div>

      {/* Educational Footer */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>
          Learn more about{' '}
          <a href="https://vllm.ai" target="_blank" rel="noopener noreferrer" className="text-redhat-red hover:underline">
            vLLM
          </a>
          {' '}and{' '}
          <a href="https://www.redhat.com/en/technologies/cloud-computing/openshift" target="_blank" rel="noopener noreferrer" className="text-redhat-red hover:underline">
            Red Hat OpenShift AI
          </a>
        </p>
      </div>
    </div>
  )
}

export default Results
