import { useEffect, useRef } from 'react'

function MetricsPanel({ title, model, data, isStreaming, accentColor = 'orange', showBadge = false }) {
  const textRef = useRef(null)

  useEffect(() => {
    if (textRef.current && isStreaming) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [data.text, isStreaming])

  const accentClasses = {
    orange: 'border-orange-500',
    green: 'border-green-500'
  }

  const badgeClasses = {
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    green: 'bg-green-500/20 text-green-300 border-green-500/50'
  }

  const iconClasses = {
    orange: 'text-orange-400',
    green: 'text-green-400'
  }

  return (
    <div className={`bg-redhat-dark-surface rounded-lg border-2 ${accentClasses[accentColor]} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className={`text-lg font-bold mb-0.5 ${iconClasses[accentColor]}`}>{title}</h2>
          <p className="text-xs text-gray-400 font-mono">{model}</p>
        </div>
        {showBadge && (
          <span className={`px-2 py-1 rounded text-xs font-semibold border ${badgeClasses[accentColor]}`}>
            FP8
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-redhat-dark-elevated rounded p-2 border border-redhat-grid-line">
            <div className="text-xs text-gray-400 mb-1">TPS</div>
            <div className={`text-lg font-bold font-mono ${iconClasses[accentColor]}`}>{data.metrics.tps.toFixed(1)}</div>
          </div>
          <div className="bg-redhat-dark-elevated rounded p-2 border border-redhat-grid-line">
            <div className="text-xs text-gray-400 mb-1">TTFT</div>
            <div className={`text-lg font-bold font-mono ${iconClasses[accentColor]}`}>{data.metrics.ttft.toFixed(0)}ms</div>
          </div>
          <div className="bg-redhat-dark-elevated rounded p-2 border border-redhat-grid-line">
            <div className="text-xs text-gray-400 mb-1">Time</div>
            <div className={`text-lg font-bold font-mono ${iconClasses[accentColor]}`}>{data.metrics.totalTime.toFixed(1)}s</div>
          </div>
          <div className="bg-redhat-dark-elevated rounded p-2 border border-redhat-grid-line">
            <div className="text-xs text-gray-400 mb-1">Tokens</div>
            <div className={`text-lg font-bold font-mono ${iconClasses[accentColor]}`}>{data.metrics.tokenCount}</div>
          </div>
        </div>

        <div className="bg-redhat-dark-elevated rounded p-3 h-48 overflow-y-auto border border-redhat-grid-line" ref={textRef}>
          <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
            <span className="font-mono uppercase tracking-wider">Output</span>
            {isStreaming && (
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${accentColor}-400 opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 bg-${accentColor}-500`}></span>
                </span>
                <span className="text-xs">Streaming...</span>
              </span>
            )}
          </div>
          <div className="text-white whitespace-pre-wrap font-mono text-xs leading-relaxed">
            {data.text || <span className="text-gray-600 italic">Waiting for response...</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsPanel
