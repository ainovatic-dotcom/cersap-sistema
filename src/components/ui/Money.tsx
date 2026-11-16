import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

type MoneyProps = {
  value: number | null | undefined
  /** Tamaño "dorsal": la cifra grande que domina una tarjeta */
  size?: 'md' | 'lg' | 'xl' | 'hero'
  className?: string
}

const SIZES = { md: 'text-[1.5rem]', lg: 'text-[2.25rem]', xl: 'text-[3.25rem]', hero: 'text-[3.75rem] md:text-[4.75rem]' }

/**
 * Monto destacado, con el "Gs." chico al lado. Hereda el color del contenedor
 * (así sirve igual sobre claro y sobre noche). Para texto corrido usá formatMoney().
 */
export function Money({ value, size = 'md', className }: MoneyProps) {
  return (
    <span className={cn('dorsal inline-flex items-baseline gap-1.5', SIZES[size], className)}>
      <span className="text-[0.42em] font-bold tracking-normal opacity-60">Gs.</span>
      {formatNumber(value)}
    </span>
  )
}
