import { cn } from '@/lib/cn'

/**
 * Líneas de una cancha de fútbol dibujadas en SVG. Es la decoración del sistema:
 * sale del mundo del club, no de una plantilla. Va solo en la pantalla de ingreso.
 */
export function CanchaLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    >
      <rect x="30" y="30" width="940" height="560" rx="4" />
      <line x1="500" y1="30" x2="500" y2="590" />
      <circle cx="500" cy="310" r="92" />
      <circle cx="500" cy="310" r="5" fill="currentColor" />
      {/* Área y arco izquierdos */}
      <rect x="30" y="150" width="160" height="320" />
      <rect x="30" y="236" width="56" height="148" />
      <path d="M190 252 A 92 92 0 0 1 190 368" />
      <circle cx="140" cy="310" r="5" fill="currentColor" />
      {/* Área y arco derechos */}
      <rect x="810" y="150" width="160" height="320" />
      <rect x="914" y="236" width="56" height="148" />
      <path d="M810 252 A 92 92 0 0 0 810 368" />
      <circle cx="860" cy="310" r="5" fill="currentColor" />
      {/* Córners */}
      <path d="M30 52 A 22 22 0 0 0 52 30" />
      <path d="M948 30 A 22 22 0 0 0 970 52" />
      <path d="M30 568 A 22 22 0 0 1 52 590" />
      <path d="M948 590 A 22 22 0 0 1 970 568" />
    </svg>
  )
}
