import { useState } from 'react'
import { Copy, Download, Share, SquarePlus } from 'lucide-react'
import { Button, Dialog, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { haptic, isAndroid, isIOS, promptInstall, useInstallState, useSnoozed } from '@/lib/pwa'

/** iPad (Safari se presenta como Mac con pantalla táctil). */
const isIPad = () => isIOS() && !/iPhone|iPod/.test(navigator.userAgent)

const SNOOZE_KEY = 'cersap.instalar.pospuesto'

/**
 * Tarjeta "Instalá la app". Se muestra solo si se puede instalar y la persona no
 * la pospuso en los últimos 30 días.
 *  - Android: un toque abre el aviso nativo.
 *  - iPhone/iPad: abre una guía de tres pasos (Compartir → Agregar a inicio → Agregar).
 *  - Dentro de Instagram o Facebook: explica que hay que abrir el enlace en el navegador.
 */
export function InstallCard({ className }: { className?: string }) {
  const state = useInstallState()
  const [snoozed, snooze] = useSnoozed(SNOOZE_KEY, 30)
  const [guideOpen, setGuideOpen] = useState(false)
  const toast = useToast()

  if (snoozed || state === 'installed' || state === 'unavailable') return null

  async function handleInstall() {
    if (state === 'prompt') {
      const accepted = await promptInstall()
      if (accepted) haptic('success')
      return
    }
    if (state === 'in-app') {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success(isAndroid() ? 'Enlace copiado. Pegalo en Chrome.' : 'Enlace copiado. Pegalo en Safari.')
      } catch {
        toast.error(new Error('No se pudo copiar. Abrí el menú de esta app y elegí "Abrir en el navegador".'))
      }
      return
    }
    setGuideOpen(true)
  }

  const description =
    state === 'in-app'
      ? `Para instalarla, abrí este enlace en ${isAndroid() ? 'Chrome' : 'Safari'}.`
      : 'Se abre desde el ícono, como cualquier app, sin buscar el enlace.'

  return (
    <>
      <section
        aria-labelledby="instalar-titulo"
        className={cn('flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-raise', className)}
      >
        <img src="/icons/maskable-192.png" alt="" className="size-12 shrink-0 rounded-[13px]" />
        <div className="min-w-0 flex-1">
          <h2 id="instalar-titulo" className="text-[0.9375rem] font-bold text-ink">
            {isIPad() ? 'Instalá la app en tu iPad' : 'Instalá la app en tu celular'}
          </h2>
          <p className="text-[0.8125rem] text-ink-3">{description}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button
              size="sm"
              icon={state === 'in-app' ? <Copy aria-hidden="true" /> : <Download aria-hidden="true" />}
              onClick={() => void handleInstall()}
            >
              {state === 'in-app' ? 'Copiar enlace' : state === 'ios' ? 'Cómo instalarla' : 'Instalar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={snooze}>
              Ahora no
            </Button>
          </div>
        </div>
      </section>
      <IOSInstallGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

/** Botón chico "Instalar la app" para pantallas donde una tarjeta sería demasiado (ingreso). */
export function InstallLink() {
  const state = useInstallState()
  const [guideOpen, setGuideOpen] = useState(false)
  if (state !== 'prompt' && state !== 'ios') return null
  return (
    <>
      <button
        type="button"
        onClick={() => (state === 'prompt' ? void promptInstall() : setGuideOpen(true))}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 font-semibold text-brand-700 hover:bg-brand-50"
      >
        <Download aria-hidden="true" className="size-4" />
        Instalar la app
      </button>
      <IOSInstallGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

/** Guía de instalación para iPhone y iPad. Es una secuencia real, por eso va numerada. */
function IOSInstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ipad = isIPad()
  const safari = !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)
  // Safari cambia de lugar el botón según la versión y el diseño elegido (en iOS 26 "compacto"
  // queda dentro de "···"), así que se describe el botón y se da la alternativa.
  const where = !safari
    ? 'Está arriba a la derecha, en la barra de la dirección.'
    : ipad
      ? 'Está arriba, al lado de la dirección. Si no lo ves, tocá primero los tres puntos ···.'
      : 'Suele estar abajo, en la barra. Si no lo ves, tocá primero los tres puntos ··· de abajo a la derecha.'

  const steps = [
    {
      icon: <Share aria-hidden="true" />,
      title: 'Tocá Compartir',
      text: `Es el cuadradito con una flecha hacia arriba. ${where}`,
    },
    {
      icon: <SquarePlus aria-hidden="true" />,
      title: 'Elegí "Agregar a inicio"',
      text: 'Deslizá la lista hacia abajo si no la ves. Puede decir "Agregar a pantalla de inicio".',
    },
    {
      icon: <span className="text-[0.8125rem] font-bold">Agregar</span>,
      title: 'Tocá "Agregar"',
      text: 'Está arriba a la derecha. Listo: el escudo de CERSAP queda en tu pantalla de inicio.',
    },
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={ipad ? 'Instalá la app en tu iPad' : 'Instalá la app en tu iPhone'}
      description="Son tres toques y se hace una sola vez."
      size="sm"
      footer={
        <Button block onClick={onClose}>
          Entendido
        </Button>
      }
    >
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3.5 rounded-card bg-cancha p-3.5">
            <span className="dorsal flex size-8 shrink-0 items-center justify-center rounded-full bg-noche-900 text-[1.0625rem] text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[0.9375rem] font-bold text-ink">
                {step.title}
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[8px] border border-line-strong bg-surface px-1.5 text-brand-600 [&_svg]:size-4">
                  {step.icon}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-ink-2">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {!safari && (
        <p className="mt-3 text-sm text-ink-3">Si no aparece la opción, abrí este enlace en Safari y repetí los pasos.</p>
      )}
    </Dialog>
  )
}
