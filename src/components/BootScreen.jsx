import { useEffect, useState } from 'react'

const ASCII_BANNER = [
  '    ╔══════════════════════════════════════════════════╗',
  '    ║  ░▒▓ MOTION DESIGNER · CREATIVE CV ▓▒░           ║',
  '    ║  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀     ║',
  '    ║  RELEASED BY MAKSIM ZOLIKOV · 2025               ║',
  '    ╚══════════════════════════════════════════════════╝',
  '',
]

const BOOT_LINES = [
  'КРУТОЕ CV v1.03',
  'Copyright (C) 2019-2025 Maksim Zolikov',
  '',
  'Проверка видеосистемы  .... ОК',
  'Проверка аудиоустройства .... ОК',
  'Память                  .... 65536K ОК',
  '',
  'Запуск SHOWREEL.EXE     ....'
]

const ALL_LINES = [...ASCII_BANNER, ...BOOT_LINES]
const TYPING_INTERVAL_MS = 12
const LINE_DELAY_MS = 40
const COMPLETE_DELAY_MS = 400

function BootScreen({ onComplete }) {
  const [lines, setLines] = useState(() => ALL_LINES.map(() => ''))
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalChars = ALL_LINES.reduce((sum, l) => sum + l.length, 0)
    let typed = 0
    for (let i = 0; i < currentLineIndex; i++) typed += ALL_LINES[i].length
    typed += charIndex
    setProgress(Math.min(100, Math.round((typed / totalChars) * 100)))
  }, [currentLineIndex, charIndex])

  useEffect(() => {
    const timeouts = []
    const fullLine = ALL_LINES[currentLineIndex] || ''

    if (charIndex < fullLine.length) {
      const t = setTimeout(() => {
        setLines((prev) => {
          const updated = [...prev]
          const current = updated[currentLineIndex] || ''
          updated[currentLineIndex] = current + fullLine.charAt(charIndex)
          return updated
        })
        setCharIndex((value) => value + 1)
      }, TYPING_INTERVAL_MS)
      timeouts.push(t)
    } else if (currentLineIndex < ALL_LINES.length - 1) {
      const t = setTimeout(() => {
        setCurrentLineIndex((index) => index + 1)
        setCharIndex(0)
      }, LINE_DELAY_MS)
      timeouts.push(t)
    } else {
      const t = setTimeout(() => {
        if (typeof onComplete === 'function') {
          onComplete()
        }
      }, COMPLETE_DELAY_MS)
      timeouts.push(t)
    }

    return () => timeouts.forEach((id) => clearTimeout(id))
  }, [currentLineIndex, charIndex, onComplete])

  return (
    <div className="terminal boot-screen">
      <div className="terminal-header">
        <span>КРЕАТИВНОЕ CV v2.0 — ЗАГРУЗКА</span>
        <span>[ ESC недоступен во время загрузки ]</span>
      </div>
      <div className="boot-content">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`boot-line ${index < ASCII_BANNER.length ? 'boot-line-banner' : ''}`}
          >
            {line}
            {index === currentLineIndex && <span className="boot-cursor" />}
          </div>
        ))}
      </div>
      <div className="boot-progress-wrapper">
        <div className="boot-progress-bar">
          <div className="boot-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="boot-progress-label">Загрузка: {progress}%</span>
      </div>
    </div>
  )
}

export default BootScreen

