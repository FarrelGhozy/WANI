import { useRef, useState } from 'react'
import { useToast } from '@/hooks/useToast.ts'
import Spinner from '@/components/ui/Spinner.tsx'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  prefix?: string
  className?: string
}

export default function ImageUpload({ value, onChange, label, prefix = 'website', className = '' }: ImageUploadProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast('Hanya file PNG, JPEG, atau WebP yang didukung', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Ukuran file maksimal 2MB', 'error')
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('prefix', prefix)
      const token = localStorage.getItem('wani_auth_token')
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      })
      const json = (await res.json()) as { status: string; data?: { url: string } }
      if (json.status === 'success' && json.data?.url) {
        onChange(json.data.url)
      } else {
        throw new Error('upload failed')
      }
    } catch {
      toast('Gagal upload gambar', 'error')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-xs font-medium text-stone-500">{label}</label>}

      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
          <img
            src={value}
            alt={label ?? 'Uploaded image'}
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow hover:bg-stone-100 transition-colors"
            >
              Ganti
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-red-600 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          className={`flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
            dragOver
              ? 'border-teal-400 bg-teal-50'
              : 'border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100'
          }`}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Spinner />
              <span className="text-xs text-stone-400">Mengupload...</span>
            </>
          ) : (
            <>
              <svg className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-xs text-stone-400">Klik atau drop gambar (PNG/JPEG/WebP, max 2MB)</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
