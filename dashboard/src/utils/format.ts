export function formatPrice(price: number): string {
  return `Rp${price.toLocaleString('id-ID')}`
}

export function formatDate(date: string | Date, options?: { timeOnly?: boolean; long?: boolean; withTz?: boolean }): string {
  const d = new Date(date)
  const fmt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  if (options?.timeOnly) {
    return d.toLocaleTimeString('id-ID', fmt).replace(/\./g, ':')
  }
  const dateOpts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: options?.long ? 'long' : 'short',
    year: 'numeric',
    ...fmt,
  }
  if (options?.withTz) dateOpts.timeZoneName = 'short'
  return d.toLocaleDateString('id-ID', dateOpts).replace(/\./g, ':')
}
