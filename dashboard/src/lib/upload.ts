export interface UploadResult {
  success: boolean
  url: string | null
  error?: string
}

const API_BASE = window.__ENV__?.API_URL ?? '/api'

export async function uploadFile(file: File, prefix: string): Promise<UploadResult> {
  const body = new FormData()
  body.append('file', file)
  body.append('prefix', prefix)

  const token = localStorage.getItem('wani_auth_token')
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body,
  })

  const json = (await res.json()) as { status: string; data?: { url: string } }

  if (json.status === 'success' && json.data?.url) {
    return { success: true, url: json.data.url }
  }

  return { success: false, url: null, error: 'upload failed' }
}
