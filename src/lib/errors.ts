/**
 * Convierte cualquier error en un mensaje que una persona pueda entender.
 * Los mensajes de las funciones de la base ya vienen en castellano y se
 * muestran tal cual; los errores técnicos de Postgres se traducen acá.
 */

type MaybeSupabaseError = { message?: string; code?: string; details?: string | null }

const BY_CODE: Record<string, string> = {
  '23505': 'Ya existe un registro con esos datos.',
  '23503': 'No se puede borrar porque tiene datos relacionados.',
  '23514': 'Alguno de los datos no es válido. Revisá los campos.',
  '42501': 'No tenés permiso para hacer esto.',
  PGRST116: 'No se encontró el registro.',
  PGRST301: 'La sesión venció. Volvé a entrar.',
}

export function errorMessage(error: unknown, fallback = 'Algo salió mal. Probá de nuevo.') {
  if (!error) return fallback
  const e = error as MaybeSupabaseError

  if (e.code === '23505' && e.message?.includes('students_ci_key')) {
    return 'Ya hay un alumno cargado con esa cédula.'
  }
  if (e.code === '23514' && e.message?.includes('students_ci_check')) {
    return 'La cédula tiene que tener entre 5 y 12 números o letras.'
  }
  // P0001 = mensajes escritos a propósito en las funciones de la base
  if (e.code === 'P0001' && e.message) return e.message
  if (e.code === '42501' && e.message && !e.message.startsWith('permission denied')) return e.message
  if (e.code && BY_CODE[e.code]) return BY_CODE[e.code]

  if (typeof e.message === 'string' && e.message) {
    if (/failed to fetch|networkerror|load failed/i.test(e.message)) {
      return 'No hay conexión. Revisá internet y probá de nuevo.'
    }
    if (/exceeded the maximum allowed size|payload too large/i.test(e.message)) {
      return 'El archivo es demasiado pesado.'
    }
    if (/mime type .* is not supported/i.test(e.message)) {
      return 'Ese tipo de archivo no se puede subir.'
    }
    return e.message
  }
  return fallback
}

/** true si el error es por falta de conexión (no por permisos ni datos). */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false
  const e = error as { message?: string; name?: string }
  return /failed to fetch|networkerror|load failed|network request failed/i.test(e.message ?? '') || e.name === 'AuthRetryableFetchError'
}
