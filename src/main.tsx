import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
// Primero: el aviso de instalación de Android llega muy temprano y hay que guardarlo
import './lib/pwa'
import './styles/index.css'

// Si se publicó una versión nueva mientras la app estaba abierta, algunos pedazos
// viejos ya no existen: se recarga una vez para tomar la versión nueva.
window.addEventListener('vite:preloadError', (event) => {
  if (!navigator.onLine || sessionStorage.getItem('cersap.recarga-por-version')) return
  event.preventDefault()
  sessionStorage.setItem('cersap.recarga-por-version', '1')
  window.location.reload()
})
// Si la app arrancó bien, se permite volver a recargar en el futuro
window.addEventListener('load', () => window.setTimeout(() => sessionStorage.removeItem('cersap.recarga-por-version'), 10_000))

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
