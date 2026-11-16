import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

type AvatarProps = {
  name: string | null | undefined
  /** URL de la foto. Si falta, se muestran las iniciales. */
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Cuadrado con esquinas redondeadas en vez de círculo */
  square?: boolean
  className?: string
}

const SIZES = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-28 text-4xl',
}

export function Avatar({ name, src, size = 'md', square, className }: AvatarProps) {
  const shape = square ? 'rounded-[12px]' : 'rounded-full'
  if (src) {
    return (
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className={cn('shrink-0 bg-line object-cover', SIZES[size], shape, className)}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'display inline-flex shrink-0 items-center justify-center bg-brand-100 text-brand-800',
        SIZES[size],
        shape,
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
