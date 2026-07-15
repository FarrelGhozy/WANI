export type TourIconName = 'welcome' | 'dashboard' | 'products' | 'orders' | 'customers' | 'website' | 'settings'

export interface TourStep {
  icon: TourIconName
  title: string
  description: string
}

export const tourSteps: TourStep[] = [
  {
    icon: 'welcome',
    title: 'Selamat Datang di WANI!',
    description:
      'WANI membantu Anda mengelola toko, melayani pelanggan lewat WhatsApp, dan menjual produk dengan mudah. Ikuti tur singkat ini untuk mengenal fitur-fiturnya.',
  },
  {
    icon: 'dashboard',
    title: 'Dashboard',
    description:
      'Lihat ringkasan bisnis Anda: total pendapatan, pesanan yang perlu diproses, status produk, dan koneksi WhatsApp — semua di satu halaman.',
  },
  {
    icon: 'products',
    title: 'Produk',
    description:
      'Tambahkan produk, atur stok dan harga, kelola kategori. Produk akan muncul di website toko Anda secara otomatis.',
  },
  {
    icon: 'orders',
    title: 'Pesanan',
    description:
      'Konfirmasi dan proses pesanan masuk. Pantau status dari tertunda hingga selesai.',
  },
  {
    icon: 'customers',
    title: 'Pelanggan',
    description:
      'Lihat daftar pelanggan dan riwayat chat mereka. Balas pesan langsung dari dashboard.',
  },
  {
    icon: 'website',
    title: 'Website',
    description:
      'Toko online Anda tampil dengan link khusus. Pelanggan bisa lihat produk dan pesan langsung.',
  },
  {
    icon: 'settings',
    title: 'Pengaturan',
    description:
      'Atur profil toko, hubungkan WhatsApp, dan konfigurasi AI Agent untuk otomatis membalas pelanggan.',
  },
]
