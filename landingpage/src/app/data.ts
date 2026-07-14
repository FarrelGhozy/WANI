import { Clock, Package, Zap, BarChart3, Users, Bell } from "lucide-react";

export const FEATURES = [
  {
    icon: Clock,
    title: "Auto-Reply 24/7",
    desc: "Bot WANI balas chat pelanggan kapan aja, bahkan saat kamu tidur. Nggak ada pelanggan yang nunggu lama.",
    color: "bg-teal-50 text-teal-700",
  },
  {
    icon: Package,
    title: "Proses Pesanan Otomatis",
    desc: "Terima pesanan, konfirmasi stok, dan kirim ringkasan order ke kamu — semua tanpa perlu buka HP.",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: Zap,
    title: "Integrasi Katalog Produk",
    desc: "Hubungkan katalog produkmu. Bot langsung tahu harga, stok, dan varian produk yang tersedia.",
    color: "bg-teal-50 text-teal-700",
  },
  {
    icon: BarChart3,
    title: "Laporan Penjualan Harian",
    desc: "Rekap pesanan masuk, produk terlaris, dan total omzet langsung di WhatsApp kamu tiap malam.",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: Users,
    title: "Multi-Nomor WhatsApp",
    desc: "Kelola beberapa nomor bisnis dari satu dashboard. Cocok untuk yang punya lebih dari satu toko.",
    color: "bg-teal-50 text-teal-700",
  },
  {
    icon: Bell,
    title: "Broadcast Promosi",
    desc: "Kirim pesan promo ke ratusan pelanggan sekaligus, dengan personalisasi nama otomatis.",
    color: "bg-rose-50 text-rose-700",
  },
];

export const STEPS = [
  {
    num: "01",
    title: "Daftar & Sambungkan WA",
    desc: "Daftar akun WANI dan sambungkan nomor WhatsApp bisnis kamu. Prosesnya selesai dalam 5 menit, tanpa perlu keahlian teknis.",
  },
  {
    num: "02",
    title: "Atur Produk & Script Bot",
    desc: "Upload katalog produk dan sesuaikan cara bot ngobrol dengan pelanggan — pakai template siap pakai atau buat sendiri.",
  },
  {
    num: "03",
    title: "Aktifkan & Santai",
    desc: "Bot WANI langsung aktif melayani pelanggan. Kamu bisa fokus ke produksi, pengiriman, dan pengembangan bisnis.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Sari Dewi",
    role: "Owner Toko Baju \"Bunga Sari\"",
    location: "Bandung",
    quote:
      "Sebelum pakai WANI, saya harus balas WA sendiri dari pagi sampai malem. Sekarang bot yang handle, saya bisa fokus ke produksi. Omzet naik 40% dalam 2 bulan!",
    rating: 5,
    avatar: "SD",
  },
  {
    name: "Ahmad Fauzi",
    role: "Pemilik Kopi Nusantara",
    location: "Surabaya",
    quote:
      "Awalnya ragu, kirain susah settingnya. Ternyata gampang banget. Pelanggan saya juga happy karena dibalas cepet 24 jam. Recommended banget buat UMKM!",
    rating: 5,
    avatar: "AF",
  },
  {
    name: "Rina Kusuma",
    role: "Reseller Skincare \"Glow by Rina\"",
    location: "Jakarta",
    quote:
      "Bot-nya pinter banget. Bisa jawab soal kandungan produk, cara pakai, sampai proses COD. Pelanggan saya kira ada CS beneran yang standby 24 jam.",
    rating: 5,
    avatar: "RK",
  },
];

export interface Plan {
  name: string
  monthlyPrice: number | null
  yearlyPrice: number | null
  desc: string
  features: string[]
  cta: string
  highlight: boolean
}

export const PLANS: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 199000,
    yearlyPrice: 159000,
    desc: "Untuk UMKM yang baru mulai digitalisasi",
    features: [
      "1 nomor WhatsApp",
      "500 pesan/bulan",
      "Katalog produk (maks. 50 item)",
      "Auto-reply & FAQ bot",
      "Laporan harian",
      "Support via email",
    ],
    cta: "Mulai Gratis 14 Hari",
    highlight: false,
  },
  {
    name: "Bisnis",
    monthlyPrice: 499000,
    yearlyPrice: 399000,
    desc: "Untuk bisnis aktif yang siap scale up",
    features: [
      "3 nomor WhatsApp",
      "Pesan tak terbatas",
      "Katalog produk tak terbatas",
      "Proses pesanan otomatis",
      "Broadcast promosi",
      "Laporan mingguan & bulanan",
      "Support prioritas (WhatsApp)",
    ],
    cta: "Mulai Gratis 14 Hari",
    highlight: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    desc: "Untuk bisnis besar dengan kebutuhan khusus",
    features: [
      "Nomor WhatsApp tak terbatas",
      "Custom AI & script",
      "Integrasi sistem internal",
      "Dedicated account manager",
      "SLA 99.9% uptime",
      "Training & onboarding tim",
    ],
    cta: "Hubungi Kami",
    highlight: false,
  },
];

export interface ChatMessage {
  from: "user" | "bot"
  text: string
}

export const CHAT_MESSAGES: ChatMessage[] = [
  { from: "user", text: "Halo, ada hijab motif bunga nggak?" },
  {
    from: "bot",
    text: "Halo Kak! Ada dong 🌸 Hijab motif bunga tersedia dalam 3 warna: sage green, dusty pink, dan ivory. Harga Rp 95.000/pcs.\n\nMau lihat fotonya?",
  },
  { from: "user", text: "Yang dusty pink ada stok berapa?" },
  {
    from: "bot",
    text: "Stok dusty pink masih 12 pcs ya Kak 😊 One size fits all, panjang 175cm.\n\nMau order sekarang?",
  },
  { from: "user", text: "Mau! 2 pcs ya" },
  {
    from: "bot",
    text: "Siap Kak! Boleh minta nama lengkap & alamat pengirimannya? Kami pakai JNE & Sicepat 📦",
  },
];

export const TRUST_STATS = [
  { value: "2.400+", label: "UMKM Aktif" },
  { value: "98%", label: "Tingkat Kepuasan" },
  { value: "4.2 jt+", label: "Pesan Diproses" },
  { value: "24/7", label: "Siap Melayani" },
];

export function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
