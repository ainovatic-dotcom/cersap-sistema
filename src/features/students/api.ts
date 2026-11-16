import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TablesInsert } from '@/lib/supabase/database.types'
import { ADMIN_KEY, unwrap, useAdminMutation } from '@/lib/query'
import { uploadFile } from '@/lib/storage'
import type { DocumentStatus, Student, StudentBalance, StudentDocument } from '@/types/domain'

export function useStudents() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'students'],
    queryFn: async () =>
      unwrap(await supabase.from('students').select('*, family:families(id, name)').order('last_name').order('first_name')),
  })
}

export type StudentListItem = NonNullable<ReturnType<typeof useStudents>['data']>[number]

export function useStudentBalances() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'student-balances'],
    queryFn: async () => {
      const rows = unwrap(await supabase.from('student_balances').select('*')) as unknown as StudentBalance[]
      return new Map(rows.map((row) => [row.student_id, row]))
    },
  })
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'students', id],
    enabled: Boolean(id),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('students')
          .select('*, family:families(id, name, guardians(*))')
          .eq('id', id as string)
          .single(),
      ),
  })
}

/** Campos que se cargan en el formulario de alumno. */
export type StudentInput = Pick<
  Student,
  | 'first_name'
  | 'last_name'
  | 'ci'
  | 'birth_date'
  | 'discipline'
  | 'enrolled_on'
  | 'family_id'
  | 'monthly_fee_override'
  | 'discount_type'
  | 'discount_value'
  | 'discount_reason'
  | 'is_exempt'
  | 'exempt_reason'
>

export function useSaveStudent() {
  return useAdminMutation(
    async (input: { id?: string; values: StudentInput; newFamilyName?: string; enrollmentYear?: number }) => {
      let familyId = input.values.family_id

      // Alumno nuevo de una familia que todavía no existe
      if (input.newFamilyName?.trim()) {
        const family = unwrap(
          await supabase.from('families').insert({ name: input.newFamilyName.trim() }).select('id').single(),
        )
        familyId = family.id
      }

      const values = { ...input.values, family_id: familyId }

      if (input.id) {
        return unwrap(await supabase.from('students').update(values).eq('id', input.id).select().single())
      }

      const row: TablesInsert<'students'> = values
      const student = unwrap(await supabase.from('students').insert(row).select().single())

      if (input.enrollmentYear) {
        const { error } = await supabase.rpc('create_enrollment_fee', {
          p_student_id: student.id,
          p_year: input.enrollmentYear,
        })
        if (error) throw error
      }
      return student
    },
  )
}

export function useWithdrawStudent() {
  return useAdminMutation(async (input: { studentId: string; communicatedOn: string; reason: string; note?: string }) => {
    const { error } = await supabase.rpc('withdraw_student', {
      p_student_id: input.studentId,
      p_communicated_on: input.communicatedOn,
      p_reason: input.reason,
      p_note: input.note?.trim() || undefined,
    })
    if (error) throw error
  })
}

export function useReactivateStudent() {
  return useAdminMutation(async (input: { studentId: string; reenteredOn: string }) => {
    const { error } = await supabase.rpc('reactivate_student', {
      p_student_id: input.studentId,
      p_reentered_on: input.reenteredOn,
    })
    if (error) throw error
  })
}

export function useStudentWithdrawals(studentId: string) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'students', studentId, 'withdrawals'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('student_withdrawals')
          .select('*')
          .eq('student_id', studentId)
          .order('communicated_on', { ascending: false }),
      ),
  })
}

// --- Seguimiento -------------------------------------------------------------

export function useStudentNotes(studentId: string) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'students', studentId, 'notes'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('student_notes')
          .select('*, author:profiles!student_notes_author_id_fkey(full_name, email)')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false }),
      ),
  })
}

export type StudentNoteItem = NonNullable<ReturnType<typeof useStudentNotes>['data']>[number]

/** Las notas no se editan: una corrección es una nota nueva que apunta a la original. */
export function useAddStudentNote() {
  return useAdminMutation(async (input: { studentId: string; body: string; correctsNoteId?: string }) =>
    unwrap(
      await supabase
        .from('student_notes')
        .insert({ student_id: input.studentId, body: input.body.trim(), corrects_note_id: input.correctsNoteId ?? null })
        .select()
        .single(),
    ),
  )
}

// --- Documentos y foto -------------------------------------------------------

/** Ids de los alumnos a los que les falta algún documento. */
export function useStudentsMissingDocuments() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'students', 'missing-documents'],
    queryFn: async () => {
      const rows = unwrap(await supabase.from('student_documents').select('student_id').neq('status', 'complete'))
      return new Set(rows.map((row) => row.student_id))
    },
  })
}

export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'students', studentId, 'documents'],
    queryFn: async () => unwrap(await supabase.from('student_documents').select('*').eq('student_id', studentId).order('kind')),
  })
}

/** Sube (o reemplaza) el archivo de un documento. El anterior queda guardado en el historial. */
export function useUploadStudentDocument() {
  return useAdminMutation(async (input: { document: StudentDocument; file: File; userId: string }) => {
    const uploaded = await uploadFile('student-documents', input.document.student_id, input.file, `${input.document.kind}-`)
    return unwrap(
      await supabase
        .from('student_documents')
        .update({
          file_path: uploaded.path,
          file_name: uploaded.name,
          mime_type: uploaded.type,
          size_bytes: uploaded.size,
          uploaded_by: input.userId,
          uploaded_at: new Date().toISOString(),
          status: 'complete',
          review_note: null,
        })
        .eq('id', input.document.id)
        .select()
        .single(),
    )
  })
}

export function useSetDocumentStatus() {
  return useAdminMutation(async (input: { documentId: string; status: DocumentStatus; note?: string }) =>
    unwrap(
      await supabase
        .from('student_documents')
        .update({ status: input.status, review_note: input.note?.trim() || null })
        .eq('id', input.documentId)
        .select()
        .single(),
    ),
  )
}

export function useUploadStudentPhoto() {
  return useAdminMutation(async (input: { student: Pick<Student, 'id' | 'family_id'>; file: File }) => {
    const uploaded = await uploadFile('student-photos', input.student.family_id, input.file, `${input.student.id}-`)
    return unwrap(
      await supabase.from('students').update({ photo_path: uploaded.path }).eq('id', input.student.id).select().single(),
    )
  })
}
