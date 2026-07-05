import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function parsePBDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(dateStr: string | undefined | null, options?: Intl.DateTimeFormatOptions): string {
  const d = parsePBDate(dateStr)
  if (!d) return '\u2014'
  return d.toLocaleDateString('en-US', options)
}

export function formatDateTime(dateStr: string | undefined | null): string {
  const d = parsePBDate(dateStr)
  if (!d) return '\u2014'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
