/**
 * Tipos del dominio. Salen de los tipos generados de la base, con nombres cortos.
 */
import type { Enums, Tables } from '@/lib/supabase/database.types'

export type Profile = Tables<'profiles'>
export type Settings = Tables<'settings'>
export type Family = Tables<'families'>
export type Guardian = Tables<'guardians'>
export type Student = Tables<'students'>
export type StudentDocument = Tables<'student_documents'>
export type StudentNote = Tables<'student_notes'>
export type StudentWithdrawal = Tables<'student_withdrawals'>
export type Payment = Tables<'payments'>
export type PaymentItem = Tables<'payment_items'>
export type Invoice = Tables<'invoices'>
export type FamilyLink = Tables<'family_links'>

export type UserRole = Enums<'user_role'>
export type StudentStatus = Enums<'student_status'>
export type DocumentKind = Enums<'document_kind'>
export type DocumentStatus = Enums<'document_status'>
export type FeeConcept = Enums<'fee_concept'>
export type PaymentMethod = Enums<'payment_method'>
export type PaymentStatus = Enums<'payment_status'>
export type LinkStatus = Enums<'link_status'>
export type DiscountType = Enums<'discount_type'>
export type GuardianRelationship = Enums<'guardian_relationship'>

/** Estado calculado de una cuota (lo calcula la vista fee_balances). */
export type FeeState = 'exempt' | 'paid' | 'in_review' | 'overdue' | 'partial' | 'pending'

/**
 * Una fila de la vista fee_balances.
 * (Supabase tipa las columnas de las vistas como opcionales; acá van como son.)
 */
export type FeeBalance = {
  id: string
  student_id: string
  family_id: string
  concept: FeeConcept
  period_year: number
  period_month: number | null
  base_amount: number
  discount_amount: number
  amount: number
  is_exempt: boolean
  due_date: string
  note: string | null
  paid_amount: number
  pending_amount: number
  balance: number
  state: FeeState
}

export type StudentBalance = {
  student_id: string
  balance: number | null
  overdue_balance: number | null
  overdue_count: number | null
}

export type FamilyBalance = {
  family_id: string
  balance: number | null
  overdue_balance: number | null
  pending_amount: number | null
}

/** Ítem de pago que se manda a las funciones register_payment / review_payment. */
export type PaymentItemInput = { fee_id: string; amount: number }
