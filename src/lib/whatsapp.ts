/**
 * Enlaces a WhatsApp con el mensaje ya escrito.
 * En esta etapa el sistema no envía nada solo: abre el chat y la persona toca "Enviar".
 */

/** "0981 123 456" o "+595981123456" -> "595981123456" */
export function normalizePhone(phone: string | null | undefined) {
  let digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) digits = `595${digits.slice(1)}`
  if (digits.length === 9 && digits.startsWith('9')) digits = `595${digits}`
  return digits
}

/** Para mostrar: "595981123456" -> "0981 123 456" */
export function formatPhone(phone: string | null | undefined) {
  const digits = normalizePhone(phone)
  if (!digits) return ''
  if (digits.startsWith('595') && digits.length === 12) {
    const local = `0${digits.slice(3)}`
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  }
  return `+${digits}`
}

export function whatsappUrl(phone: string | null | undefined, message?: string) {
  const number = normalizePhone(phone)
  if (!number) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${text}`
}
