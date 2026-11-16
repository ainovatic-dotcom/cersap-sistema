import type { ReactNode } from 'react'
import { CanchaLines } from './CanchaLines'

type AuthShellProps = {
  title: string
  description?: ReactNode
  children: ReactNode
  /** Enlaces chicos debajo de la tarjeta (cerrar sesión, ayuda) */
  footer?: ReactNode
}

/**
 * Marco de las pantallas sin menú: ingreso, vinculación y errores de cuenta.
 *  - Escritorio: a la izquierda la cancha de noche con el escudo; a la derecha, la tarjeta.
 *  - Celular: arriba la noche con el escudo; la tarjeta sube por encima como una hoja.
 * La única animación es la entrada de la tarjeta: se ve una vez por visita.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-cancha md:grid md:grid-cols-[1.1fr_1fr]">
      {/* Noche con el escudo */}
      <div className="noche reflector relative isolate flex flex-col items-center overflow-hidden pb-20 pl-[max(1.5rem,env(safe-area-inset-left))] pr-6 pt-[calc(env(safe-area-inset-top)+2rem)] md:min-h-dvh md:justify-center md:pb-8">
        <div className="cinta top-safe absolute inset-x-0" />
        <CanchaLines className="-z-10 text-white/[0.07]" />
        <img
          src="/escudo-256.webp"
          srcSet="/escudo-256.webp 256w, /escudo-480.webp 480w"
          sizes="(min-width: 48rem) 240px, 128px"
          width="240"
          height="240"
          fetchPriority="high"
          alt="CERSAP, Centro de Entrenamiento Región Sur, Alto Paraná"
          className="aparecer size-32 drop-shadow-[0_18px_30px_rgb(0_0_0/0.5)] md:size-60"
        />
        <div className="mt-4 hidden max-w-sm text-center md:block">
          <p className="display text-[2.5rem] text-white">Centro de Entrenamiento</p>
          <p className="mt-2 text-lg text-noche-muted">Región Sur, Alto Paraná</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Disciplinas">
            {['Fútbol', 'Vóleibol', 'Básquetbol', 'Handball', 'Bádminton'].map((sport) => (
              <li key={sport} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold text-noche-text">
                {sport}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tarjeta */}
      <main className="relative -mt-10 flex flex-col items-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:mt-0 md:justify-center md:pl-10 md:pr-[max(2.5rem,calc(env(safe-area-inset-right)+1rem))]">
        <div className="entrar w-full max-w-[440px]">
          <div className="rounded-sheet border border-line bg-surface p-6 shadow-float md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <h1 className="display text-[2rem] text-ink md:text-[2.5rem]">{title}</h1>
            {description && <p className="mt-2 text-[0.9375rem] text-ink-2 md:text-base">{description}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 flex flex-col items-center gap-2 text-sm text-ink-3 md:items-start">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
