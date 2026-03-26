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

        // Use a small delay to ensure state updates have completed
        setTimeout(() => {
          setStandardTokens(stdTokens => {
            setVllmTokens(vTokens => {
              // Calculate results using current state
              const standardTime = stdTokens.length > 0 ?
                stdTokens[stdTokens.length - 1].timestamp - stdTokens[0].timestamp : Infinity
              const vllmTime = vTokens.length > 0 ?
                vTokens[vTokens.length - 1].timestamp - vTokens[0].timestamp : Infinity

              console.log('Race times:', { standardTime, vllmTime, stdCount: stdTokens.length, vllmCount: vTokens.length })

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
                standardTPS: stdTokens[stdTokens.length - 1]?.tokens_per_sec || 0,
                vllmTPS: vTokens[vTokens.length - 1]?.tokens_per_sec || 0
              })

              return vTokens
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
        {/* Race Track - Always visible */}
        <RaceTrack
          standardTokens={standardTokens}
          vllmTokens={vllmTokens}
          raceState={raceState}
          winner={winner}
          wins={wins}
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
