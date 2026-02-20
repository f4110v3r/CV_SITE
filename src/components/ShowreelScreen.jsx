function ShowreelScreen({ onContinue }) {
  const handleContinue = () => {
    if (typeof onContinue === 'function') onContinue()
  }

  return (
    <div className="terminal showreel-screen">
      <div className="terminal-header" onClick={handleContinue} style={{ cursor: 'pointer' }}>
        <span>SHOWREEL.EXE — ПОЛНОЭКРАННЫЙ РЕЖИМ</span>
        <span>[ ESC / ENTER / КЛИК — ПРОДОЛЖИТЬ ]</span>
      </div>
      <div className="showreel-main">
        <div className="showreel-ascii">╔══ SHOWREEL.EXE — FULLSCREEN MODE ════════════════════╗</div>
        <div className="showreel-frame">
          <video
            className="showreel-video"
            src={new URL('../showreel.mp4', import.meta.url).href}
            autoPlay
            muted
            loop
            playsInline
            controls
          />
        </div>
        <div className="showreel-caption" onClick={handleContinue} style={{ cursor: 'pointer' }}>
          <div>шоу-рил устарел, лучше посмотрите актуальные работы в следующем окне</div>
          <div>[ новый в процессе создания ]</div>
        </div>
      </div>
      <div className="status-bar" onClick={handleContinue} style={{ cursor: 'pointer' }}>
        <span>PLAYER</span>
        <span>Нажмите ESC, чтобы перейти ко всемиу остальному</span>
      </div>
    </div>
  )
}

export default ShowreelScreen

