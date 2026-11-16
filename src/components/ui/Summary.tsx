import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Resumen: la tarjeta con la cifra que importa en cada pantalla (lo que falta
 * cobrar, lo que debe una familia). Es blanca y simple como el resto; lo que la
 * distingue es el tamaño de la cifra, no la decoración.
 */
export function SummaryCard({ children, className, ...rest }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={cn('rounded-card border border-line bg-surface shadow-raise', className)} {...rest}>
      {children}
    </section>
  )
}

type SummaryStatProps = { label: string; children: ReactNode; tone?: 'rojo' | 'verde'; className?: string }

/** Dato chico dentro del resumen. Va dentro de un <dl>. */
export function SummaryStat({ label, children, tone, className }: SummaryStatProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <dt className="whitespace-nowrap text-[0.8125rem] text-ink-3">{label}</dt>
      <dd
        className={cn(
          'dorsal mt-auto pt-1 text-[1.5rem]',
          tone === 'rojo' ? 'text-rojo-600' : tone === 'verde' ? 'text-verde-700' : 'text-ink',
        )}
      >
        {children}
      </dd>
    </div>
  )
}
