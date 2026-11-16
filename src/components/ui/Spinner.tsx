import { cn } from '@/lib/cn'

/** Indicador que gira. Rápido a propósito: un giro veloz hace sentir la carga más corta. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('size-[18px] animate-[spin_0.6s_linear_infinite]', className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Carga de una sección cuando no hay una forma mejor que mostrar. Preferí los esqueletos. */
export function Loading({ label = 'Cargando' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-ink-3">
      <Spinner className="size-5" />
      <span>{label}…</span>
    </div>
  )
}

/** Carga a pantalla completa, con el escudo sobre noche. Se usa mientras se resuelve la sesión. */
export function FullPageLoading() {
  return (
    <div role="status" className="noche flex min-h-dvh flex-col items-center justify-center gap-6">
      <img src="/escudo-96.webp" srcSet="/escudo-96.webp 96w, /escudo-192.webp 192w" sizes="96px" width="96" height="96" alt="" className="size-24" />
      <Spinner className="size-6 text-celeste" />
      <span className="sr-only">Cargando</span>
    </div>
  )
}

/** Barra de esqueleto suelta. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block h-4', className)} />
}

/** Lista de esqueletos con la forma de una fila con avatar, para listas que cargan. */
export function SkeletonRows({ rows = 5, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div role="status" aria-label="Cargando" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex min-h-16 items-center gap-3 px-4 py-2.5 md:px-5">
          {avatar && <Skeleton className="size-9 shrink-0 rounded-full" />}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-[38%]" />
            <Skeleton className="h-3 w-[56%]" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  )
}
