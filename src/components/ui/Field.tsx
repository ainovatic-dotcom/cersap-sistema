import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber, parseMoney } from '@/lib/format'

const CONTROL =
  'block w-full rounded-control border-[1.5px] border-line-strong bg-surface px-3 text-ink ' +
  'placeholder:text-ink-3/70 transition-colors hover:border-ink-3 ' +
  'focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-500/25 ' +
  'disabled:cursor-not-allowed disabled:bg-cancha disabled:text-ink-3 ' +
  'aria-[invalid=true]:border-rojo-600 aria-[invalid=true]:ring-rojo-600/20'

type FieldProps = {
  label: string
  /** Ayuda corta debajo del campo */
  hint?: string
  /** Mensaje de error; si está, reemplaza a la ayuda */
  error?: string
  /** Marca "(opcional)" al lado de la etiqueta */
  optional?: boolean
  className?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}

/**
 * Etiqueta + control + ayuda/error, conectados para lectores de pantalla.
 *
 *   <Field label="Nombre">{(p) => <Input {...p} value={...} />}</Field>
 */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId()
  const helpId = `${id}-help`
  const help = error ?? hint
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-3">(opcional)</span>}
      </label>
      {children({ id, 'aria-describedby': help ? helpId : undefined, 'aria-invalid': error ? true : undefined })}
      {help && (
        <p id={helpId} className={cn('text-[0.8125rem] leading-snug', error ? 'font-medium text-rojo-700' : 'text-ink-3')}>
          {help}
        </p>
      )}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-11', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'h-11 pr-8', className)} {...rest}>
      {children}
    </select>
  )
}

export function Textarea({ className, rows = 3, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(CONTROL, 'py-2.5 leading-normal', className)} {...rest} />
}

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onChange: (value: number | null) => void
}

/** Campo de guaraníes: muestra "150.000" y entrega el número 150000. */
export function MoneyInput({ value, onChange, className, placeholder = '0', ...rest }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-ink-3">
        Gs.
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value === null ? '' : formatNumber(value)}
        onChange={(event) => {
          const text = event.target.value
          onChange(text.trim() === '' ? null : parseMoney(text))
        }}
        className={cn(CONTROL, 'tabular h-11 pl-11 font-semibold', className)}
        {...rest}
      />
    </div>
  )
}

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  onChange: (value: string) => void
}

export function SearchInput({ className, onChange, 'aria-label': ariaLabel, placeholder, ...rest }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-ink-3" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, 'h-11 pl-10')}
        {...rest}
      />
    </div>
  )
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  description?: string
}

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-brand-600" {...rest} />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium text-ink">{label}</span>
        {description && <span className="block text-[0.8125rem] text-ink-3">{description}</span>}
      </span>
    </label>
  )
}
