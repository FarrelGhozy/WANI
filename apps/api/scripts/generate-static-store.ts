import { prisma } from '../src/config/prisma.js';
import { renderTemplate } from '../src/services/template-engine.service.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const OUTPUT_DIR = process.env.STATIC_OUTPUT_DIR || './dist/static';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  imageUrl: string | null;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

async function generateStore(slug: string): Promise<void> {
  const store = await prisma.webStore.findUnique({
    where: { slug, isPublished: true },
    include: {
      merchant: {
        select: {
          businessName: true,
          phone: true,
          address: true,
          categories: {
            include: {
              products: {
                where: { isAvailable: true, stock: { gt: 0 } },
                orderBy: { name: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
      },
    },
  });

  if (!store) {
    console.error(`Store "${slug}" not found or not published`);
    process.exit(1);
  }

  const theme = await renderTemplate(
    store.template || undefined,
    store.theme as Record<string, unknown> | null,
  );

  const categories = store.merchant.categories;
  const merchant = store.merchant;
  const businessName = escape(merchant.businessName);
  const seoTitle = store.seoTitle || `${businessName} — Online Store`;
  const seoDesc = store.seoDesc || `Belanja online di ${businessName}`;

  const googleFontsLink = theme.googleFonts.length > 0
    ? `<link href="https://fonts.googleapis.com/css2?${theme.googleFonts.map((f) => `family=${f.replace(/\s+/g, '+')}:wght@400;500;600;700`).join('&')}&display=swap" rel="stylesheet" />`
    : '';

  const productCards = categories.map((cat) => {
    if (cat.products.length === 0) return '';
    const productsHtml = cat.products.map((p) => `
        <div class="product-card" style="background:${theme.config.colors.background};border:1px solid ${theme.config.colors.text}10;border-radius:${theme.config.layout.rounded ? '0.75rem' : '0'};box-shadow:${theme.config.layout.shadows ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none'};overflow:hidden;transition:all 0.2s ease;">
          <div style="aspect-ratio:1;background:linear-gradient(135deg, ${theme.config.colors.primary}20, ${theme.config.colors.secondary}20);${theme.config.layout.rounded ? 'border-radius:0.75rem 0.75rem 0 0' : ''}"></div>
          <div style="padding:0.75rem;">
            <h3 style="margin:0 0 0.25rem;font-size:0.9rem;font-weight:600;color:${theme.config.colors.text}">${escape(p.name)}</h3>
            ${p.description ? `<p style="margin:0 0 0.5rem;font-size:0.75rem;color:${theme.config.colors.text}80">${escape(p.description)}</p>` : ''}
            <p style="margin:0;font-weight:700;color:${theme.config.colors.primary}">Rp${p.price.toLocaleString('id-ID')}</p>
            ${p.stock <= 0 ? '<p style="margin:0.25rem 0 0;font-size:0.7rem;color:#EF4444">Stok habis</p>' : ''}
          </div>
        </div>`).join('\n');

    return `
      <section style="margin-bottom:2.5rem;">
        <h2 style="margin:0 0 1rem;font-size:1.25rem;font-weight:600;color:${theme.config.colors.text}">${escape(cat.name)}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;">
          ${productsHtml}
        </div>
      </section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDesc}" />
  <meta property="og:title" content="${seoTitle}" />
  <meta property="og:description" content="${seoDesc}" />
  <meta property="og:type" content="website" />
  ${googleFontsLink}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${theme.config.fonts.body}, system-ui, sans-serif;
      background: ${theme.config.colors.background};
      color: ${theme.config.colors.text};
      -webkit-font-smoothing: antialiased;
    }
    a { color: ${theme.config.colors.primary}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; height: auto; }
    .store-container { max-width: 72rem; margin: 0 auto; padding: 0 1rem; }
    .store-btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      background: ${theme.config.colors.primary}; color: ${theme.config.colors.background};
      border: none; border-radius: ${theme.config.layout.rounded ? '9999px' : '0'};
      padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; text-decoration: none;
    }
    .store-btn:hover { opacity: 0.9; text-decoration: none; }
    .product-card:hover {
      box-shadow: ${theme.config.layout.shadows ? '0 10px 15px -3px rgb(0 0 0 / 0.15)' : 'none'};
      transform: ${theme.config.layout.shadows ? 'translateY(-2px)' : 'none'};
    }
    .store-hero {
      background: linear-gradient(135deg, ${theme.config.colors.primary}10, ${theme.config.colors.secondary}10);
      border-radius: ${theme.config.layout.rounded ? '1rem' : '0'};
    }
    ${theme.css}
  </style>
</head>
<body>
  <nav style="position:sticky;top:0;z-index:50;background:${theme.config.colors.background};border-bottom:1px solid ${theme.config.colors.text}10;">
    <div class="store-container" style="display:flex;align-items:center;justify-content:space-between;padding-top:0.75rem;padding-bottom:0.75rem;">
      <span style="font-weight:700;font-size:1.1rem;color:${theme.config.colors.primary}">${businessName}</span>
      <a href="https://wa.me/${merchant.phone.replace(/^0/, '62')}" target="_blank" class="store-btn">
        Hubungi via WA
      </a>
    </div>
  </nav>

  ${(store.heroImage || store.heroText) ? `
  <section class="store-hero" style="margin:1rem;padding:3rem 1rem;text-align:center;position:relative;overflow:hidden;">
    ${store.heroImage ? `<img src="${escape(store.heroImage)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.15;" />` : ''}
    <div style="position:relative;">
      ${store.heroText ? `<h1 style="font-size:1.75rem;font-weight:700;color:${theme.config.colors.text}">${escape(store.heroText)}</h1>` : ''}
      <div style="margin-top:0.75rem;font-size:0.85rem;color:${theme.config.colors.text}80;display:flex;flex-wrap:wrap;justify-content:center;gap:1rem;">
        ${merchant.address ? `<span>${escape(merchant.address)}</span>` : ''}
        <span>${merchant.phone}</span>
      </div>
    </div>
  </section>` : ''}

  <main class="store-container" style="padding-top:2rem;padding-bottom:2rem;">
    ${categories.length === 0 ? '<p style="text-align:center;padding:3rem 0;color:' + theme.config.colors.text + '60;">Toko belum memiliki produk</p>' : productCards}
  </main>

  <footer style="border-top:1px solid ${theme.config.colors.text}10;padding:2rem 0;text-align:center;font-size:0.85rem;color:${theme.config.colors.text}60;">
    <p>${businessName}</p>
    ${merchant.address ? `<p style="margin-top:0.5rem;">${escape(merchant.address)}</p>` : ''}
    <a href="https://wa.me/${merchant.phone.replace(/^0/, '62')}" target="_blank" style="margin-top:0.75rem;display:inline-flex;align-items:center;gap:0.25rem;font-weight:500;color:${theme.config.colors.primary}">
      ${merchant.phone}
    </a>
  </footer>
</body>
</html>`;

  const outDir = path.join(OUTPUT_DIR, slug);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');

  console.log(`✅ ${slug}/index.html generated (${(html.length / 1024).toFixed(1)} KB)`);
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.log('Usage: npx tsx scripts/generate-static-store.ts <slug1> [slug2...]');
    console.log('       npx tsx scripts/generate-static-store.ts --all');
    process.exit(0);
  }

  if (slugs[0] === '--all') {
    const stores = await prisma.webStore.findMany({ where: { isPublished: true } });
    for (const s of stores) {
      await generateStore(s.slug);
    }
    console.log(`\n🎉 Generated ${stores.length} store(s)`);
  } else {
    for (const slug of slugs) {
      await generateStore(slug);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
