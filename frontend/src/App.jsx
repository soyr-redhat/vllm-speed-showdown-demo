import { useState } from 'react'
import RaceTrack from './components/RaceTrack'
import PromptSelector from './components/PromptSelector'
import Results from './components/Results'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [raceState, setRaceState] = useState('idle') // idle, racing, finished
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [standardTokens, setStandardTokens] = useState([])
  const [vllmTokens, setVllmTokens] = useState([])
  const [results, setResults] = useState(null)

  const startRace = () => {
    if (!selectedPrompt.trim()) {
      alert('Please enter or select a prompt')
      return
    }

    setRaceState('racing')
    setStandardTokens([])
    setVllmTokens([])
    setResults(null)

    const wsUrl = API_URL.replace('http', 'ws')
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
        } else {
          setVllmTokens(prev => [...prev, token])
        }
      } else if (message.type === 'race_complete') {
        setRaceState('finished')
        ws.close()

        // Calculate results
        const standardTime = standardTokens.length > 0 ?
          standardTokens[standardTokens.length - 1].timestamp - standardTokens[0].timestamp : 0
        const vllmTime = vllmTokens.length > 0 ?
          vllmTokens[vllmTokens.length - 1].timestamp - vllmTokens[0].timestamp : 0

        setResults({
          winner: vllmTime < standardTime ? 'vLLM' : 'Standard',
          speedup: standardTime / vllmTime || 1,
          standardTime,
          vllmTime,
          standardTPS: standardTokens[standardTokens.length - 1]?.tokens_per_sec || 0,
          vllmTPS: vllmTokens[vllmTokens.length - 1]?.tokens_per_sec || 0
        })
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setRaceState('idle')
      alert('Connection error. Make sure the backend is running.')
    }
  }

  const reset = () => {
    setRaceState('idle')
    setStandardTokens([])
    setVllmTokens([])
    setResults(null)
  }

  return (
    <div className="min-h-screen bg-redhat-dark text-white">
      <header className="bg-black border-b border-redhat-red">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-redhat-red">Speed Showdown</h1>
              <p className="text-gray-400 mt-1">vLLM Inference Demo - Four Pillars of AI</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Powered by</div>
              <div className="text-redhat-red font-bold">Red Hat OpenShift</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {raceState === 'idle' && (
          <PromptSelector
            selectedPrompt={selectedPrompt}
            setSelectedPrompt={setSelectedPrompt}
            onStart={startRace}
          />
        )}

        {raceState === 'racing' && (
          <RaceTrack
            standardTokens={standardTokens}
            vllmTokens={vllmTokens}
          />
        )}

        {raceState === 'finished' && results && (
          <Results results={results} onReset={reset} />
        )}
      </main>

      <footer className="bg-black border-t border-gray-800 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Built with open source technologies | Red Hat AI - Four Pillars Demo</p>
        </div>
      </footer>
    </div>
  )
}

export default App
