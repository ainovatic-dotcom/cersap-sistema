/**
 * Textos y colores de cada estado. Si hay que cambiar cómo se llama algo en
 * pantalla, se cambia acá y se actualiza en toda la app.
 */
import type {
  DocumentKind,
  DocumentStatus,
  FeeState,
  GuardianRelationship,
  LinkStatus,
  PaymentMethod,
  PaymentStatus,
  StudentStatus,
} from '@/types/domain'

export type Tone = 'verde' | 'ambar' | 'rojo' | 'azul' | 'neutro'

type Label = { label: string; tone: Tone }

export const FEE_STATE: Record<FeeState, Label> = {
  paid: { label: 'Pagada', tone: 'verde' },
  in_review: { label: 'En revisión', tone: 'ambar' },
  overdue: { label: 'Vencida', tone: 'rojo' },
  partial: { label: 'Pago parcial', tone: 'azul' },
  pending: { label: 'Pendiente', tone: 'neutro' },
  exempt: { label: 'Exonerada', tone: 'neutro' },
}

export const PAYMENT_STATUS: Record<PaymentStatus, Label> = {
  pending: { label: 'Por verificar', tone: 'ambar' },
  confirmed: { label: 'Confirmado', tone: 'verde' },
  rejected: { label: 'Rechazado', tone: 'rojo' },
}

export const DOCUMENT_STATUS: Record<DocumentStatus, Label> = {
  pending: { label: 'Pendiente', tone: 'neutro' },
  in_review: { label: 'En revisión', tone: 'ambar' },
  complete: { label: 'Completo', tone: 'verde' },
  needs_update: { label: 'Hay que actualizar', tone: 'rojo' },
}

export const LINK_STATUS: Record<LinkStatus, Label> = {
  pending: { label: 'Esperando aprobación', tone: 'ambar' },
  approved: { label: 'Con acceso', tone: 'verde' },
  rejected: { label: 'Rechazada', tone: 'rojo' },
  revoked: { label: 'Acceso quitado', tone: 'neutro' },
}

export const STUDENT_STATUS: Record<StudentStatus, Label> = {
  active: { label: 'Activo', tone: 'verde' },
  inactive: { label: 'Inactivo', tone: 'neutro' },
}

export const DOCUMENT_KIND: Record<DocumentKind, string> = {
  ci_front: 'Cédula, frente',
  ci_back: 'Cédula, dorso',
  medical: 'Ficha médica',
}

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
}

export const RELATIONSHIP: Record<GuardianRelationship, string> = {
  father: 'Padre',
  mother: 'Madre',
  guardian: 'Tutor o tutora',
  other: 'Otro familiar',
}

/** Motivos generales de baja. El detalle va en la observación. */
export const WITHDRAWAL_REASONS = [
  'Mudanza',
  'Motivos económicos',
  'Horarios',
  'Cambio de actividad',
  'Salud',
  'Otro',
] as const
