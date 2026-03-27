import { useState, useEffect } from 'react'
import RaceTrack from './components/RaceTrack'
import PromptSelector from './components/PromptSelector'
import Results from './components/Results'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [raceState, setRaceState] = useState('idle') // idle, racing, finished
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [standardTokens, setStandardTokens] = useState([])
  const [optimizedTokens, setOptimizedTokens] = useState([])
  const [quantizedTokens, setQuantizedTokens] = useState([])
  const [results, setResults] = useState(null)
  const [winner, setWinner] = useState(null)
  const [wins, setWins] = useState({ standard: 0, optimized: 0, quantized: 0 })

  // Load global wins on mount and poll for updates
  useEffect(() => {
    const loadWins = async () => {
      try {
        const response = await fetch(`${API_URL}/wins`)
        const data = await response.json()
        setWins(data)
      } catch (error) {
        console.error('Failed to load wins:', error)
      }
    }

    loadWins()
    // Poll for updates every 5 seconds
    const interval = setInterval(loadWins, 5000)
    return () => clearInterval(interval)
  }, [])

  const startRace = () => {
    if (!selectedPrompt.trim()) {
      alert('Please enter or select a prompt')
      return
    }

    setRaceState('racing')
    setStandardTokens([])
    setOptimizedTokens([])
    setQuantizedTokens([])
    setResults(null)
    setWinner(null)

    // Convert http/https to ws/wss for WebSocket
    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
    console.log('Connecting to WebSocket:', `${wsUrl}/ws/race`)
    const ws = new WebSocket(`${wsUrl}/ws/race`)

    ws.onopen = () => {
      ws.send(JSON.stringify({
        prompt: selectedPrompt,
        category: 'short',
        max_tokens: 100
      }))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'token') {
        const token = message.data
        if (token.racer === 'standard') {
          setStandardTokens(prev => [...prev, token])
        } else if (token.racer === 'optimized') {
          setOptimizedTokens(prev => [...prev, token])
        } else {
          setQuantizedTokens(prev => [...prev, token])
        }
      } else if (message.type === 'race_complete') {
        setRaceState('finished')
        ws.close()

        // Use a small delay to ensure state updates have completed
        setTimeout(() => {
          setStandardTokens(stdTokens => {
            setOptimizedTokens(optTokens => {
              setQuantizedTokens(qTokens => {
                // Calculate results using current state
                const standardTime = stdTokens.length > 0 ?
                  stdTokens[stdTokens.length - 1].timestamp - stdTokens[0].timestamp : Infinity
                const optimizedTime = optTokens.length > 0 ?
                  optTokens[optTokens.length - 1].timestamp - optTokens[0].timestamp : Infinity
                const quantizedTime = qTokens.length > 0 ?
                  qTokens[qTokens.length - 1].timestamp - qTokens[0].timestamp : Infinity

                console.log('Race times:', {
                  standardTime, optimizedTime, quantizedTime,
                  stdCount: stdTokens.length,
                  optCount: optTokens.length,
                  qCount: qTokens.length
                })

                // Find the winner (fastest time)
                const times = { standard: standardTime, optimized: optimizedTime, quantized: quantizedTime }
                const raceWinner = Object.keys(times).reduce((a, b) => times[a] < times[b] ? a : b)
                setWinner(raceWinner)

                // Update win counts on backend (persistent across all users)
                fetch(`${API_URL}/wins/${raceWinner}`, { method: 'POST' })
                  .then(response => response.json())
                  .then(updatedWins => setWins(updatedWins))
                  .catch(error => console.error('Failed to update wins:', error))

                setResults({
                  winner: raceWinner.charAt(0).toUpperCase() + raceWinner.slice(1),
                  standardTime,
                  optimizedTime,
                  quantizedTime,
                  optimizedSpeedup: standardTime / optimizedTime || 1,
                  quantizedSpeedup: standardTime / quantizedTime || 1,
                  standardTPS: stdTokens[stdTokens.length - 1]?.tokens_per_sec || 0,
                  optimizedTPS: optTokens[optTokens.length - 1]?.tokens_per_sec || 0,
                  quantizedTPS: qTokens[qTokens.length - 1]?.tokens_per_sec || 0
                })

                return qTokens
              })
              return optTokens
            })
            return stdTokens
          })
        }, 100)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setRaceState('idle')
      alert('Connection error. Check console for details.')
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
    }
  }

  const reset = () => {
    setRaceState('idle')
    setStandardTokens([])
    setOptimizedTokens([])
    setQuantizedTokens([])
    setResults(null)
    setWinner(null)
  }

  return (
    <div className="min-h-screen bg-redhat-dark-bg text-white">
      {/* Red Hat Brand Visual Elements */}
      <div className="grid-background"></div>

      <header className="bg-redhat-dark-surface border-b border-redhat-grid-line relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left: Title */}
            <div>
              <h1 className="text-3xl font-display font-bold text-redhat-red">Speed Showdown</h1>
              <p className="text-redhat-text-secondary mt-1 font-mono text-xs uppercase tracking-wider">Pillar 02 / Inference Performance Demo</p>
            </div>

            {/* Center: Score Counter */}
            <div className="flex justify-center">
              <div className="bg-redhat-dark-elevated rounded-lg px-6 py-3 flex items-center gap-3 border border-redhat-grid-line">
                <div className="text-center">
                  <div className="text-orange-400 font-bold text-2xl font-mono">{wins.standard}</div>
                  <div className="text-xs text-gray-400">Standard</div>
                </div>
                <div className="text-gray-600 font-bold text-xl">-</div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold text-2xl font-mono">{wins.optimized}</div>
                  <div className="text-xs text-gray-400">Optimized</div>
                </div>
                <div className="text-gray-600 font-bold text-xl">-</div>
                <div className="text-center">
                  <div className="text-green-400 font-bold text-2xl font-mono">{wins.quantized}</div>
                  <div className="text-xs text-gray-400">Quantized</div>
                </div>
              </div>
            </div>

            {/* Right: Powered by */}
            <div className="text-right">
              <div className="text-sm font-mono text-redhat-text-tertiary uppercase tracking-wider">Powered by</div>
              <div className="text-redhat-red font-display font-bold text-lg">Red Hat OpenShift AI</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 relative z-10">
        {/* Race Track - Always visible */}
        <RaceTrack
          standardTokens={standardTokens}
          optimizedTokens={optimizedTokens}
          quantizedTokens={quantizedTokens}
          raceState={raceState}
          winner={winner}
          wins={wins}
        />

        {/* Prompt Input - Always visible below */}
        <div className="mt-4">
          <PromptSelector
            selectedPrompt={selectedPrompt}
            setSelectedPrompt={setSelectedPrompt}
            onStart={startRace}
            isRacing={raceState === 'racing'}
          />
        </div>
      </main>

      <footer className="bg-redhat-dark-surface border-t border-redhat-grid-line mt-4 py-4 relative z-10">
        <div className="container mx-auto px-4 text-center font-mono text-redhat-text-tertiary text-xs uppercase tracking-wider">
          <p>Built with open source technologies | Red Hat AI - Four Pillars Demo</p>
        </div>
      </footer>
    </div>
  )
}

export default App
