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
  const [winner, setWinner] = useState(null)
  const [wins, setWins] = useState({ vllm: 0, standard: 0 })

  const startRace = () => {
    if (!selectedPrompt.trim()) {
      alert('Please enter or select a prompt')
      return
    }

    setRaceState('racing')
    setStandardTokens([])
    setVllmTokens([])
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

        const raceWinner = vllmTime < standardTime ? 'vllm' : 'standard'
        setWinner(raceWinner)

        // Update win counts
        setWins(prev => ({
          ...prev,
          [raceWinner]: prev[raceWinner] + 1
        }))

        setResults({
          winner: raceWinner === 'vllm' ? 'vLLM' : 'Standard',
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
      alert('Connection error. Check console for details.')
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
    }
  }

  const reset = () => {
    setRaceState('idle')
    setStandardTokens([])
    setVllmTokens([])
    setResults(null)
    setWinner(null)
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
              <div className="text-redhat-red font-bold">Red Hat OpenShift AI</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Overall Score */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Overall Score</div>
              <div className="flex items-center gap-6">
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

        {/* Race Track - Always visible */}
        <RaceTrack
          standardTokens={standardTokens}
          vllmTokens={vllmTokens}
          raceState={raceState}
          winner={winner}
        />

        {/* Prompt Input - Always visible below */}
        <div className="mt-8">
          <PromptSelector
            selectedPrompt={selectedPrompt}
            setSelectedPrompt={setSelectedPrompt}
            onStart={startRace}
            isRacing={raceState === 'racing'}
          />
        </div>
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
