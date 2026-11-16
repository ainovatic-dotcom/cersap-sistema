import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { AuthShell } from '@/components/layout/AuthShell'

/** Errores de "no encontré un pedazo de la app": pasan si se publicó una versión nueva con la app abierta. */
function isChunkError(error: unknown) {
  const message = (error as { message?: string })?.message ?? ''
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i.test(message)
}

const RELOAD_KEY = 'cersap.recarga-por-version'

/**
 * Red de seguridad: si una pantalla falla al dibujarse, en vez de quedar en blanco
 * se muestra un mensaje con un botón para recargar. Si el error es porque la app
 * se actualizó mientras estaba abierta, recarga sola una vez.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (isChunkError(error) && navigator.onLine && !sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, '1')
      window.location.reload()
      return
    }
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    const offline = !navigator.onLine
    return (
      <AuthShell
        title={offline ? 'Sin conexión' : 'Algo salió mal'}
        description={
          offline
            ? 'Esta parte de la app todavía no está guardada en el celular. Volvé a intentar cuando tengas señal.'
            : 'No pudimos mostrar esta pantalla. Recargá la app para seguir; tus datos no se pierden.'
        }
      >
        <Button
          size="lg"
          block
          icon={<RefreshCw aria-hidden="true" />}
          onClick={() => {
            sessionStorage.removeItem(RELOAD_KEY)
            window.location.reload()
          }}
        >
          Recargar la app
        </Button>
      </AuthShell>
    )
  }
}
