import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ErrorState, FullPageLoading } from '@/components/ui'
import { usePortalOverview, type PortalOverview } from './api'

/**
 * Puerta del portal: espera los datos y, si la cuenta todavía no tiene una
 * familia aprobada, manda a la pantalla de vinculación.
 */
export function PortalGate({ children }: { children: ReactNode }) {
  const overview = usePortalOverview()

  if (overview.isPending) return <FullPageLoading />
  if (overview.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cancha">
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      </div>
    )
  }
  if (overview.data.families.length === 0) return <Navigate to="/vincular" replace />

  return <>{children}</>
}

/** Datos del portal ya cargados. Solo se usa en pantallas que están dentro de <PortalGate>. */
export function usePortalData(): PortalOverview {
  const { data } = usePortalOverview()
  if (!data) throw new Error('usePortalData tiene que usarse dentro de <PortalGate>')
  return data
}
