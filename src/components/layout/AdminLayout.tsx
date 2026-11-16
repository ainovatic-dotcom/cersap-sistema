import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  Ellipsis,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, CountPill, Dialog, IconButton } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDashboard } from '@/features/dashboard/api'
import { cn } from '@/lib/cn'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; count?: number }

/**
 * Marco de administración, en noche.
 *  - Escritorio (pantalla ancha y alta, variante `desk`): menú fijo a la izquierda, con el escudo arriba.
 *    Un celular acostado sigue con el diseño de celular: el menú lateral no le entra.
 *  - Celular: encabezado y barra inferior noche con lo de todos los días; "Más" para el resto.
 * El menú no se anima: se usa decenas de veces por día (emil: lo frecuente no se anima).
 */
export function AdminLayout() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const dashboard = useDashboard()
  const [moreOpen, setMoreOpen] = useState(false)

  const main: NavItem[] = [
    { to: '/admin', label: 'Panel', icon: LayoutDashboard, end: true },
    { to: '/admin/alumnos', label: 'Alumnos', icon: UsersRound },
    { to: '/admin/cuotas', label: 'Cuotas', icon: Wallet },
    { to: '/admin/pagos', label: 'Pagos', icon: Receipt, count: dashboard.data?.payments_to_review },
  ]
  const secondary: NavItem[] = [
    { to: '/admin/familias', label: 'Familias', icon: Users },
    { to: '/admin/facturas', label: 'Facturas', icon: FileText },
    { to: '/admin/accesos', label: 'Accesos', icon: ShieldCheck, count: dashboard.data?.links_to_review },
    { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
  ]
  // En escritorio el orden sigue el recorrido natural: personas, plata, accesos
  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'Personas', items: [main[0], main[1], secondary[0]].filter((item): item is NavItem => Boolean(item)) },
    { title: 'Plata', items: [main[2], main[3], secondary[1]].filter((item): item is NavItem => Boolean(item)) },
    { title: 'Portal', items: [secondary[2]].filter((item): item is NavItem => Boolean(item)) },
  ]
  const moreCount = secondary.reduce((sum, item) => sum + (item.count ?? 0), 0)

  return (
    <div className="min-h-dvh bg-cancha">
      <div className="cinta top-safe fixed inset-x-0 z-50" />

      {/* Menú lateral (escritorio) */}
      <aside className="noche pt-safe fixed inset-y-0 left-0 z-30 hidden w-[calc(16rem+env(safe-area-inset-left))] flex-col pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] desk:flex">
        <div className="flex items-center gap-3 px-5 pb-6 pt-6">
          <img src="/escudo-96.webp" srcSet="/escudo-96.webp 96w, /escudo-192.webp 192w" sizes="56px" width="96" height="96" alt="" className="size-14 drop-shadow-[0_6px_14px_rgb(0_0_0/0.45)]" />
          <div className="min-w-0">
            <p className="display text-[1.625rem] text-white">CERSAP</p>
            <p className="text-xs text-noche-muted">Región Sur, Alto Paraná</p>
          </div>
        </div>
        <nav aria-label="Secciones" className="flex min-h-0 flex-1 flex-col px-3">
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {groups.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="mb-1.5 px-3 text-xs font-semibold text-noche-muted/80">{group.title}</p>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <SidebarLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pb-2">
            <SidebarLink item={secondary[3] as NavItem} />
          </div>
        </nav>
        <div className="flex items-center gap-2.5 border-t border-white/10 p-3">
          <Avatar name={profile?.full_name ?? profile?.email} src={profile?.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name ?? 'Administración'}</p>
            <p className="truncate text-xs text-noche-muted">{profile?.email}</p>
          </div>
          <IconButton label="Cerrar sesión" onDark onClick={() => void signOut()}>
            <LogOut />
          </IconButton>
        </div>
      </aside>

      {/* Encabezado (celular) */}
      <header className="noche pt-safe sticky top-0 z-30 desk:hidden">
        <div className="flex h-16 items-center gap-3 pt-1 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          <img src="/escudo-96.webp" srcSet="/escudo-96.webp 96w, /escudo-192.webp 192w" sizes="40px" width="96" height="96" alt="" className="size-10" />
          <p className="display text-[1.375rem] text-white">CERSAP</p>
          <span className="text-sm text-noche-muted">Administración</span>
        </div>
      </header>

      <main className="pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5 desk:ml-[calc(16rem+env(safe-area-inset-left))] desk:pl-8 desk:pr-[max(2rem,env(safe-area-inset-right))] desk:pb-12 desk:pt-[calc(env(safe-area-inset-top)+2.25rem)]">
        <div className="mx-auto w-full max-w-[1160px]">
          <Outlet />
        </div>
      </main>

      {/* Barra inferior (celular) */}
      <nav aria-label="Secciones" className="noche safe-bottom px-safe fixed inset-x-0 bottom-0 z-30 border-t border-white/10 desk:hidden">
        <ul className="grid grid-cols-5">
          {main.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold',
                    isActive ? 'text-white' : 'text-noche-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('relative flex h-7 w-12 items-center justify-center rounded-full', isActive && 'bg-celeste/20 text-celeste')}>
                      <item.icon aria-hidden="true" className="size-5" />
                      {Boolean(item.count) && (
                        <span className="absolute -right-1 -top-1">
                          <CountPill count={item.count ?? 0} />
                        </span>
                      )}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-semibold text-noche-muted"
            >
              <span className="relative flex h-7 w-12 items-center justify-center">
                <Ellipsis aria-hidden="true" className="size-5" />
                {moreCount > 0 && (
                  <span className="absolute -right-1 -top-1">
                    <CountPill count={moreCount} />
                  </span>
                )}
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Más secciones" description={profile?.email}>
        <ul className="flex flex-col gap-1">
          {secondary.map((item) => (
            <li key={item.to}>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  navigate(item.to)
                }}
                className="pressable flex h-14 w-full items-center gap-3 rounded-control px-3 text-left text-[1rem] font-semibold text-ink hover:bg-cancha"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <item.icon aria-hidden="true" className="size-[18px]" />
                </span>
                <span className="flex-1">{item.label}</span>
                <CountPill count={item.count ?? 0} />
              </button>
            </li>
          ))}
          <li className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => void signOut()}
              className="pressable flex h-14 w-full items-center gap-3 rounded-control px-3 text-left text-[1rem] font-semibold text-rojo-700 hover:bg-rojo-50"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-rojo-50">
                <LogOut aria-hidden="true" className="size-[18px]" />
              </span>
              Cerrar sesión
            </button>
          </li>
        </ul>
      </Dialog>
    </div>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'relative flex h-11 items-center gap-3 rounded-control px-3 text-[0.9375rem] font-semibold transition-colors duration-150',
          isActive ? 'bg-white/10 text-white' : 'text-noche-muted hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-celeste" />}
          <item.icon aria-hidden="true" className={cn('size-[18px]', isActive ? 'text-celeste' : 'text-noche-muted')} />
          <span className="flex-1">{item.label}</span>
          <CountPill count={item.count ?? 0} />
        </>
      )}
    </NavLink>
  )
}
