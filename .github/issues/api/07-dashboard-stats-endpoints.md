# API-07 — Dashboard Stats Aggregation Endpoints

## Deskripsi
Buat endpoint untuk aggregate data yang ditampilkan di halaman Overview dashboard: total order, revenue, AI handle rate, growth, recent orders, dan activity log.

## Task Checklist

### 1. Service: `apps/api/src/services/dashboard.service.ts`
```typescript
interface DashboardStats {
  totalOrders: number;
  revenue: number;        // bulan ini
  revenueGrowth: number;  // % growth dari bulan lalu
  aiHandleRate: number;   // % percakapan di-handle AI vs human
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  source: string;
  createdAt: Date;
  previewMessage: string; // cuplikan pesan customer
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
}
```

- [ ] `getDashboardStats(merchantId)` — aggregate semua data
- [ ] `getRecentOrders(merchantId, limit)` — 5 order terbaru
- [ ] `getRecentActivity(merchantId, limit)` — 10 activity log terbaru
- [ ] `getGrowthRate(merchantId)` — % pertumbuhan bulan ini vs bulan lalu

### 2. Query detail
```typescript
async getDashboardStats(merchantId: string): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    monthlyRevenue,
    lastMonthRevenue,
    totalConversations,
    aiConversations,
    pendingOrders,
    totalCustomers,
    totalProducts,
  ] = await Promise.all([
    // Query masing-masing parallel
  ]);

  return { /* ... */ };
}
```

### 3. Routes: `apps/api/src/routes/dashboard.routes.ts`
```typescript
GET /api/dashboard/stats          → getDashboardStats (auth required)
GET /api/dashboard/recent-orders  → getRecentOrders
GET /api/dashboard/activity       → getRecentActivity
```

### 4. JWT middleware
- [ ] Semua endpoint dashboard pake `requireMerchant` middleware
- [ ] Merchant ID dari JWT token, bukan dari params

### 5. Error handling
- [ ] Kalo merchant tidak ditemukan → 404
- [ ] Kalo data kosong → return 0 / empty array (bukan error)
- [ ] Response format konsisten: `{ success: true, data: ... }`

## Verification
- [ ] `curl -H "Authorization: Bearer <token>" localhost:3001/api/dashboard/stats`
- [ ] Return: `{ totalOrders: 47, revenue: 12500000, aiHandleRate: 92, ... }`
- [ ] Data berubah setelah ada order baru / activity baru
- [ ] Growth rate calculation benar (bulan ini vs bulan lalu)

## Labels
`api`, `dashboard`, 🔴 high

## Dependencies
FND-02

## Estimasi
1 hari
