import { useEffect, useRef, useState, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { haptic, isStandalone } from '@/lib/pwa'

const THRESHOLD = 64
const MAX = 110

/**
 * Deslizar hacia abajo para actualizar, como en las apps.
 * Solo se activa en la app instalada: en el navegador ya existe el gesto nativo
 * y tener los dos a la vez confunde.
 */
export function PullToRefresh({
  onRefresh,
  onOffline,
  children,
}: {
  onRefresh: () => Promise<unknown>
  /** Se llama si se suelta sin conexión (no hay nada que actualizar) */
  onOffline?: () => void
  children: ReactNode
}) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const refreshingRef = useRef(false)

  useEffect(() => {
    if (!isStandalone()) return
    let startY: number | null = null
    let current = 0
    let armed = false

    const onStart = (event: TouchEvent) => {
      const blocked = refreshingRef.current || document.querySelector('dialog[open]') || event.touches.length !== 1
      startY = !blocked && window.scrollY <= 0 ? (event.touches[0]?.clientY ?? null) : null
    }
    const onMove = (event: TouchEvent) => {
      if (startY === null) return
      const dy = (event.touches[0]?.clientY ?? startY) - startY
      if (dy <= 0) {
        current = 0
        setPull(0)
        return
      }
      setDragging(true)
      // Resistencia: cuanto más se tira, menos avanza
      current = Math.min(MAX, dy * 0.45)
      setPull(current)
      if (!armed && current >= THRESHOLD) {
        armed = true
        haptic('tap')
      } else if (armed && current < THRESHOLD) {
        armed = false
      }
    }
    const onEnd = async () => {
      if (startY === null) return
      startY = null
      setDragging(false)
      armed = false
      if (current >= THRESHOLD && !navigator.onLine) {
        haptic('error')
        onOffline?.()
        setPull(0)
      } else if (current >= THRESHOLD) {
        refreshingRef.current = true
        setRefreshing(true)
        setPull(THRESHOLD)
        try {
          await onRefresh()
        } finally {
          refreshingRef.current = false
          setRefreshing(false)
          setPull(0)
        }
      } else {
        setPull(0)
      }
      current = 0
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [onRefresh, onOffline])

  const progress = Math.min(1, pull / THRESHOLD)

  return (
    <div className="relative">
      <div
        aria-hidden={!refreshing}
        role={refreshing ? 'status' : undefined}
        aria-label={refreshing ? 'Actualizando' : undefined}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{
          transform: `translateY(${pull - 44}px)`,
          opacity: progress,
          transition: dragging ? 'none' : 'transform 320ms var(--ease-drawer), opacity 200ms ease',
        }}
      >
        <span className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-brand-600 shadow-raise">
          <RefreshCw
            className={cn('size-5', refreshing && 'animate-[spin_700ms_linear_infinite]')}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          />
        </span>
      </div>
      <div
        style={{
          transform: pull ? `translateY(${pull * 0.6}px)` : undefined,
          transition: dragging ? 'none' : 'transform 320ms var(--ease-drawer)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
