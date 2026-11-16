import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { Button } from './Button'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  /** Qué puede hacer la persona ahora */
  children?: ReactNode
  action?: ReactNode
}

/** Pantalla o lista sin datos: dice qué falta y cómo seguir. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 [&_svg]:size-6">{icon}</div>
      )}
      <h3 className="display text-[21px] text-ink">{title}</h3>
      {children && <p className="mt-2 max-w-sm text-[15px] text-ink-3">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/** Error al cargar datos, con botón para reintentar. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-rojo-50 text-rojo-600 [&_svg]:size-6">
        <CircleAlert aria-hidden="true" className="size-7" />
      </div>
      <h3 className="display text-[24px] text-ink">No se pudo cargar</h3>
      <p className="mt-2 max-w-sm text-[15px] text-ink-3">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
