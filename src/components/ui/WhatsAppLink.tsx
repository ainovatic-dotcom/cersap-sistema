import type { ReactNode } from 'react'
import { MessageCircle } from 'lucide-react'
import { whatsappUrl } from '@/lib/whatsapp'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './Button'

type WhatsAppLinkProps = {
  phone: string | null | undefined
  /** Mensaje que aparece ya escrito en el chat */
  message?: string
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
}

/**
 * Botón que abre WhatsApp con el mensaje armado. La persona solo toca "Enviar".
 * Si no hay teléfono cargado, no se muestra nada.
 */
export function WhatsAppLink({ phone, message, children, variant = 'success', size, block, className }: WhatsAppLinkProps) {
  const url = whatsappUrl(phone, message)
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noreferrer" className={buttonClasses({ variant, size, block, className })}>
      <MessageCircle aria-hidden="true" />
      {children}
    </a>
  )
}
