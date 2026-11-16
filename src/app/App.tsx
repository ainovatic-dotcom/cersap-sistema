import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FullPageLoading, ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { HomeRedirect, RequireAdmin, RequireSession } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { LinkChildPage } from '@/features/linking/LinkChildPage'

// Cada área se descarga solo cuando hace falta: una familia desde el celular
// nunca baja el código de administración.
const AdminRoutes = lazy(() => import('./AdminRoutes'))
const PortalRoutes = lazy(() => import('./PortalRoutes'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

/**
 * Raíz de la app: proveedores globales y mapa de rutas.
 *
 *   /ingresar     entrar con Google
 *   /             reparte según el rol
 *   /vincular     el tutor valida cédula + nacimiento de su hijo
 *   /portal/*     portal de familias        (app/PortalRoutes.tsx)
 *   /admin/*      administración            (app/AdminRoutes.tsx)
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<FullPageLoading />}>
              <Routes>
                <Route path="/ingresar" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <RequireSession>
                      <HomeRedirect />
                    </RequireSession>
                  }
                />
                <Route
                  path="/vincular"
                  element={
                    <RequireSession>
                      <LinkChildPage />
                    </RequireSession>
                  }
                />
                <Route
                  path="/portal/*"
                  element={
                    <RequireSession>
                      <PortalRoutes />
                    </RequireSession>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <RequireSession>
                      <RequireAdmin>
                        <AdminRoutes />
                      </RequireAdmin>
                    </RequireSession>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
