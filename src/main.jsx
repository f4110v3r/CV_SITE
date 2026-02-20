import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary'

function init() {
  const root = document.getElementById('root')
  if (root) {
    try {
      createRoot(root).render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>,
      )
    } catch (e) {
      root.innerHTML = '<div style="color:#9efc9e;font-family:monospace;padding:20px;background:#000">Ошибка. <a href="." style="color:#9efc9e">Обновить</a></div>'
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
