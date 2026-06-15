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

  console.log(`
  ✅ Seed complete!
  ──────────────────────
  🏪 Merchant: ${merchant.businessName} (ID: ${merchant.id})
  📦 Products: ${products.count}
  👤 Customer: ${customer.name}
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
