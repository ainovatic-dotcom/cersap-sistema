import type { ReactNode } from 'react'
import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'

type AlertTone = 'info' | 'warning' | 'error'

const TONES: Record<AlertTone, string> = {
  info: 'border-brand-200 bg-brand-50 text-brand-900',
  warning: 'border-ambar-100 bg-ambar-50 text-ambar-800',
  error: 'border-rojo-100 bg-rojo-50 text-rojo-700',
}

const ICONS = { info: Info, warning: TriangleAlert, error: CircleAlert }

type AlertProps = {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  /** Botón o enlace para resolver lo que el aviso plantea */
  action?: ReactNode
  className?: string
}

/** Aviso dentro de la página. Para errores de un formulario usá <FormError />. */
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const Icon = ICONS[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex flex-col gap-3 rounded-control border p-3.5 sm:flex-row sm:items-center', TONES[tone], className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <Icon aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
        <div className="min-w-0 text-[0.9375rem] leading-snug">
          {title && <p className="font-bold">{title}</p>}
          {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Error de una acción (guardar, confirmar...), para mostrar dentro de un diálogo o formulario. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  return <Alert tone="error">{errorMessage(error)}</Alert>
}
