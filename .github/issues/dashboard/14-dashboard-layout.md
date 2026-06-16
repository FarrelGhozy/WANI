# DSH-14 — Dashboard Layout: Sidebar, Header, Responsive

## Deskripsi
Buat layout utama dashboard dengan sidebar navigasi, header, dan responsive container untuk semua halaman. Layout ini akan dipake oleh semua halaman dashboard (products, orders, chats, dll).

## Task Checklist

### 1. Layout Component (`app/dashboard/layout.tsx`)
```typescript
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 2. Sidebar Component
```
┌─────────────────────┐
│  WANI Logo          │
│                     │
│  📊 Overview        │  ← active state highlight
│  🛍️ Products        │
│  📦 Orders          │
│  💬 Chats           │
│  🤖 AI Config       │
│  👥 Customers       │
│  ⚙️ Settings        │
│  🌐 Web Store       │
│                     │
│  ─────────────────  │
│  🚪 Logout          │
└─────────────────────┘
```

- [ ] Sidebar dengan menu navigasi (icon + label)
- [ ] Active state: background color berbeda untuk halaman aktif
- [ ] Collapsible di mobile (hamburger menu)
- [ ] WANI logo di atas (bisa click ke /dashboard)
- [ ] Nama toko di bagian bawah sidebar
- [ ] Logout button di bagian bawah
- [ ] Transisi smooth pas collapse/expand

### 3. Header Component
- [ ] Breadcrumb: "Dashboard > Products"
- [ ] Nama merchant + avatar di kanan
- [ ] Mobile hamburger button (toggle sidebar)
- [ ] Responsive: breadcrumb bisa di-scroll kalo panjang

### 4. Mobile Responsive
- [ ] Desktop (>1024px): sidebar visible, content di samping
- [ ] Tablet (768-1024px): sidebar collapsible, icon-only mode
- [ ] Mobile (<768px): sidebar hidden, overlay saat dibuka
- [ ] Touch-friendly: minimal tap target 44x44px

### 5. Shared UI Primitives
Buat komponen dasar yang akan dipake semua halaman:

- [ ] `Button` — variants: primary, secondary, outline, ghost, danger
- [ ] `Input` — with label, error state, icon support
- [ ] `Card` — container dengan shadow + rounded
- [ ] `Badge` — status badge (colors: green, yellow, red, blue, gray)
- [ ] `Table` — responsive table with sort headers
- [ ] `Dialog` — modal confirmation
- [ ] `Select` — dropdown select with search
- [ ] `Switch` — toggle component
- [ ] `Loading` — spinner component
- [ ] `Skeleton` — loading placeholder

### 6. Theme & Global Styling
- [ ] Custom color palette (via Tailwind config)
- [ ] Font: Inter (from Google Fonts atau local)
- [ ] Consistent spacing: p-6 untuk content
- [ ] Dark mode support (optional, bisa pake next-themes)

### 7. Navigation Config
```typescript
// src/lib/navigation.ts
export const dashboardNav = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/chats', label: 'Chats', icon: MessageSquare },
  { href: '/dashboard/ai-config', label: 'AI Config', icon: Cpu },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/web-store', label: 'Web Store', icon: Globe },
] as const;
```

## Verification
- [ ] Sidebar semua menu muncul dan bisa diklik
- [ ] Active state berubah sesuai halaman aktif
- [ ] Sidebar collapse di mobile
- [ ] Breadcrumb menunjukkan path yang benar
- [ ] Layout responsive di semua ukuran layar
- [ ] Loading skeleton muncul sebelum content

## Labels
`frontend`, `dashboard`, `layout`, 🔴 high

## Dependencies
DSH-13

## Estimasi
1-2 hari
