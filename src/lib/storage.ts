/**
 * Archivos. Es el ÚNICO lugar que habla con el almacenamiento: si algún día se
 * pasa de Supabase Storage a Cloudflare R2, alcanza con cambiar este archivo.
 *
 * Todos los buckets son privados. Para mostrar o descargar un archivo se pide
 * un enlace firmado que vence a los pocos minutos.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase/client'
import { compressImage, fileExtension } from './image'

export type Bucket = 'student-photos' | 'student-documents' | 'payment-receipts' | 'invoices'

const SIGNED_URL_SECONDS = 300
const MAX_BYTES: Record<Bucket, number> = {
  'student-photos': 2 * 1024 * 1024,
  'student-documents': 5 * 1024 * 1024,
  'payment-receipts': 5 * 1024 * 1024,
  invoices: 5 * 1024 * 1024,
}

export type UploadedFile = { path: string; name: string; type: string; size: number }

/**
 * Sube un archivo dentro de una carpeta del bucket y devuelve su ruta.
 * Las imágenes se achican antes de subir.
 */
export async function uploadFile(bucket: Bucket, folder: string, original: File, prefix = ''): Promise<UploadedFile> {
  const file = await compressImage(original, bucket === 'student-photos' ? { maxSide: 720, quality: 0.82 } : {})

  if (file.size > MAX_BYTES[bucket]) {
    throw new Error(`El archivo pesa demasiado. El máximo es ${MAX_BYTES[bucket] / (1024 * 1024)} MB.`)
  }

  const path = `${folder}/${prefix}${crypto.randomUUID()}.${fileExtension(file)}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: '3600',
  })
  if (error) throw error

  return { path, name: original.name, type: file.type, size: file.size }
}

export async function getSignedUrl(bucket: Bucket, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

/** Abre un archivo privado en una pestaña nueva. */
export async function openFile(bucket: Bucket, path: string) {
  // La pestaña se abre antes de pedir el enlace para que el navegador no la bloquee
  const tab = window.open('', '_blank')
  try {
    const url = await getSignedUrl(bucket, path)
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.href = url
    }
  } catch (error) {
    tab?.close()
    throw error
  }
}

/** Enlace firmado para mostrar una imagen. Devuelve undefined mientras carga o si no hay ruta. */
export function useSignedUrl(bucket: Bucket, path: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ['signed-url', bucket, path],
    queryFn: () => getSignedUrl(bucket, path as string),
    enabled: Boolean(path),
    staleTime: (SIGNED_URL_SECONDS - 60) * 1000,
    gcTime: SIGNED_URL_SECONDS * 1000,
    retry: false,
  })
  return data
}

/** Varios enlaces firmados en una sola llamada (para listas con fotos). */
export function useSignedUrls(bucket: Bucket, paths: (string | null | undefined)[]) {
  const clean = [...new Set(paths.filter((p): p is string => Boolean(p)))].sort()
  const { data } = useQuery({
    queryKey: ['signed-urls', bucket, clean],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(clean, SIGNED_URL_SECONDS)
      if (error) throw error
      const map: Record<string, string> = {}
      for (const item of data) {
        if (item.path && item.signedUrl) map[item.path] = item.signedUrl
      }
      return map
    },
    enabled: clean.length > 0,
    staleTime: (SIGNED_URL_SECONDS - 60) * 1000,
    gcTime: SIGNED_URL_SECONDS * 1000,
    retry: false,
  })
  return data ?? {}
}
