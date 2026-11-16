/**
 * Achica las fotos en el navegador antes de subirlas.
 * Una foto de celular pesa 3 a 8 MB; después de esto queda en 200 a 400 KB y
 * se sigue leyendo bien. Es lo que hace rendir el espacio de almacenamiento.
 */

type CompressOptions = {
  /** Lado más largo en píxeles */
  maxSide?: number
  /** Calidad JPEG de 0 a 1 */
  quality?: number
}

export async function compressImage(file: File, { maxSide = 1600, quality = 0.8 }: CompressOptions = {}) {
  // PDFs y otros formatos pasan sin tocar
  if (!file.type.startsWith('image/')) return file

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    // Si el navegador no puede leer la imagen (por ejemplo HEIC), se sube como vino
    return file
  }
}

export function fileExtension(file: File) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : undefined
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
