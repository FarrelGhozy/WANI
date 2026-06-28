import type { BadgeVariant } from '@/components/ui/Badge.tsx'

// Order status constants
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'

export const STATUS_BADGE: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'amber',
  CONFIRMED: 'teal',
  PROCESSING: 'teal',
  COMPLETED: 'gray',
  CANCELLED: 'red',
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Tertunda',
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

export const STATUS_LEGEND = [
  { color: 'bg-amber-400', label: 'Tertunda' },
  { color: 'bg-teal-400', label: 'Diproses' },
  { color: 'bg-teal-500', label: 'Selesai' },
] as const

// WA connection constants
export type WaConnection = 'connected' | 'disconnected' | 'connecting'

export const WA_STATUS_CONFIG: Record<WaConnection, { dot: string; label: string; bg: string }> = {
  connected: {
    dot: 'bg-teal-500',
    label: 'Terhubung',
    bg: 'bg-teal-50',
  },
  disconnected: {
    dot: 'bg-stone-400',
    label: 'Terputus',
    bg: 'bg-stone-50',
  },
  connecting: {
    dot: 'bg-amber-500',
    label: 'Menghubungkan...',
    bg: 'bg-amber-50',
  },
}

export function statusDot(status: string): string {
  return WA_STATUS_CONFIG[status as WaConnection]?.dot ?? 'bg-stone-400'
}

export function statusLabel(status: string): string {
  return WA_STATUS_CONFIG[status as WaConnection]?.label ?? 'Terputus'
}

export { type BadgeVariant }
