'use client';

import { useState } from 'react';
import { ShoppingCart, X, Minus, Plus, Package, ImageOff } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

interface Props {
  product: Product;
  phone: string;
  businessName: string;
  isRounded: boolean;
  isShadow: boolean;
}

export function StoreProductCard({ product, phone, businessName, isRounded, isShadow }: Props) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);

  const waNumber = phone.replace(/^0/, '62');
  const waMessage = encodeURIComponent(
    `Halo ${businessName}, saya mau pesan:\n\n*${product.name}*\nJumlah: ${qty}\nHarga: ${formatRupiah(product.price * qty)}\n\nMohon info ketersediaan dan totalnya.`,
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  const roundedClass = isRounded ? 'rounded-xl' : 'rounded-none';
  const shadowClass = isShadow ? 'shadow-sm hover:shadow-md' : '';

  return (
    <>
      <button
        onClick={() => { setOpen(true); setQty(1); }}
        className={`group flex flex-col overflow-hidden border border-surface-200 bg-white text-left transition-all ${roundedClass} ${shadowClass} hover:-translate-y-0.5`}
      >
        <div className="aspect-square overflow-hidden bg-surface-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-surface-300">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between p-3">
          <div>
            <h3 className="text-sm font-medium text-surface-900 line-clamp-2">{product.name}</h3>
            {product.description && (
              <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{product.description}</p>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-primary-600">{formatRupiah(product.price)}</span>
            {product.stock <= 0 && (
              <span className="text-xs text-red-500">Habis</span>
            )}
          </div>
        </div>
      </button>

      {/* ─── Detail Modal ─── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div
            className={`w-full bg-white sm:max-w-md ${isRounded ? 'rounded-t-2xl sm:rounded-2xl' : ''} max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-surface-200 bg-white px-5 py-3">
              <span className="text-sm font-medium text-surface-500">Detail Produk</span>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-surface-100">
                <X className="h-5 w-5 text-surface-500" />
              </button>
            </div>

            <div className="p-5">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`mb-4 w-full object-cover ${isRounded ? 'rounded-lg' : ''}`}
                  style={{ maxHeight: 280 }}
                />
              )}

              <h2 className="text-lg font-bold text-surface-900">{product.name}</h2>

              {product.description && (
                <p className="mt-2 text-sm text-surface-600 whitespace-pre-wrap">{product.description}</p>
              )}

              <p className="mt-3 text-2xl font-bold text-primary-600">{formatRupiah(product.price)}</p>

              <div className="mt-2 flex items-center gap-2 text-sm text-surface-500">
                <Package className="h-4 w-4" />
                {product.stock > 0 ? `Stok: ${product.stock}` : 'Stok habis'}
              </div>

              {/* ─── Quantity Selector ─── */}
              {product.stock > 0 && (
                <div className="mt-5">
                  <label className="text-sm font-medium text-surface-700">Jumlah</label>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-300 hover:bg-surface-50"
                    >
                      <Minus className="h-4 w-4 text-surface-600" />
                    </button>
                    <span className="w-8 text-center text-lg font-semibold">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-300 hover:bg-surface-50"
                    >
                      <Plus className="h-4 w-4 text-surface-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Total & WA Button ─── */}
              {product.stock > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-600">Subtotal</span>
                    <span className="font-bold text-surface-900">{formatRupiah(product.price * qty)}</span>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Pesan via WhatsApp
                  </a>
                </div>
              )}

              {product.stock <= 0 && (
                <p className="mt-5 text-center text-sm text-red-500">Maaf, produk ini sedang habis</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
