import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/index.css'

// Sentry se carga solo si hay un DSN configurado, para no pesar en el arranque.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
    })
  })
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
