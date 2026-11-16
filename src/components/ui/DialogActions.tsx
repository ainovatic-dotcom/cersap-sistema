import type { ReactNode } from 'react'

/** Fila de botones al pie de un formulario dentro de un diálogo. El principal va último. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
}
