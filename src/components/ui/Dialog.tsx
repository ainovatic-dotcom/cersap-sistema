import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, IconButton, type ButtonVariant } from './Button'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  /** Botones del pie. En celular quedan pegados abajo. */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'md:max-w-md', md: 'md:max-w-xl', lg: 'md:max-w-3xl' }

/**
 * Diálogo modal. En celular sube desde abajo como una hoja; en escritorio va centrado.
 * Usa el <dialog> nativo: el foco queda adentro y Escape lo cierra.
 * La entrada se anima con CSS (.dialog-panel en index.css); la salida es inmediata.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // El foco va al campo marcado con data-autofocus o, si no hay, al panel
      // (así no aparece resaltado el botón de cerrar).
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ?? dialog.querySelector<HTMLElement>('[data-dialog-panel]')
      target?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // Tocar el fondo oscuro cierra
        if (event.target === ref.current) onClose()
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 open:flex open:items-end open:justify-center md:open:items-center md:open:p-6"
    >
      {open && (
        <div
          data-dialog-panel
          tabIndex={-1}
          className={cn(
            'dialog-panel flex max-h-[92dvh] w-full flex-col bg-surface shadow-float outline-none',
            'rounded-t-sheet md:rounded-sheet',
            SIZES[size],
          )}
        >
          {/* Asa de la hoja, solo en celular */}
          <span aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-line-strong md:hidden" />
          <header className="flex items-start gap-3 px-5 pb-3 pt-4 md:pt-6">
            <div className="min-w-0 flex-1">
              <h2 className="display text-[25px] text-ink">{title}</h2>
              {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
            </div>
            <IconButton label="Cerrar" onClick={onClose} className="-mr-2 -mt-1">
              <X />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && (
            <footer className="safe-bottom flex flex-col-reverse gap-2 border-t border-line px-5 pt-3 sm:flex-row sm:justify-end sm:pb-4">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  )
}

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel: string
  confirmVariant?: ButtonVariant
  loading?: boolean
  children?: ReactNode
}

/** Confirmación de una acción que cambia datos. El botón dice exactamente qué va a pasar. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  loading,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}
