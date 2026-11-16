import { cn } from '@/lib/cn'

export type StateSegment = {
  key: string
  label: string
  count: number
  /** Color del estado (fijo, ver docs/DISENO.md) */
  color: string
}

type StateBarProps = {
  segments: StateSegment[]
  title: string
  /** Nota al pie de la leyenda (por ejemplo, las exoneradas) */
  note?: string
  className?: string
}

/**
 * Barra segmentada: un todo (las cuotas del mes) dividido en estados.
 * Reglas (skill dataviz): 2 px de separación entre segmentos, sin línea de
 * base, leyenda siempre visible con nombre y cantidad (el color nunca va solo),
 * y el orden fijo para que pagadas y vencidas queden en los extremos.
 */
export function StateBar({ segments, title, note, className }: StateBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)
  const visible = segments.filter((segment) => segment.count > 0)

  return (
    <figure className={cn('m-0', className)}>
      <div
        role="img"
        aria-label={`${title}: ${segments.map((segment) => `${segment.count} ${segment.label.toLowerCase()}`).join(', ')}`}
        className="flex h-4 w-full gap-[2px] overflow-hidden rounded-full bg-[#e6ecf2]"
      >
        {visible.map((segment) => (
          <span
            key={segment.key}
            title={`${segment.label}: ${segment.count}`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(segment.count / Math.max(total, 1)) * 100}%`, background: segment.color }}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-start gap-2.5">
            <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-[4px]" style={{ background: segment.color }} />
            <span className="min-w-0 text-sm text-ink-2">
              {segment.label}{' '}
              {/* La cantidad y el porcentaje no se separan: si no entra, baja la línea entera */}
              <span className="whitespace-nowrap">
                <span className="tabular font-bold text-ink">{segment.count}</span>
                {total > 0 && <span className="tabular ml-1 text-ink-3">({Math.round((segment.count / total) * 100)} %)</span>}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-3 text-[0.8125rem] text-ink-3">{note}</p>}
    </figure>
  )
}
