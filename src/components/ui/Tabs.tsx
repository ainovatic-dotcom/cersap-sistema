import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export type TabItem<T extends string> = { value: T; label: string; count?: number }

type TabsProps<T extends string> = {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  /** Nombre del grupo, para lectores de pantalla */
  label: string
  className?: string
}

/**
 * Pestañas para filtrar una lista. El fondo blanco de la pestaña activa se
 * desliza hacia la nueva: muestra de dónde viene y a dónde va el cambio.
 */
export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[aria-selected="true"]')
      if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [value, items])

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cn('relative flex gap-1 overflow-x-auto rounded-control bg-[#dfe7ef] p-1 scrollbar-none', className)}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="tab-indicator absolute bottom-1 left-0 top-1 rounded-[9px] bg-surface shadow-[0_1px_3px_rgb(10_31_53/0.14)]"
          style={{ translate: `${indicator.left}px 0`, width: indicator.width }}
        />
      )}
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative z-10 flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] px-3.5 text-sm font-semibold transition-colors duration-150 pointer-coarse:h-11',
              selected ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'tabular rounded-full px-1.5 text-xs font-bold',
                  selected ? 'bg-brand-100 text-brand-800' : 'text-ink-3',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
