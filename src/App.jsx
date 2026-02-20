import { useEffect, useState } from 'react'
import BootScreen from './components/BootScreen'
import ShowreelScreen from './components/ShowreelScreen'
import FileSystemScreen from './components/FileSystemScreen'
import AudioPlayer from './components/AudioPlayer'

function App() {
  const [stage, setStage] = useState('boot') // 'boot' | 'showreel' | 'filesystem'

  useEffect(() => {
    const handleKey = (event) => {
      if (stage === 'showreel') {
        if (
          event.key === 'Escape'
        ) {
          event.preventDefault()
          setStage('filesystem')
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [stage])

  return (
    <div className="app-root">
      <AudioPlayer />
      <div className="crt">
        <div className="screen-inner">
          {stage === 'boot' && (
            <BootScreen
              onComplete={() => {
                setStage('showreel')
              }}
            />
          )}
          {stage === 'showreel' && (
            <ShowreelScreen
              onContinue={() => {
                setStage('filesystem')
              }}
            />
          )}
          {stage === 'filesystem' && <FileSystemScreen />}
        </div>
      </div>
    </div>
  )
}

export default App
