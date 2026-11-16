import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
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
 * La entrada se anima con CSS (.dialog-panel en index.css).
 * En celular la hoja se puede bajar con el dedo desde el asa o el título para cerrarla,
 * como en las apps: sigue al dedo y, si se suelta lejos o rápido, se va hacia abajo.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; startTime: number; dy: number } | null>(null)

  function onDragStart(event: PointerEvent<HTMLElement>) {
    if (window.matchMedia('(min-width: 48rem)').matches) return
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return
    drag.current = { startY: event.clientY, startTime: performance.now(), dy: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
    if (panelRef.current) panelRef.current.style.transition = 'none'
  }
  function onDragMove(event: PointerEvent<HTMLElement>) {
    const state = drag.current
    const panel = panelRef.current
    if (!state || !panel) return
    // Hacia arriba casi no se mueve (resistencia); hacia abajo sigue al dedo
    const raw = event.clientY - state.startY
    state.dy = raw > 0 ? raw : raw / 6
    panel.style.transform = `translateY(${state.dy}px)`
  }
  function onDragEnd() {
    const state = drag.current
    const panel = panelRef.current
    drag.current = null
    if (!state || !panel) return
    const velocity = state.dy / Math.max(1, performance.now() - state.startTime)
    panel.style.transition = 'transform 320ms var(--ease-drawer)'
    if (state.dy > 120 || (velocity > 0.5 && state.dy > 24)) {
      panel.style.transform = 'translateY(105%)'
      window.setTimeout(onClose, 220)
    } else {
      panel.style.transform = ''
    }
  }
  const dragHandlers = {
    onPointerDown: onDragStart,
    onPointerMove: onDragMove,
    onPointerUp: onDragEnd,
    onPointerCancel: onDragEnd,
  }

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
          ref={panelRef}
          data-dialog-panel
          tabIndex={-1}
          className={cn(
            'dialog-panel flex max-h-[92dvh] w-full flex-col bg-surface shadow-float outline-none',
            'rounded-t-sheet md:rounded-sheet',
            SIZES[size],
          )}
        >
          {/* Asa de la hoja, solo en celular: de acá (o del título) se arrastra para cerrar */}
          <div {...dragHandlers} className="flex h-6 shrink-0 touch-none items-end justify-center md:hidden" aria-hidden="true">
            <span className="h-1.5 w-11 rounded-full bg-line-strong" />
          </div>
          <header {...dragHandlers} className="flex touch-none items-start gap-3 px-5 pb-3 pt-2 md:touch-auto md:pt-6">
            <div className="min-w-0 flex-1">
              <h2 className="display text-[1.5625rem] text-ink">{title}</h2>
              {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
            </div>
            <IconButton label="Cerrar" onClick={onClose} className="-mr-2 -mt-1">
              <X />
            </IconButton>
          </header>
          <div className={cn('min-h-0 flex-1 overflow-y-auto px-5', footer ? 'pb-5' : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]')}>{children}</div>
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
