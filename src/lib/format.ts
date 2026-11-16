/**
 * Formato de plata, fechas y cédulas. Todo lo que se muestra pasa por acá para
 * que se vea igual en toda la app.
 */

const numberFormat = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 })

/** 350000 -> "Gs. 350.000" */
export function formatMoney(amount: number | null | undefined) {
  return `Gs. ${numberFormat.format(amount ?? 0)}`
}

/** 350000 -> "350.000" */
export function formatNumber(amount: number | null | undefined) {
  return numberFormat.format(amount ?? 0)
}

/** "350.000" o "Gs 350000" -> 350000 */
export function parseMoney(text: string) {
  const digits = text.replace(/\D/g, '')
  return digits ? Number.parseInt(digits, 10) : 0
}

/** "5123456" -> "5.123.456". Si tiene letras se deja como está. */
export function formatCi(ci: string | null | undefined) {
  if (!ci) return ''
  return /^\d+$/.test(ci) ? numberFormat.format(Number(ci)) : ci
}

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

export function monthName(month: number) {
  return MONTHS[month - 1] ?? ''
}

/**
 * Las fechas de la base llegan como "2026-11-15" (sin hora). Se arman a mano
 * para que el huso horario del navegador no las corra un día.
 */
function parseDateOnly(value: string) {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** "2026-11-15" -> "15/11/2026" */
export function formatDate(value: string | null | undefined) {
  if (!value) return ''
  const date = parseDateOnly(value)
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** "2026-11-15" -> "15 de noviembre" */
export function formatDateLong(value: string | null | undefined) {
  if (!value) return ''
  const date = parseDateOnly(value)
  return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'long' })
}

/** Fecha y hora de un timestamp: "15/11/2026 20:58" */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Hoy en Paraguay como "2026-11-15" (para inputs de fecha). */
export function todayIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date())
}

/** Edad en años cumplidos a partir de la fecha de nacimiento. */
export function ageFrom(birthDate: string | null | undefined) {
  if (!birthDate) return null
  const birth = parseDateOnly(birthDate)
  const today = parseDateOnly(todayIso())
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age
}

/** "Mensualidad de noviembre 2026" o "Matrícula 2026" */
export function feeLabel(fee: { concept: string | null; period_year: number | null; period_month: number | null }) {
  if (fee.concept === 'enrollment') return `Matrícula ${fee.period_year ?? ''}`
  return `${monthName(fee.period_month ?? 0)} ${fee.period_year ?? ''}`
}

/** Iniciales para el avatar: "Ana María López" -> "AL" */
export function initials(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** Para buscar sin que importen mayúsculas ni tildes: "Ñandú López" -> "nandu lopez" */
export function normalizeText(text: string | null | undefined) {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** "Noviembre" -> "Nov" */
export function monthShort(month: number) {
  return monthName(month).slice(0, 3)
}

/** Montos grandes en corto para etiquetas de gráficos: 21300000 -> "21,3 M", 850000 -> "850 mil" */
export function formatMoneyShort(amount: number) {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    return `${millions.toLocaleString('es-PY', { maximumFractionDigits: millions >= 10 ? 0 : 1 })} M`
  }
  if (amount >= 1_000) return `${Math.round(amount / 1_000).toLocaleString('es-PY')} mil`
  return formatNumber(amount)
}
