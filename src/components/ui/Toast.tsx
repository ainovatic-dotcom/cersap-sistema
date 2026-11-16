import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'

type ToastKind = 'success' | 'error'
type ToastItem = { id: number; kind: ToastKind; message: string }

type ToastApi = {
  /** Confirma que algo salió bien: toast.success('Pago confirmado') */
  success: (message: string) => void
  /** Muestra un error. Acepta el error tal cual viene de Supabase. */
  error: (error: unknown) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/**
 * Avisos cortos. Entran desde abajo (transición CSS, se puede interrumpir si
 * llegan varios seguidos) y se van solos. Los errores duran más.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++
    setItems((current) => [...current.slice(-2), { id, kind, message }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), kind === 'error' ? 6000 : 3500)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (error) => push('error', typeof error === 'string' ? error : errorMessage(error)),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.kind === 'error' ? 'alert' : 'status'}
            className={cn(
              'toast pointer-events-auto flex max-w-md items-start gap-2.5 rounded-control px-4 py-3 text-[15px] font-medium text-white shadow-float',
              item.kind === 'error' ? 'bg-rojo-700' : 'bg-noche-900',
            )}
          >
            {item.kind === 'error' ? (
              <CircleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
            ) : (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-verde-400" />
            )}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast tiene que usarse dentro de <ToastProvider>')
  return api
}
