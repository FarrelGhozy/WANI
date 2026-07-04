const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)
  || window.__ENV__?.API_URL || '/api'
const MEDIA_BASE = API_BASE.replace(/\/api$/, '')

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${MEDIA_BASE}${path}`
}
