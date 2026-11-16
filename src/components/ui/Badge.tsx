import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  DOCUMENT_STATUS,
  FEE_STATE,
  LINK_STATUS,
  PAYMENT_STATUS,
  STUDENT_STATUS,
  type Tone,
} from '@/lib/labels'
import type { DocumentStatus, FeeState, LinkStatus, PaymentStatus, StudentStatus } from '@/types/domain'

const TONES: Record<Tone, string> = {
  verde: 'bg-verde-50 text-verde-700',
  ambar: 'bg-ambar-50 text-ambar-800',
  rojo: 'bg-rojo-50 text-rojo-700',
  azul: 'bg-brand-50 text-brand-700',
  neutro: 'bg-[#e6ecf2] text-ink-2',
}

/** Sobre noche: fondo translúcido y texto claro del mismo tono */
const TONES_DARK: Record<Tone, string> = {
  verde: 'bg-verde-400/14 text-verde-400',
  ambar: 'bg-ambar-400/14 text-ambar-400',
  rojo: 'bg-rojo-400/16 text-rojo-400',
  azul: 'bg-celeste/16 text-celeste',
  neutro: 'bg-white/10 text-noche-muted',
}

const DOTS: Record<Tone, string> = {
  verde: 'bg-verde-600',
  ambar: 'bg-ambar-500',
  rojo: 'bg-rojo-600',
  azul: 'bg-brand-500',
  neutro: 'bg-ink-3',
}

type BadgeProps = { tone?: Tone; children: ReactNode; className?: string; onDark?: boolean }

/** Etiqueta de estado. El punto de color acompaña al texto: nunca va el color solo. */
export function Badge({ tone = 'neutro', children, className, onDark }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        onDark ? TONES_DARK[tone] : TONES[tone],
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', onDark ? 'bg-current' : DOTS[tone])} />
      {children}
    </span>
  )
}

export function FeeStateBadge({ state, onDark }: { state: FeeState; onDark?: boolean }) {
  const { label, tone } = FEE_STATE[state]
  return (
    <Badge tone={tone} onDark={onDark}>
      {label}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = PAYMENT_STATUS[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { label, tone } = DOCUMENT_STATUS[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function LinkStatusBadge({ status }: { status: LinkStatus }) {
  const { label, tone } = LINK_STATUS[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function StudentStatusBadge({ status, onDark }: { status: StudentStatus; onDark?: boolean }) {
  const { label, tone } = STUDENT_STATUS[status]
  return (
    <Badge tone={tone} onDark={onDark}>
      {label}
    </Badge>
  )
}

/** Contador chico para el menú (pagos por verificar, solicitudes). */
export function CountPill({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rojo-600 px-1.5 text-[11px] font-bold leading-none text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
