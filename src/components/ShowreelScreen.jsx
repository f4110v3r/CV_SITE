function ShowreelScreen({ onContinue }) {
  const handleContinue = () => {
    if (typeof onContinue === 'function') onContinue()
  }

  return (
    <div className="terminal showreel-screen">
      <div className="terminal-header">
        <span>SHOWREEL.EXE — ПОЛНОЭКРАННЫЙ РЕЖИМ</span>
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
        <div className="showreel-caption">
          <div>шоу-рил устарел, лучше посмотрите актуальные работы в следующем окне</div>
          <div>[ новый в процессе создания ]</div>
        </div>
        <button
          type="button"
          className="showreel-continue-btn"
          onClick={handleContinue}
        >
          Перейти к работам
        </button>
      </div>
      <div className="status-bar">
        <span>ESC или кнопка ниже — продолжить</span>
      </div>
    </div>
  )
}

export default ShowreelScreen

