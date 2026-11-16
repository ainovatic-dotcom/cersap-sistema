import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useOnline } from '@/lib/pwa'

/**
 * Franja que avisa que no hay conexión. La app sigue abriendo (la cáscara está en
 * el celular), pero los datos no se guardan offline, así que conviene avisar.
 * Al volver la señal muestra "Volvió la conexión" un momento; los datos se
 * actualizan solos (TanStack Query vuelve a pedirlos al reconectar).
 */
export function OfflineBanner() {
  const online = useOnline()
  const wasOffline = useRef(!online)
  const [backOnline, setBackOnline] = useState(false)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
      setBackOnline(false)
      return
    }
    if (!wasOffline.current) return
    wasOffline.current = false
    setBackOnline(true)
    const timer = window.setTimeout(() => setBackOnline(false), 2500)
    return () => window.clearTimeout(timer)
  }, [online])

  if (online && !backOnline) return null

  return (
    // Va debajo del encabezado (no lo tapa ni bloquea sus botones) y no recibe toques
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[70] flex justify-center px-3">
      <p
        role="status"
        className={
          'franja-aviso flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-semibold shadow-raise ' +
          (online ? 'border-verde-600 bg-verde-600 text-white' : 'border-ambar-400 bg-ambar-50 text-ambar-800')
        }
      >
        {online ? <Wifi aria-hidden="true" className="size-4 shrink-0" /> : <WifiOff aria-hidden="true" className="size-4 shrink-0" />}
        {online ? 'Volvió la conexión' : 'Sin conexión: puede no estar al día'}
      </p>
    </div>
  )
}
