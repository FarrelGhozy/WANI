export function formatPrice(price: number): string {
  return `Rp${price.toLocaleString('id-ID')}`
}

export function formatDate(date: string | Date, options?: { timeOnly?: boolean; long?: boolean }): string {
  const d = new Date(date)
  if (options?.timeOnly) {
    return d.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  }
  const opts: Intl.DateTimeFormatOptions = options?.long
    ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  return d.toLocaleDateString('id-ID', opts)
}
