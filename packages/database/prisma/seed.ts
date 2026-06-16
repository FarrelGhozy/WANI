import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding WANI database...');

  // Create demo merchant
  const merchant = await prisma.merchant.upsert({
    where: { phone: '6281234567890' },
    update: {},
    create: {
      businessName: 'Warung Berkah',
      phone: '6281234567890',
      passwordHash: '$2b$12$lxzYe.rIA3ZUYcdb8s.5JOaPuj.CxXB/byQUnNiCQWNKkM0pFTypO',
      address: 'Jl. Merdeka No. 123, Jakarta',
      aiAgent: {
        create: {
          systemPrompt: `Kamu adalah AI Customer Service untuk Warung Berkah.
Gunakan bahasa Indonesia yang sopan dan ramah.

=== INFO TOKO ===
Warung Berkah buka setiap hari Senin-Sabtu, jam 08.00-17.00 WIB.
Lokasi: Jl. Merdeka No. 123, Jakarta.
Minimal order: Rp10.000.
Gratis ongkir area sekitar (maks 3km).

=== ATURAN ===
1. Jika customer ingin pesan, keluarkan format ORDER
2. Jika customer tanya harga/produk, jawab dari daftar produk
3. Jika customer marah/komplain, minta maaf dan escalation
4. JANGAN pernah mengarang produk yang tidak ada`,
          greetingMessage: 'Halo! 👋 Selamat datang di Warung Berkah. Ada yang bisa dibantu? Ketik MENU untuk lihat produk kami.',
          knowledgeBase: 'Buka Senin-Sabtu 08.00-17.00 WIB. Lokasi: Jl. Merdeka No. 123. Min order Rp10.000. Gratis ongkir 3km.',
        },
      },
      settings: {
        createMany: {
          data: [
            { key: 'currency', value: '"IDR"' },
            { key: 'timezone', value: '"Asia/Jakarta"' },
            { key: 'min_order', value: '10000' },
            { key: 'free_delivery_km', value: '3' },
          ],
        },
      },
    },
    include: { aiAgent: true },
  });

  // Create categories
  const kategoriMakanan = await prisma.category.create({
    data: { merchantId: merchant.id, name: 'Makanan', description: 'Makanan ringan & berat' },
  });
  const kategoriMinuman = await prisma.category.create({
    data: { merchantId: merchant.id, name: 'Minuman', description: 'Minuman dingin & hangat' },
  });

  // Create products
  const products = await prisma.product.createMany({
    data: [
      { merchantId: merchant.id, categoryId: kategoriMakanan.id, name: 'Nasi Goreng', price: 15000, stock: 20, description: 'Nasi goreng spesial + telur' },
      { merchantId: merchant.id, categoryId: kategoriMakanan.id, name: 'Mie Goreng', price: 12000, stock: 25, description: 'Mie goreng dengan sayuran' },
      { merchantId: merchant.id, categoryId: kategoriMakanan.id, name: 'Ayam Goreng', price: 18000, stock: 15, description: 'Ayam goreng tepung + sambal' },
      { merchantId: merchant.id, categoryId: kategoriMakanan.id, name: 'Pisang Goreng (10 pcs)', price: 10000, stock: 30, description: 'Pisang goreng crispy' },
      { merchantId: merchant.id, categoryId: kategoriMinuman.id, name: 'Es Teh Manis', price: 5000, stock: 50, description: 'Teh manis dengan es batu' },
      { merchantId: merchant.id, categoryId: kategoriMinuman.id, name: 'Kopi Hitam', price: 7000, stock: 40, description: 'Kopi hitam robusta' },
      { merchantId: merchant.id, categoryId: kategoriMinuman.id, name: 'Es Jeruk', price: 8000, stock: 35, description: 'Jeruk peras segar' },
      { merchantId: merchant.id, categoryId: kategoriMakanan.id, name: 'Nasi Kuning', price: 20000, stock: 10, description: 'Nasi kuning lengkap dengan lauk' },
    ],
  });

  // Create a demo customer
  const customer = await prisma.customer.create({
    data: {
      merchantId: merchant.id,
      name: 'Budi Santoso',
      phone: '6281234567891',
    },
  });

  // Create templates
  const templates = await Promise.all([
    prisma.template.upsert({
      where: { name: 'modern' },
      update: {},
      create: {
        name: 'modern',
        label: 'Modern',
        thumbnail: null,
        isPublic: true,
        config: {
          colors: { primary: '#4F46E5', secondary: '#7C3AED', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937' },
          fonts: { heading: 'Inter', body: 'Inter' },
          layout: { style: 'modern', rounded: true, shadows: true },
        },
      },
    }),
    prisma.template.upsert({
      where: { name: 'minimal' },
      update: {},
      create: {
        name: 'minimal',
        label: 'Minimal',
        thumbnail: null,
        isPublic: true,
        config: {
          colors: { primary: '#111827', secondary: '#374151', accent: '#3B82F6', background: '#F9FAFB', text: '#111827' },
          fonts: { heading: 'Inter', body: 'Inter' },
          layout: { style: 'minimal', rounded: false, shadows: false },
        },
      },
    }),
    prisma.template.upsert({
      where: { name: 'classic' },
      update: {},
      create: {
        name: 'classic',
        label: 'Klasik',
        thumbnail: null,
        isPublic: true,
        config: {
          colors: { primary: '#92400E', secondary: '#B45309', accent: '#D97706', background: '#FFFBEB', text: '#451A03' },
          fonts: { heading: 'Merriweather', body: 'Inter' },
          layout: { style: 'classic', rounded: false, shadows: true },
        },
      },
    }),
  ]);

  // Create web store for merchant
  await prisma.webStore.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      slug: 'warung-berkah',
      template: 'modern',
      isPublished: true,
      seoTitle: 'Warung Berkah — Belanja Online',
      seoDesc: 'Warung Berkah menyediakan makanan dan minuman dengan harga terjangkau. Pesan lewat WhatsApp!',
      heroText: 'Selamat datang di Warung Berkah! 🏪',
      theme: {
        colors: { primary: '#4F46E5', secondary: '#7C3AED', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937' },
        fonts: { heading: 'Inter', body: 'Inter' },
        layout: { style: 'modern', rounded: true, shadows: true },
      },
    },
  });

  console.log(`
  ✅ Seed complete!
  ──────────────────────
  🏪 Merchant: ${merchant.businessName} (ID: ${merchant.id})
  📦 Products: ${products.count}
  👤 Customer: ${customer.name}
  🎨 Templates: ${templates.length}
  🌐 Web Store: warung-berkah
  ──────────────────────
  `);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
