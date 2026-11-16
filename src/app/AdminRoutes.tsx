import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { FamiliesPage } from '@/features/families/FamiliesPage'
import { FamilyDetailPage } from '@/features/families/FamilyDetailPage'
import { FeesPage } from '@/features/fees/FeesPage'
import { InvoicesPage } from '@/features/invoices/InvoicesPage'
import { LinksPage } from '@/features/links/LinksPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { StudentDetailPage } from '@/features/students/StudentDetailPage'
import { StudentFormPage } from '@/features/students/StudentFormPage'
import { StudentsPage } from '@/features/students/StudentsPage'
import { StyleGuidePage } from '@/features/styleguide/StyleGuidePage'

/**
 * Rutas de administración (todo lo que cuelga de /admin).
 * Para agregar una pantalla: crear la página en su carpeta de features/ y
 * sumar una línea acá. Si va en el menú, sumarla también en AdminLayout.
 */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="alumnos" element={<StudentsPage />} />
        <Route path="alumnos/nuevo" element={<StudentFormPage />} />
        <Route path="alumnos/:id" element={<StudentDetailPage />} />
        <Route path="alumnos/:id/editar" element={<StudentFormPage />} />
        <Route path="familias" element={<FamiliesPage />} />
        <Route path="familias/:id" element={<FamilyDetailPage />} />
        <Route path="cuotas" element={<FeesPage />} />
        <Route path="pagos" element={<PaymentsPage />} />
        <Route path="facturas" element={<InvoicesPage />} />
        <Route path="accesos" element={<LinksPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="guia-de-estilo" element={<StyleGuidePage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
