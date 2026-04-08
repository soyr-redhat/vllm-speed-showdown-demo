function ComparisonStats({ standardMetrics, quantizedMetrics }) {
  const speedup = ((standardMetrics.totalTime - quantizedMetrics.totalTime) / standardMetrics.totalTime * 100).toFixed(1)
  const tpsImprovement = ((quantizedMetrics.tps - standardMetrics.tps) / standardMetrics.tps * 100).toFixed(1)
  const ttftImprovement = ((standardMetrics.ttft - quantizedMetrics.ttft) / standardMetrics.ttft * 100).toFixed(1)

  // FP8 vs BF16: ~46.5% memory savings (58.9 GiB → 31.5 GiB)
  const memorySavings = 46.5

  return (
    <div className="bg-redhat-dark-surface rounded-lg p-4 border-2 border-green-500">
      <h2 className="text-xl font-bold mb-4 text-center text-green-400">FP8 Quantization Benefits</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Memory Savings - Highlighted */}
        <div className="bg-gradient-to-br from-redhat-red/20 to-transparent rounded-lg p-4 border-2 border-redhat-red">
          <div className="text-center">
            <div className="text-5xl font-bold text-redhat-red mb-2 font-mono">{memorySavings}%</div>
            <div className="text-lg font-semibold text-redhat-red mb-1">Memory Savings</div>
            <div className="text-sm text-gray-300">59 GB → 31 GB</div>
            <div className="text-xs text-gray-400 mt-1">FP8 vs BF16 precision</div>
          </div>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-redhat-dark-elevated rounded p-3 text-center border border-green-500/30">
            <div className="text-2xl font-bold text-green-400 mb-1 font-mono">
              {speedup > 0 ? '+' : ''}{speedup}%
            </div>
            <div className="text-xs text-gray-400">Speed</div>
          </div>

          <div className="bg-redhat-dark-elevated rounded p-3 text-center border border-green-500/30">
            <div className="text-2xl font-bold text-green-400 mb-1 font-mono">
              {tpsImprovement > 0 ? '+' : ''}{tpsImprovement}%
            </div>
            <div className="text-xs text-gray-400">TPS</div>
          </div>

          <div className="bg-redhat-dark-elevated rounded p-3 text-center border border-green-500/30">
            <div className="text-2xl font-bold text-green-400 mb-1 font-mono">
              {ttftImprovement > 0 ? '+' : ''}{ttftImprovement}%
            </div>
            <div className="text-xs text-gray-400">TTFT</div>
          </div>

          <div className="bg-redhat-dark-elevated rounded p-3 text-center border border-redhat-grid-line">
            <div className="text-xl font-bold text-blue-400 mb-1 font-mono">&gt;99%</div>
            <div className="text-xs text-gray-400">Accuracy</div>
          </div>

          <div className="bg-redhat-dark-elevated rounded p-3 text-center border border-redhat-grid-line">
            <div className="text-xl font-bold text-orange-400 mb-1 font-mono">2x</div>
            <div className="text-xs text-gray-400">Smaller</div>
          </div>

          <div className="bg-redhat-dark-elevated rounded p-3 text-center border border-redhat-grid-line">
            <div className="text-xl font-bold text-green-400 mb-1 font-mono">100%</div>
            <div className="text-xs text-gray-400">Open</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComparisonStats
