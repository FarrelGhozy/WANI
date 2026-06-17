import { notFound } from 'next/navigation';
import { ShoppingCart, MapPin, Phone, ExternalLink } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { StoreProductCard } from '@/components/store/product-card';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Merchant {
  businessName: string;
  phone: string;
  address: string | null;
}

interface RenderedTheme {
  name: string;
  label: string;
  cssVars: Record<string, string>;
  css: string;
  googleFonts: string[];
  config: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    layout: Record<string, unknown>;
  };
}

interface WebStoreData {
  id: string;
  slug: string;
  template: string;
  seoTitle: string | null;
  seoDesc: string | null;
  heroImage: string | null;
  heroText: string | null;
  theme: Record<string, unknown> | null;
  renderedTheme: RenderedTheme;
  merchant: Merchant;
  categories: Category[];
}

async function getStore(slug: string): Promise<WebStoreData | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api:3001';
    const res = await fetch(`${apiUrl}/api/web-store/public/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data ?? null;
  } catch {
    return null;
  }
}

function themeVars(theme: RenderedTheme | null): Record<string, string> {
  return theme?.cssVars ?? {};
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStore(slug);

  if (!store) notFound();

  const rt = store.renderedTheme;
  const layout = rt?.config?.layout ?? {};
  const isRounded = layout.rounded !== false;
  const isShadow = layout.shadows !== false;

  return (
    <div
      style={themeVars(rt) as React.CSSProperties}
      className="min-h-screen"
    >
      {rt?.googleFonts?.length > 0 && (
        <link
          href={`https://fonts.googleapis.com/css2?${rt.googleFonts.map((f) => `family=${f.replace(/\s+/g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`}
          rel="stylesheet"
        />
      )}
      {rt?.css && <style>{rt.css}</style>}

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b store-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold" style={{ color: 'var(--store-primary)' }}>
            {store.merchant.businessName}
          </span>
          <a
            href={`https://wa.me/${store.merchant.phone.replace(/^0/, '62')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--store-primary)' }}
          >
            <ShoppingCart className="h-4 w-4" />
            Hubungi
          </a>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      {store.heroImage || store.heroText ? (
        <section className="relative overflow-hidden store-hero">
          {store.heroImage && (
            <img
              src={store.heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
            {store.heroText && (
              <h1 className="text-3xl font-bold md:text-5xl" style={{ color: 'var(--store-text)' }}>
                {store.heroText}
              </h1>
            )}
            <div
              className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm"
              style={{ color: `color-mix(in srgb, var(--store-text) 60%, transparent)` }}
            >
              {store.merchant.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {store.merchant.address}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {store.merchant.phone}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Categories & Products ─── */}
      <main className="mx-auto max-w-6xl px-4 py-8" style={{ backgroundColor: 'var(--store-bg)' }}>
        {store.categories.length === 0 ? (
          <div className="py-20 text-center" style={{ color: `color-mix(in srgb, var(--store-text) 40%, transparent)` }}>
            <p className="text-lg">Toko belum memiliki produk</p>
          </div>
        ) : (
          store.categories.map((cat) => {
            const available = cat.products.filter((p) => p.stock > 0);
            if (available.length === 0 && cat.products.length === 0) return null;

            return (
              <section key={cat.id} className="mb-10">
                <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--store-text)' }}>
                  {cat.name}
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {cat.products.map((product) => (
                    <StoreProductCard
                      key={product.id}
                      product={product}
                      phone={store.merchant.phone}
                      businessName={store.merchant.businessName}
                      isRounded={isRounded}
                      isShadow={isShadow}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t py-8 text-center text-sm store-footer">
        <p>{store.merchant.businessName}</p>
        {store.merchant.address && <p className="mt-1">{store.merchant.address}</p>}
        <a
          href={`https://wa.me/${store.merchant.phone.replace(/^0/, '62')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium store-link hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          {store.merchant.phone}
        </a>
      </footer>
    </div>
  );
}
