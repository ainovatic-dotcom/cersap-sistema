import { Navigate, Route, Routes } from 'react-router'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { PortalFeesPage } from '@/features/portal/PortalFeesPage'
import { PortalGate } from '@/features/portal/PortalGate'
import { PortalHomePage } from '@/features/portal/PortalHomePage'
import { PortalInvoicesPage } from '@/features/portal/PortalInvoicesPage'
import { PortalPayPage } from '@/features/portal/PortalPayPage'
import { PortalPaymentsPage } from '@/features/portal/PortalPaymentsPage'

/** Rutas del portal de familias (todo lo que cuelga de /portal). */
export default function PortalRoutes() {
  return (
    <PortalGate>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route index element={<PortalHomePage />} />
          <Route path="cuotas" element={<PortalFeesPage />} />
          <Route path="pagar" element={<PortalPayPage />} />
          <Route path="pagos" element={<PortalPaymentsPage />} />
          <Route path="facturas" element={<PortalInvoicesPage />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Route>
      </Routes>
    </PortalGate>
  )
}
