export function formatPrice(price: number): string {
  return `Rp${price.toLocaleString('id-ID')}`
}

export function formatDate(date: string | Date, options?: { timeOnly?: boolean; long?: boolean; withTz?: boolean }): string {
  const d = new Date(date)
  if (options?.timeOnly) {
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  const day = d.getDate()
  const year = d.getFullYear()
  const month = options?.long
    ? d.toLocaleDateString('id-ID', { month: 'long' })
    : d.toLocaleDateString('id-ID', { month: 'short' })
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const tz = options?.withTz
    ? ` ${Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value ?? ''}`
    : ''
  return `${day} ${month} ${year}, ${h}:${m}${tz}`
}
