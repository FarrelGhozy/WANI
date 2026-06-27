import { useState } from 'react'
import type { Category } from '@/hooks/useProducts.ts'
import { useToast } from '@/hooks/useToast.ts'
import Modal from '@/components/ui/Modal.tsx'
import Button from '@/components/ui/Button.tsx'
import Input from '@/components/ui/Input.tsx'

interface CategoryItem extends Category {
  productCount?: number
}

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  categories: CategoryItem[]
  onCreate: (data: { name: string; description?: string | null }) => Promise<Category | undefined>
  onUpdate: (id: string, data: { name?: string; description?: string | null }) => Promise<Category | undefined>
  onDelete: (id: string) => Promise<void>
}

export default function CategoryModal({ open, onClose, categories, onCreate, onUpdate, onDelete }: CategoryModalProps) {
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  function resetNew() {
    setNewName('')
    setNewDesc('')
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await onCreate({ name: newName.trim(), description: newDesc.trim() || null })
      toast('Kategori berhasil ditambahkan', 'success')
      resetNew()
    } catch {
      toast('Gagal menambahkan kategori', 'error')
    } finally {
      setCreating(false)
    }
  }

  function startEdit(cat: CategoryItem) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDesc(cat.description ?? '')
    setEditErrors({})
  }

  async function handleEdit() {
    if (!editingId) return
    if (!editName.trim()) {
      setEditErrors({ editName: 'Nama kategori wajib diisi' })
      return
    }
    try {
      await onUpdate(editingId, { name: editName.trim(), description: editDesc.trim() || null })
      toast('Kategori berhasil diperbarui', 'success')
      setEditingId(null)
    } catch {
      toast('Gagal memperbarui kategori', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete(id)
      toast('Kategori berhasil dihapus', 'success')
      setDeleteId(null)
    } catch {
      toast('Gagal menghapus kategori', 'error')
    }
  }

  const deleteTarget = deleteId ? categories.find((c) => c.id === deleteId) : null

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Kelola Kategori"
      >
        {/* Add new */}
        <div className="mb-5 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <h3 className="mb-3 text-sm font-medium text-teal-800">Tambah Kategori Baru</h3>
          <div className="space-y-3">
            <Input
              placeholder="Nama kategori"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Deskripsi (opsional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
                Simpan
              </Button>
              {newName || newDesc ? (
                <Button size="sm" variant="secondary" onClick={resetNew}>Batal</Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Category list */}
        {categories.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-stone-500">Belum ada kategori. Buat kategori pertama di atas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 transition-colors hover:border-stone-300"
              >
                {editingId === cat.id ? (
                  <div className="flex flex-1 flex-col gap-2">
                    <Input
                      placeholder="Nama kategori"
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setEditErrors((prev) => ({ ...prev, editName: '' })) }}
                      error={editErrors.editName}
                    />
                    <Input
                      placeholder="Deskripsi (opsional)"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEdit} disabled={!editName.trim()}>Simpan</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setEditingId(null); setEditErrors({}) }}>Batal</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-sm font-semibold text-teal-600">
                        {cat.productCount ?? 0}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-stone-500">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                        title="Edit"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Hapus"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Hapus Kategori"
        actions={
          <Button variant="danger" size="sm" onClick={() => handleDelete(deleteId!)}>
            Hapus
          </Button>
        }
      >
        <p className="text-sm text-stone-600">
          Yakin ingin menghapus kategori <strong className="text-stone-900">{deleteTarget?.name}</strong>?
          Produk dalam kategori ini akan menjadi <strong className="text-stone-900">Tanpa Kategori</strong>.
        </p>
      </Modal>
    </>
  )
}
