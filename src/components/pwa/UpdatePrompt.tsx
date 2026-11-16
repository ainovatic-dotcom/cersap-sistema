import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'

const HOUR = 60 * 60 * 1000

/**
 * Registra el service worker y avisa cuando hay una versión nueva.
 * No recarga solo: la persona elige cuándo, así nunca se corta un pago a la mitad.
 * Busca actualizaciones cada hora y cada vez que se vuelve a la app.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (navigator.onLine) void registration.update()
      }
      window.setInterval(check, HOUR)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  if (!needRefresh) return null

  return (
    <div className="aviso-flotante pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4">
      <div
        role="status"
        className="toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-card bg-noche-900 py-2.5 pl-4 pr-2 text-white shadow-float"
      >
        <RefreshCw aria-hidden="true" className="size-[18px] shrink-0 text-celeste" />
        <p className="min-w-0 flex-1 text-[0.9375rem] font-medium">Hay una versión nueva de la app.</p>
        <Button size="sm" onClick={() => void updateServiceWorker(true)}>
          Actualizar
        </Button>
        <IconButton label="Más tarde" onDark onClick={() => setNeedRefresh(false)}>
          <X />
        </IconButton>
      </div>
    </div>
  )
}
