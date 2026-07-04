import { useState, useCallback } from 'react'
import { useKnowledge, type KnowledgeSearchResult } from '@/hooks/useKnowledge'
import { useToast } from '@/hooks/useToast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import type { KnowledgeDocument } from '@/types'

type EditingDoc = { id: string; title: string; content: string; source: string | null } | null

export default function KnowledgeBaseTab() {
  const { documents, loading, createDoc, updateDoc, deleteDoc, reindexDoc, reindexAll, search } = useKnowledge()
  const { toast, apiError } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EditingDoc>(null)
  const [form, setForm] = useState({ title: '', content: '', source: '' })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [reindexingAll, setReindexingAll] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm({ title: '', content: '', source: '' })
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((doc: KnowledgeDocument) => {
    setEditing({ id: doc.id, title: doc.title, content: doc.content, source: doc.source })
    setForm({ title: doc.title, content: doc.content, source: doc.source ?? '' })
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast('Judul dan konten wajib diisi', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = { title: form.title.trim(), content: form.content.trim(), source: form.source.trim() || null }
      if (editing) {
        await updateDoc(editing.id, payload)
        toast('Dokumen diperbarui & di-reindex', 'success')
      } else {
        await createDoc(payload)
        toast('Dokumen dibuat & di-index', 'success')
      }
      setModalOpen(false)
    } catch (e) {
      apiError(e, 'Gagal menyimpan dokumen')
    }
    setSaving(false)
  }, [form, editing, createDoc, updateDoc, toast, apiError])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Hapus dokumen ini? Semua chunk akan ikut terhapus.')) return
    try {
      await deleteDoc(id)
      toast('Dokumen dihapus', 'info')
    } catch (e) {
      apiError(e, 'Gagal menghapus')
    }
  }, [deleteDoc, toast, apiError])

  const handleReindex = useCallback(async (id: string) => {
    setBusyId(id)
    try {
      await reindexDoc(id)
      toast('Reindex selesai', 'success')
    } catch (e) {
      apiError(e, 'Gagal reindex')
    }
    setBusyId(null)
  }, [reindexDoc, toast, apiError])

  const handleReindexAll = useCallback(async () => {
    setReindexingAll(true)
    try {
      await reindexAll()
      toast('Semua dokumen di-reindex', 'success')
    } catch (e) {
      apiError(e, 'Gagal reindex semua')
    }
    setReindexingAll(false)
  }, [reindexAll, toast, apiError])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await search(searchQuery.trim())
      setSearchResults(results)
      if (results.length === 0) toast('Tidak ada hasil relevan', 'info')
    } catch (e) {
      apiError(e, 'Gagal mencari')
    }
    setSearching(false)
  }, [searchQuery, search, toast, apiError])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Knowledge Base (RAG)</h2>
          <p className="text-xs text-stone-500">{documents.length} dokumen · chunk otomatis di-embed dengan pgvector</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleReindexAll} disabled={reindexingAll || documents.length === 0}>
            {reindexingAll ? <Spinner size={14} /> : null}
            Reindex Semua
          </Button>
          <Button size="sm" onClick={openCreate}>+ Tambah Dokumen</Button>
        </div>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <EmptyState
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/></svg>}
          title="Belum ada dokumen"
          description="Tambahkan konten FAQ, kebijakan, atau info toko. Bot akan mencari otomatis saat customer bertanya."
          action={{ label: 'Tambah Dokumen', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} padding={false} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-stone-900">{doc.title}</h3>
                    {doc.isActive ? (
                      <Badge variant="teal" dot>Aktif</Badge>
                    ) : (
                      <Badge variant="gray">Nonaktif</Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-500">{doc.content.slice(0, 200)}{doc.content.length > 200 ? '…' : ''}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                    <span>{doc.chunkCount} chunks</span>
                    {doc.source && <span>· {doc.source}</span>}
                    <span>· {new Date(doc.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleReindex(doc.id)} disabled={busyId === doc.id}>
                    {busyId === doc.id ? <Spinner size={12} /> : 'Reindex'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-700">
                    Hapus
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Test Query */}
      <Card>
        <h3 className="text-sm font-semibold text-stone-900">Test Query</h3>
        <p className="mt-0.5 text-xs text-stone-500">Cari knowledge chunk relevan dengan cosine similarity</p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Coba: berapa lama pengiriman?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
            {searching ? <Spinner size={14} /> : 'Cari'}
          </Button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((r, i) => (
              <div key={i} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-700">{r.documentTitle}</span>
                  <Badge variant="teal">{(r.score * 100).toFixed(1)}% match</Badge>
                </div>
                <p className="mt-1.5 text-stone-600">{r.content.slice(0, 300)}{r.content.length > 300 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Dokumen' : 'Tambah Dokumen'}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              {saving ? 'Menyimpan...' : editing ? 'Simpan & Reindex' : 'Simpan & Index'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Judul"
            placeholder="FAQ Pengiriman"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Konten"
            placeholder="Pengiriman 1-3 hari kerja dalam kota. Untuk luar kota 3-5 hari..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={8}
          />
          <Input
            label="Sumber (opsional)"
            placeholder="URL / file / manual"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            hint="Catatan asal dokumen"
          />
          <p className="text-xs text-stone-400">
            Dokumen akan otomatis di-chunk &amp; di-embed (OpenAI text-embedding-3-small 1536 dim).
          </p>
        </div>
      </Modal>
    </div>
  )
}