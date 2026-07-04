import { useState, useCallback, useEffect } from 'react'
import { fetchApi } from '@/lib/api'
import { getErrorMessage } from '@/hooks/useToast'
import type { KnowledgeDocument, KnowledgeSearchResult, KnowledgeIndexResult } from '@/types.ts'

export type { KnowledgeDocument, KnowledgeSearchResult, KnowledgeIndexResult }

export function useKnowledge() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetchApi<{ items: KnowledgeDocument[] }>('/api/knowledge')
      setDocuments(res.data?.items ?? [])
    } catch (e) {
      setError(getErrorMessage(e, 'Gagal memuat dokumen'))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchApi<{ items: KnowledgeDocument[] }>('/api/knowledge')
        if (!cancelled) setDocuments(res.data?.items ?? [])
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, 'Gagal memuat dokumen'))
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const createDoc = useCallback(async (data: { title: string; content: string; source?: string | null }) => {
    const res = await fetchApi<KnowledgeDocument>('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.data) setDocuments((prev) => [res.data!, ...prev])
    return res.data
  }, [])

  const updateDoc = useCallback(async (id: string, data: Partial<{ title: string; content: string; source: string | null; isActive: boolean }>) => {
    const res = await fetchApi<KnowledgeDocument>(`/api/knowledge/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.data) {
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...res.data! } : d)))
    }
    return res.data
  }, [])

  const deleteDoc = useCallback(async (id: string) => {
    await fetchApi(`/api/knowledge/${id}`, { method: 'DELETE' })
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const reindexDoc = useCallback(async (id: string) => {
    return fetchApi<KnowledgeIndexResult>(`/api/knowledge/${id}/reindex`, { method: 'POST' })
  }, [])

  const reindexAll = useCallback(async () => {
    return fetchApi<{ items: KnowledgeIndexResult[] }>('/api/knowledge/reindex-all', { method: 'POST' })
  }, [])

  const search = useCallback(async (query: string, topK = 3) => {
    const res = await fetchApi<{ items: KnowledgeSearchResult[] }>('/api/knowledge/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: String(topK) }),
    })
    return res.data?.items ?? []
  }, [])

  return { documents, loading, error, createDoc, updateDoc, deleteDoc, reindexDoc, reindexAll, search, reload: fetchDocs }
}