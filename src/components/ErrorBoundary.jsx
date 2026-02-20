import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000',
          color: '#9efc9e',
          fontFamily: 'monospace',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p>Ошибка загрузки. Обновите страницу.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#2a5f2a',
              color: '#9efc9e',
              border: '1px solid #9efc9e',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Обновить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
