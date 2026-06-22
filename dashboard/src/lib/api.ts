interface ApiResponse<T> {
  status: 'success' | 'failure'
  message: string
  data: T | null
}

export async function fetchApi<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(path)
  const json = await res.json() as ApiResponse<T>

  if (json.status === 'failure') {
    throw new Error(json.message)
  }

  return json
}
