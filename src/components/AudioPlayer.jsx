import { useEffect, useRef, useState } from 'react'

const musicModules = import.meta.glob('../music/*.mp3', { eager: true })
const PLAYLIST = Object.entries(musicModules)
  .map(([path, mod]) => {
    const filename = path.split('/').pop()
    const name = filename.replace(/\.mp3$/i, '').replace(/[-_]/g, ' ')
    return { url: mod.default ?? mod, name }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

function formatTrackName(name) {
  return name || '—'
}

function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(() =>
    PLAYLIST.length > 0 ? Math.floor(Math.random() * PLAYLIST.length) : 0
  )
  const audioRef = useRef(null)

  const track = PLAYLIST[currentIndex]
  const hasTracks = PLAYLIST.length > 0

  useEffect(() => {
    if (!hasTracks) return
    const src = PLAYLIST[currentIndex]?.url
    if (!src) return
    const audio = new Audio(src)
    audio.volume = 0.35
    audioRef.current = audio

    const onEnded = () => {
      setCurrentIndex(() => {
        if (PLAYLIST.length <= 1) return 0
        return Math.floor(Math.random() * PLAYLIST.length)
      })
    }
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.pause()
      audio.removeEventListener('ended', onEnded)
    }
  }, [currentIndex, hasTracks])

  useEffect(() => {
    if (!audioRef.current || !hasTracks) return
    if (isPlaying) {
      audioRef.current.volume = 0.35
      audioRef.current.play().catch(() => {})
      setShowPanel(true)
      const t = setTimeout(() => setShowPanel(false), 4000)
      return () => clearTimeout(t)
    } else {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setShowPanel(false)
    }
  }, [isPlaying, currentIndex, hasTracks])

  if (!hasTracks) return null

  return (
    <>
      <button
        type="button"
        className="audio-toggle"
        onClick={() => setIsPlaying((p) => !p)}
        title={isPlaying ? 'Выключить музыку' : 'Включить музыку'}
        aria-label={isPlaying ? 'Выключить музыку' : 'Включить музыку'}
      >
        {isPlaying ? '■' : '▶'}
      </button>
      <div className={`audio-panel ${showPanel ? 'audio-panel-visible' : ''}`}>
        <span className="audio-panel-label">[ PLAY ]</span>
        <span className="audio-panel-track">{formatTrackName(track?.name)}</span>
      </div>
    </>
  )
}

export default AudioPlayer
