import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Tarjeta clara: borde fino y una sombra mínima teñida de noche. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-surface shadow-raise', className)} {...rest} />
}

type SectionProps = {
  title: string
  description?: string
  /** Botones o enlaces a la derecha del título */
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** Sin padding interno, para listas y tablas que llegan al borde */
  flush?: boolean
}

/** Tarjeta con título. Es el bloque con el que se arman casi todas las pantallas. */
export function Section({ title, description, actions, children, className, flush }: SectionProps) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 md:px-5 md:pt-5">
        <div className="min-w-0">
          <h2 className="display text-[1.3125rem] text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={cn(flush ? 'pt-3' : 'p-4 md:p-5')}>{children}</div>
    </Card>
  )
}

/** Fila de "dato: valor" para las fichas. */
export function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-32 shrink-0 text-sm text-ink-3">{label}</dt>
      <dd className="min-w-0 text-[0.9375rem] font-medium text-ink">{children}</dd>
    </div>
  )
}

/** Fila de recibo: etiqueta apagada a la izquierda, monto tabular a la derecha. */
export function ReceiptRow({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5', strong ? 'pt-3' : 'py-1.5')}>
      <span className={cn('min-w-0', strong ? 'text-[0.9375rem] font-bold text-ink' : 'text-[0.9375rem] text-ink-2')}>{label}</span>
      <span className={cn('tabular ml-auto shrink-0', strong ? 'dorsal text-[1.75rem] text-ink' : 'font-semibold text-ink')}>{value}</span>
    </div>
  )
}
