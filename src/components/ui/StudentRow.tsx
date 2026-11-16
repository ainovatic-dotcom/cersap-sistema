import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'

type StudentRowProps = {
  /** Nombre completo: "Ana Benítez Rojas" */
  name: string
  photoUrl?: string | null
  /** Línea secundaria: "Fútbol, 11 años" */
  meta?: ReactNode
  /** Lo que va a la derecha: un estado, un monto o una fecha */
  aside?: ReactNode
  /** Si la fila lleva a otra pantalla */
  to?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Fila de alumno. Es la forma única de mostrar a un chico en una lista:
 * foto chica, nombre, una línea de datos y el estado a la derecha.
 * Va dentro de un <ul className="divide-y divide-line"> sin bordes propios.
 */
export function StudentRow({ name, photoUrl, meta, aside, to, className, style }: StudentRowProps) {
  const content = (
    <>
      <Avatar name={name} src={photoUrl} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{name}</span>
        {meta && <span className="block truncate text-[13px] text-ink-3">{meta}</span>}
      </span>
      {aside && <span className="shrink-0 text-right">{aside}</span>}
      {to && <ChevronRight aria-hidden="true" className="-mr-1 size-4 shrink-0 text-ink-3" />}
    </>
  )
  const base = 'flex min-h-16 items-center gap-3 px-4 py-2.5 md:px-5'
  if (to) {
    return (
      <Link to={to} style={style} className={cn(base, 'transition-colors duration-150 hover:bg-cancha/70 focus-visible:bg-cancha/70', className)}>
        {content}
      </Link>
    )
  }
  return (
    <div style={style} className={cn(base, className)}>
      {content}
    </div>
  )
}
