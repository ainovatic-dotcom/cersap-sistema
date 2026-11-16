import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'
import { ADMIN_KEY, unwrap, useAdminMutation } from '@/lib/query'
import type { FamilyBalance, Guardian } from '@/types/domain'

/** Familias con sus tutores y alumnos, para la lista. */
export function useFamilies() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'families'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('families')
          .select('*, guardians(id, full_name, phone, email, is_primary, relationship), students(id, first_name, last_name, status)')
          .order('name'),
      ),
  })
}

export type FamilyListItem = NonNullable<ReturnType<typeof useFamilies>['data']>[number]

/** Lista corta para los desplegables "Familia". */
export function useFamilyOptions() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'families', 'options'],
    queryFn: async () => unwrap(await supabase.from('families').select('id, name').order('name')),
  })
}

export function useFamily(id: string | undefined) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'families', id],
    enabled: Boolean(id),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('families')
          .select('*, guardians(*), students(id, first_name, last_name, ci, birth_date, discipline, status, photo_path)')
          .eq('id', id as string)
          .single(),
      ),
  })
}

export function useFamilyBalances() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'family-balances'],
    queryFn: async () => {
      const rows = unwrap(await supabase.from('family_balances').select('*')) as unknown as FamilyBalance[]
      return new Map(rows.map((row) => [row.family_id, row]))
    },
  })
}

export function useSaveFamily() {
  return useAdminMutation(async (input: { id?: string; name: string; notes?: string | null }) => {
    const values = { name: input.name.trim(), notes: input.notes?.trim() || null }
    if (input.id) {
      return unwrap(await supabase.from('families').update(values).eq('id', input.id).select().single())
    }
    return unwrap(await supabase.from('families').insert(values).select().single())
  })
}

export function useDeleteFamily() {
  return useAdminMutation(async (id: string) => {
    const { error } = await supabase.from('families').delete().eq('id', id)
    if (error) throw error
  })
}

export type GuardianInput = Pick<Guardian, 'full_name' | 'relationship' | 'ci' | 'phone' | 'email' | 'is_primary'>

export function useSaveGuardian() {
  return useAdminMutation(async (input: { id?: string; familyId: string; values: GuardianInput }) => {
    // Solo puede haber un tutor principal por familia: se desmarca el anterior
    if (input.values.is_primary) {
      const reset = supabase.from('guardians').update({ is_primary: false }).eq('family_id', input.familyId)
      const { error } = await (input.id ? reset.neq('id', input.id) : reset)
      if (error) throw error
    }
    if (input.id) {
      const changes: TablesUpdate<'guardians'> = input.values
      return unwrap(await supabase.from('guardians').update(changes).eq('id', input.id).select().single())
    }
    const row: TablesInsert<'guardians'> = { ...input.values, family_id: input.familyId }
    return unwrap(await supabase.from('guardians').insert(row).select().single())
  })
}

export function useDeleteGuardian() {
  return useAdminMutation(async (id: string) => {
    const { error } = await supabase.from('guardians').delete().eq('id', id)
    if (error) throw error
  })
}

/** Teléfono para escribirle a una familia: el del tutor principal o, si no hay, el primero que tenga. */
export function familyPhone(guardians: Pick<Guardian, 'phone' | 'is_primary'>[] | null | undefined) {
  const list = guardians ?? []
  return list.find((guardian) => guardian.is_primary && guardian.phone)?.phone ?? list.find((guardian) => guardian.phone)?.phone ?? null
}
