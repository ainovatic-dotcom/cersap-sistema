import { NavLink, Outlet } from 'react-router'
import { FileText, House, LogOut, Receipt, Wallet } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/portal', label: 'Inicio', icon: House, end: true },
  { to: '/portal/cuotas', label: 'Cuotas', icon: Wallet, end: false },
  { to: '/portal/pagos', label: 'Pagos', icon: Receipt, end: false },
  { to: '/portal/facturas', label: 'Facturas', icon: FileText, end: false },
]

/**
 * Marco del portal de familias. Pensado para una mano y un celular:
 * encabezado noche que se funde con la primera tarjeta, una columna, y la
 * navegación abajo, al alcance del pulgar.
 */
export function PortalLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col bg-cancha">
      <header className="noche relative">
        <div className="cinta" />
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-4">
          <img src="/escudo-192.png" alt="CERSAP" className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="display truncate text-[19px] text-white">Portal de familias</p>
            <p className="truncate text-[13px] text-noche-muted">{profile?.email}</p>
          </div>
          <IconButton label="Cerrar sesión" onDark onClick={() => void signOut()}>
            <LogOut />
          </IconButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <nav
        aria-label="Secciones del portal"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors duration-150',
                    isActive ? 'text-noche-900' : 'text-ink-3 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-150',
                        isActive && 'bg-noche-900 text-white',
                      )}
                    >
                      <Icon aria-hidden="true" className="size-5" />
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
