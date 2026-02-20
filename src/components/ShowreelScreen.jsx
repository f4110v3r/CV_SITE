function ShowreelScreen({ onContinue }) {
  const handleClick = () => {
    if (typeof onContinue === 'function') {
      onContinue()
    }
  }

  return (
    <div className="terminal showreel-screen" onClick={handleClick}>
      <div className="terminal-header">
        <span>SHOWREEL.EXE — ПОЛНОЭКРАННЫЙ РЕЖИМ</span>
        <span>[ ESC / ENTER / КЛИК — ПРОДОЛЖИТЬ ]</span>
      </div>
      <div className="showreel-main">
        <div className="showreel-ascii">╔══ SHOWREEL.EXE — FULLSCREEN MODE ════════════════════╗</div>
        <div className="showreel-frame">
          <video
            className="showreel-video"
            src="/showreel.mp4"
            autoPlay
            muted
            loop
            playsInline
            controls
          />
        </div>
        <div className="showreel-caption">
          <div>шоу-рил устарел, лучше посмотрите актуальные работы в следующем окне</div>
          <div>[ новый в процессе создания ]</div>
        </div>
      </div>
      <div className="status-bar">
        <span>PLAYER</span>
        <span>Нажмите ESC, чтобы перейти ко всемиу остальному</span>
      </div>
    </div>
  )
}

export default ShowreelScreen

