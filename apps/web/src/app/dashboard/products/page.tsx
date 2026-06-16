'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Package,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Loading } from '@/components/ui/loading';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  description?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductForm {
  name: string;
  price: string;
  stock: string;
  description: string;
  categoryId: string;
  isAvailable: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  price: '',
  stock: '0',
  description: '',
  categoryId: '',
  isAvailable: true,
};

const stockBadge = (stock: number) => {
  if (stock === 0) return { variant: 'danger' as const, label: 'Habis' };
  if (stock <= 10) return { variant: 'warning' as const, label: 'Stok Terbatas' };
  return { variant: 'success' as const, label: 'Tersedia' };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvailable, setFilterAvailable] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<string>('');

  const [deleteDialog, setDeleteDialog] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 10;

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (filterCategory) params.set('categoryId', filterCategory);
    if (filterAvailable === 'true') params.set('isAvailable', 'true');
    if (filterAvailable === 'false') params.set('isAvailable', 'false');

    const res = await api.get<{ data: Product[]; meta: { total: number } }>(
      `/products?${params}`,
    );
    if (res.success) {
      setProducts(res.data.data);
      setTotal(res.data.meta.total);
      setError('');
    } else {
      setError(res.error || 'Gagal memuat produk');
    }
    setLoading(false);
  }, [page, search, filterCategory, filterAvailable]);

  const fetchCategories = useCallback(async () => {
    const res = await api.get<{ data: Category[] }>('/categories');
    if (res.success) {
      setCategories(res.data.data);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterAvailable]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  };

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormErrors('');
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || '',
      categoryId: product.categoryId || '',
      isAvailable: product.isAvailable,
    });
    setFormErrors('');
    setModalOpen(true);
  }

  async function handleSave() {
    setFormErrors('');
    if (!form.name.trim()) { setFormErrors('Nama produk wajib diisi'); return; }
    const price = Number(form.price);
    if (!price || price <= 0) { setFormErrors('Harga harus lebih dari 0'); return; }

    setSaving(true);
    const body = {
      name: form.name,
      price,
      stock: Number(form.stock) || 0,
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,
      isAvailable: form.isAvailable,
    };

    const res = editingProduct
      ? await api.put(`/products/${editingProduct.id}`, body)
      : await api.post('/products', body);

    setSaving(false);
    if (res.success) {
      setModalOpen(false);
      fetchProducts();
    } else {
      setFormErrors(res.error || 'Gagal menyimpan produk');
    }
  }

  async function handleDelete() {
    if (!deleteDialog) return;
    setDeleting(true);
    const res = await api.delete(`/products/${deleteDialog.id}`);
    setDeleting(false);
    if (res.success) {
      setDeleteDialog(null);
      fetchProducts();
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900">Produk</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-surface-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filterAvailable}
            onChange={(e) => setFilterAvailable(e.target.value)}
            className="rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
          {(search || filterCategory || filterAvailable) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setSearchInput(''); setFilterCategory(''); setFilterAvailable(''); }}
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-surface-500">{error}</p>
            <Button onClick={fetchProducts} variant="outline">Coba Lagi</Button>
          </div>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-16">
            <Package className="h-12 w-12 text-surface-300" />
            <h3 className="text-lg font-semibold text-surface-700">Belum ada produk</h3>
            <p className="text-sm text-surface-400">
              {search ? `Tidak ada produk dengan kata kunci "${search}"` : 'Tambah produk pertama untuk mulai menerima pesanan'}
            </p>
            {!search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Tambah Produk Pertama
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <Card padding={false}>
            <div className="p-4 text-sm text-surface-500 border-b border-surface-200">
              Menampilkan {products.length} dari {total} produk
            </div>
            <Table<Product>
              keyField="id"
              columns={[
                {
                  key: 'name',
                  header: 'Produk',
                  cell: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100">
                        {row.imageUrl ? (
                          <img src={row.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-surface-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{row.name}</p>
                        {row.category && (
                          <p className="text-xs text-surface-400">{row.category.name}</p>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'price',
                  header: 'Harga',
                  cell: (row) => (
                    <span className="font-medium">{formatRupiah(row.price)}</span>
                  ),
                },
                {
                  key: 'stock',
                  header: 'Stok',
                  cell: (row) => {
                    const b = stockBadge(row.stock);
                    return <Badge variant={b.variant}>{b.label} ({row.stock})</Badge>;
                  },
                },
                {
                  key: 'isAvailable',
                  header: 'Status',
                  cell: (row) => (
                    <span className={row.isAvailable ? 'text-green-600' : 'text-red-500'}>
                      {row.isAvailable ? 'Aktif' : 'Nonaktif'}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Aksi',
                  className: 'text-right',
                  cell: (row) => (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(row)}
                        className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-primary-600"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteDialog(row)}
                        className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={products}
              emptyText="Tidak ada produk"
            />
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-surface-500">
                Hal {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Nama Produk *</label>
            <input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
              placeholder="Nasi Goreng"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
              rows={3}
              placeholder="Deskripsi produk..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Harga *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                placeholder="15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Stok</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Kategori</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              <option value="">Pilih kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isAvailable}
              onChange={(v) => setForm(f => ({ ...f, isAvailable: v }))}
              label="Produk aktif"
            />
          </div>
          {formErrors && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formErrors}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        title="Hapus Produk"
      >
        <p className="text-sm text-surface-600 mb-6">
          Yakin hapus <strong>{deleteDialog?.name}</strong>? Produk akan dinonaktifkan, data pesanan tetap tersimpan.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteDialog(null)}>Batal</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
