import { useEffect, useId, useState } from 'react'
import { FileText, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatFileSize } from '@/lib/image'
import { IconButton } from './Button'

type FilePickerProps = {
  value: File | null
  onChange: (file: File | null) => void
  /** Texto del área cuando todavía no hay archivo */
  label: string
  hint?: string
  /** Tipos aceptados. Por defecto imágenes y PDF. */
  accept?: string
  /** En celular abre directo la cámara trasera */
  camera?: boolean
  disabled?: boolean
}

/**
 * Selector de un archivo, pensado para el dedo: un área grande para tocar y,
 * una vez elegido, la vista previa con la opción de quitarlo.
 */
export function FilePicker({
  value,
  onChange,
  label,
  hint,
  accept = 'image/*,application/pdf',
  camera,
  disabled,
}: FilePickerProps) {
  const id = useId()
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!value || !value.type.startsWith('image/')) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-control border-[1.5px] border-line-strong bg-surface p-2.5">
        {preview ? (
          <img src={preview} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FileText aria-hidden="true" className="size-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold text-ink">{value.name}</p>
          <p className="text-[0.8125rem] text-ink-3">{formatFileSize(value.size)}</p>
        </div>
        <IconButton label="Quitar archivo" onClick={() => onChange(null)} disabled={disabled}>
          <X />
        </IconButton>
      </div>
    )
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-control border-2 border-dashed border-line-strong bg-surface px-4 py-7 text-center transition-colors',
        'hover:border-brand-500 hover:bg-brand-50/60 focus-within:border-brand-600 focus-within:ring-3 focus-within:ring-brand-500/25',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <ImagePlus aria-hidden="true" className="size-6" />
      </span>
      <span className="text-[0.9375rem] font-semibold text-ink">{label}</span>
      {hint && <span className="text-[0.8125rem] text-ink-3">{hint}</span>}
      <input
        id={id}
        type="file"
        accept={accept}
        capture={camera ? 'environment' : undefined}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
    </label>
  )
}
