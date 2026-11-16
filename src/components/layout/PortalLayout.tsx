import { useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { FileText, House, LogOut, Receipt, Wallet } from 'lucide-react'
import { IconButton, useToast } from '@/components/ui'
import { PullToRefresh } from '@/components/pwa/PullToRefresh'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/portal', label: 'Inicio', icon: House, end: true },
  { to: '/portal/cuotas', label: 'Cuotas', icon: Wallet, end: false },
  { to: '/portal/pagos', label: 'Pagos', icon: Receipt, end: false },
  { to: '/portal/facturas', label: 'Facturas', icon: FileText, end: false },
]

/** Índice de la sección activa en la barra inferior (-1 si es una pantalla interna, como Pagar). */
function activeIndex(pathname: string) {
  return NAV.findIndex((item) => (item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to)))
}

/**
 * Marco del portal de familias. Pensado para una mano y un celular:
 *  - Encabezado noche que llega hasta el borde de arriba (también debajo del notch).
 *  - Una columna, con "deslizar hacia abajo para actualizar" en la app instalada.
 *  - Navegación abajo, al alcance del pulgar, con una píldora que se desliza a la sección.
 *  - Cada pantalla entra con un fundido corto: el portal se usa pocas veces al mes,
 *    así que el movimiento ayuda a ubicarse sin cansar (emil: lo infrecuente puede animarse).
 */
export function PortalLayout() {
  const { profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const index = activeIndex(pathname)
  const toast = useToast()
  const refresh = useCallback(() => queryClient.invalidateQueries(), [queryClient])
  const offline = useCallback(() => toast.error(new Error('Sin conexión: no se puede actualizar ahora.')), [toast])

  return (
    <div className="flex min-h-dvh flex-col bg-cancha">
      <header className="noche pt-safe relative">
        <div className="cinta" />
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          <img src="/escudo-96.webp" srcSet="/escudo-96.webp 96w, /escudo-192.webp 192w" sizes="44px" width="96" height="96" alt="CERSAP" className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="display truncate text-[1.1875rem] text-white">Portal de familias</p>
            <p className="truncate text-[0.8125rem] text-noche-muted">{profile?.email}</p>
          </div>
          <IconButton label="Cerrar sesión" onDark onClick={() => void signOut()}>
            <LogOut />
          </IconButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5">
        <PullToRefresh onRefresh={refresh} onOffline={offline}>
          <div key={pathname} className="pagina">
            <Outlet />
          </div>
        </PullToRefresh>
      </main>

      <nav
        aria-label="Secciones del portal"
        className="safe-bottom px-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur"
      >
        <ul className="relative mx-auto grid max-w-2xl grid-cols-4">
          {/* Píldora que marca la sección: se desliza en vez de saltar */}
          <span
            aria-hidden="true"
            className="nav-indicador pointer-events-none absolute left-0 top-[8px] flex w-1/4 justify-center"
            style={{ transform: `translateX(${Math.max(index, 0) * 100}%)`, opacity: index < 0 ? 0 : 1 }}
          >
            <span className="h-8 w-16 rounded-full bg-noche-900" />
          </span>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="relative">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'pressable flex h-[68px] flex-col items-center justify-start gap-1 pt-2 text-xs font-semibold transition-colors duration-150',
                    isActive ? 'text-noche-900' : 'text-ink-3 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-16 items-center justify-center transition-colors duration-200',
                        isActive ? 'text-white' : 'text-current',
                      )}
                    >
                      <Icon aria-hidden="true" className="size-[22px]" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
