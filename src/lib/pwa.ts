/**
 * Todo lo que la app necesita saber del celular para comportarse como una app:
 * en qué plataforma corre, si ya está instalada y cómo ofrecer instalarla.
 *
 * El aviso de instalación de Android (beforeinstallprompt) llega una sola vez y
 * muy temprano, así que se captura apenas carga este módulo (main.tsx lo importa
 * antes de dibujar la app) y se guarda hasta que la persona toca "Instalar".
 */
import { useEffect, useState, useSyncExternalStore } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: InstallPromptEvent | null = null
let installedNow = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Evita la barrita automática de Chrome: ofrecemos la instalación en el momento justo
    event.preventDefault()
    deferredPrompt = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installedNow = true
    notify()
  })
}

/** iPhone, iPod o iPad (el iPad moderno se presenta como Mac con pantalla táctil). */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

export function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

/**
 * Navegadores dentro de otras apps (Instagram, Facebook, TikTok). Ahí no se puede
 * instalar: hay que abrir el enlace en Safari o Chrome.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /FBAN|FBAV|Instagram|Line\/|TikTok|musical_ly|Snapchat/i.test(navigator.userAgent)
}

/** true cuando se abrió desde el ícono de la pantalla de inicio. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export type InstallState =
  /** Ya se abre como app: no hay nada que ofrecer */
  | 'installed'
  /** Android/Chrome/Edge: un toque y se instala */
  | 'prompt'
  /** iPhone/iPad: hay que hacerlo desde Compartir → Agregar a inicio */
  | 'ios'
  /** Navegador dentro de otra app: hay que abrir el enlace afuera */
  | 'in-app'
  /** Escritorio u otro navegador sin instalación disponible */
  | 'unavailable'

function snapshot(): InstallState {
  if (installedNow || isStandalone()) return 'installed'
  if (isInAppBrowser()) return 'in-app'
  if (deferredPrompt) return 'prompt'
  if (isIOS()) return 'ios'
  return 'unavailable'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Estado de instalación, siempre al día. */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, snapshot, () => 'unavailable')
}

/** Muestra el aviso nativo de instalación de Android. Devuelve true si la persona aceptó. */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt
  if (!event) return false
  await event.prompt()
  const choice = await event.userChoice
  deferredPrompt = null
  notify()
  return choice.outcome === 'accepted'
}

/* ---------------------------------------------------------------- conexión */

function subscribeOnline(listener: () => void) {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

/** true si el celular tiene conexión (según el sistema). */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
}

/* ---------------------------------------------------------------- recuerdos livianos */

/** Lee una preferencia del navegador sin romper si el almacenamiento no está disponible. */
export function readFlag(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeFlag(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento (modo privado estricto): el aviso puede volver a aparecer, nada más
  }
}

/** Para avisos que se pueden posponer: true si se pospuso hace menos de `days` días. */
export function useSnoozed(key: string, days: number): [boolean, () => void] {
  const [snoozed, setSnoozed] = useState(() => {
    const at = Number(readFlag(key) ?? 0)
    return at > 0 && Date.now() - at < days * 24 * 60 * 60 * 1000
  })
  const snooze = () => {
    writeFlag(key, String(Date.now()))
    setSnoozed(true)
  }
  return [snoozed, snooze]
}

/* ---------------------------------------------------------------- vibración */

/**
 * Una vibración corta para confirmar algo importante (Android). En iPhone el
 * navegador no lo permite y no pasa nada. Respeta "reducir movimiento".
 */
export function haptic(kind: 'tap' | 'success' | 'error' = 'tap') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const pattern = kind === 'success' ? [12, 60, 18] : kind === 'error' ? [30, 50, 30] : 8
  try {
    navigator.vibrate(pattern)
  } catch {
    // Algunos navegadores lo bloquean sin interacción previa
  }
}

/** true en pantallas táctiles sin mouse (para no mostrar cosas de mouse en celulares). */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    const update = () => setCoarse(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return coarse
}
