import { clsx, type ClassValue } from 'clsx'

/** Une clases condicionales: cn('a', activo && 'b') */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
