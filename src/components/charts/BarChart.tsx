import { useState } from 'react'
import { cn } from '@/lib/cn'

export type Bar = {
  key: string
  /** Etiqueta corta debajo de la barra ("Nov") */
  label: string
  /** Nombre completo para el tooltip y la tabla ("Noviembre 2026") */
  fullLabel: string
  value: number
  /** La barra destacada (por ejemplo, el mes actual) lleva el valor escrito */
  highlight?: boolean
}

type BarChartProps = {
  bars: Bar[]
  /** Cómo se escribe un valor ("Gs. 21.300.000") */
  format: (value: number) => string
  /** Versión corta para la etiqueta de la barra destacada ("21,3 M") */
  formatShort?: (value: number) => string
  /** Título del gráfico, para lectores de pantalla y la tabla */
  title: string
  height?: number
  className?: string
}

// Las barras crecen una sola vez por carga de página, no en cada visita al panel.
let alreadyAnimated = false

/**
 * Gráfico de columnas de una sola serie, sobre fondo blanco.
 * Reglas (skill dataviz): barras de 24 px como máximo, punta redondeada de 4 px y
 * base recta, una sola línea de base, valor escrito solo en la barra destacada,
 * tooltip al pasar o enfocar cada barra y una tabla oculta para lectores de pantalla.
 * Colores validados con validate_palette.js: brand-300 (meses anteriores) y brand-600
 * (mes actual). brand-300 queda en 2:1 contra el blanco, por eso el tooltip y la tabla.
 */
export function BarChart({ bars, format, formatShort = format, title, height = 150, className }: BarChartProps) {
  const [animate] = useState(() => {
    const first = !alreadyAnimated
    alreadyAnimated = true
    return first
  })
  const [active, setActive] = useState<string | null>(null)
  const max = Math.max(1, ...bars.map((bar) => bar.value))
  // Retardos que se achican: la ola se siente natural y no como un metrónomo
  const delays = [0, 45, 80, 110, 135, 155, 170, 182]

  return (
    <figure className={cn('m-0', className)}>
      <div className="relative" style={{ height }} role="img" aria-label={title}>
        {/* Líneas guía, muy tenues */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 border-t border-line-strong" />

        <div className="absolute inset-0 flex items-end justify-between gap-2 px-1">
          {bars.map((bar, index) => {
            const pct = (bar.value / max) * 100
            const isActive = active === bar.key
            return (
              <div key={bar.key} className="relative flex h-full flex-1 items-end justify-center">
                {(bar.highlight || isActive) && (
                  <span
                    className={cn(
                      'tabular pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap text-xs font-bold',
                      isActive ? 'rounded-md bg-ink px-2 py-1 text-white shadow-float' : 'text-ink',
                    )}
                    style={{ left: '50%', bottom: `calc(${Math.max(pct, 2)}% + 6px)` }}
                  >
                    {isActive ? `${bar.fullLabel}: ${format(bar.value)}` : formatShort(bar.value)}
                  </span>
                )}
                {/* Zona de contacto más grande que la barra */}
                <button
                  type="button"
                  aria-label={`${bar.fullLabel}: ${format(bar.value)}`}
                  onMouseEnter={() => setActive(bar.key)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(bar.key)}
                  onBlur={() => setActive(null)}
                  className="group flex h-full w-full items-end justify-center rounded-md focus-visible:outline-offset-0"
                >
                  <span
                    className={cn(
                      'block w-full max-w-6 rounded-t-[4px] transition-colors duration-150',
                      animate && 'crecer',
                      bar.highlight ? 'bg-brand-600' : 'bg-brand-300 group-hover:bg-brand-400',
                    )}
                    style={{ height: `${Math.max(pct, bar.value > 0 ? 2 : 0)}%`, ['--d' as string]: `${delays[index] ?? 190}ms` }}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>
      <div aria-hidden="true" className="mt-2 flex justify-between gap-2 px-1">
        {bars.map((bar) => (
          <span
            key={bar.key}
            className={cn('flex-1 text-center text-xs font-semibold', bar.highlight ? 'text-ink' : 'text-ink-3')}
          >
            {bar.label}
          </span>
        ))}
      </div>

      {/* Vista de tabla para lectores de pantalla */}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.key}>
              <th scope="row">{bar.fullLabel}</th>
              <td>{format(bar.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
