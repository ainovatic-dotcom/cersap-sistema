/**
 * Convenciones de React Query para administración.
 *
 * Regla simple: todas las consultas de administración usan una clave que
 * empieza con 'admin', y después de CUALQUIER cambio se refrescan todas. Así
 * nunca queda una pantalla mostrando datos viejos. Con el volumen de CERSAP
 * (cientos de filas) el costo es despreciable.
 */
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'

export const ADMIN_KEY = 'admin'

export function invalidateAdmin(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: [ADMIN_KEY] })
}

/** Igual que useMutation, pero refresca los datos de administración al terminar bien. */
export function useAdminMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateAdmin(queryClient),
  })
}

/**
 * Las respuestas de Supabase traen { data, error }. Esto devuelve data o lanza
 * el error, que es lo que React Query espera.
 */
export function unwrap<T>(result: { data: T; error: unknown }): NonNullable<T> {
  if (result.error) throw result.error
  return result.data as NonNullable<T>
}
