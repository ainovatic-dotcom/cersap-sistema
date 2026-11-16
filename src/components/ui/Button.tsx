import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

/**
 * Botones. Reglas (ver docs/DISENO.md):
 *  - Un solo botón principal por superficie: la acción que casi todos van a hacer.
 *  - El texto dice lo que pasa al tocarlo ("Confirmar pago", no "Aceptar").
 *  - En celular, las acciones principales van a todo el ancho (block).
 *  - Al apretar se hunden (scale 0.97, 160 ms): la interfaz confirma que escuchó.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'solid-edge bg-brand-600 text-white hover:bg-brand-700',
  success: 'solid-edge bg-verde-600 text-white hover:bg-verde-700',
  danger: 'solid-edge bg-rojo-600 text-white hover:bg-rojo-700',
  secondary: 'border-[1.5px] border-line-strong bg-surface text-ink hover:border-ink-3 hover:bg-cancha',
  ghost: 'text-brand-700 hover:bg-brand-50 active:bg-brand-100',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-[13px] [&_svg]:size-4',
  md: 'h-11 gap-2 px-4 text-[15px] [&_svg]:size-[18px]',
  lg: 'h-[54px] gap-2.5 px-6 text-base [&_svg]:size-5',
}

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ocupa todo el ancho disponible */
  block?: boolean
  className?: string
}

export function buttonClasses({ variant = 'primary', size = 'md', block, className }: StyleProps = {}) {
  return cn(
    'pressable inline-flex shrink-0 select-none items-center justify-center rounded-control font-semibold',
    'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
    className,
  )
}

type ButtonProps = StyleProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    /** Muestra el indicador de carga y bloquea el botón */
    loading?: boolean
    /** Ícono a la izquierda del texto */
    icon?: ReactNode
  }

export function Button({
  variant,
  size,
  block,
  className,
  loading = false,
  icon,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, block, className })}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

type ButtonLinkProps = StyleProps & Omit<LinkProps, 'className'> & { icon?: ReactNode }

/** Un enlace interno con apariencia de botón. */
export function ButtonLink({ variant, size, block, className, icon, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className })} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  /** Obligatorio: qué hace el botón, para lectores de pantalla */
  label: string
  /** Sobre fondo noche */
  onDark?: boolean
}

/** Botón cuadrado de solo ícono. */
export function IconButton({ label, onDark, className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'pressable inline-flex size-10 shrink-0 items-center justify-center rounded-control disabled:opacity-45 [&_svg]:size-5',
        onDark ? 'text-noche-muted hover:bg-white/10 hover:text-white' : 'text-ink-2 hover:bg-line/70 hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
