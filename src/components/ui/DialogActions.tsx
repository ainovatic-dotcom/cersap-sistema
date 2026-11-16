import type { ReactNode } from 'react'

/**
 * Fila de botones al pie de un formulario dentro de un diálogo. El principal va último.
 * Queda pegada abajo de la hoja mientras el contenido se desplaza: en un celular chico
 * "Confirmar" siempre está a la vista, sin tener que descubrir que la hoja tiene scroll.
 */
export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex flex-col-reverse gap-2 border-t border-line bg-surface px-5 pb-1 pt-3 sm:flex-row sm:justify-end">
      {children}
    </div>
  )
}
