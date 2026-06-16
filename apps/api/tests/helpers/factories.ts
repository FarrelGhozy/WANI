let counter = 0;

function uuid() {
  counter++;
  const s = counter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-a000-${s.slice(0, 12)}`;
}

export function buildMerchant(overrides?: Partial<{
  id: string;
  businessName: string;
  phone: string;
  address: string | null;
  isActive: boolean;
}>) {
  return {
    id: overrides?.id ?? uuid(),
    businessName: overrides?.businessName ?? 'Test Merchant',
    phone: overrides?.phone ?? `62812${String(counter).padStart(10, '0')}`,
    address: overrides?.address ?? null,
    isActive: overrides?.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildProduct(merchantId: string, overrides?: Partial<{
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  description: string | null;
  categoryId: string | null;
}>) {
  return {
    id: overrides?.id ?? uuid(),
    merchantId,
    name: overrides?.name ?? 'Test Product',
    price: overrides?.price ?? 15000,
    stock: overrides?.stock ?? 10,
    isAvailable: overrides?.isAvailable ?? true,
    description: overrides?.description ?? null,
    categoryId: overrides?.categoryId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildCustomer(merchantId: string, overrides?: Partial<{
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  totalOrders: number;
}>) {
  return {
    id: overrides?.id ?? uuid(),
    merchantId,
    name: overrides?.name ?? 'Test Customer',
    phone: overrides?.phone ?? `62813${String(counter).padStart(10, '0')}`,
    notes: overrides?.notes ?? null,
    totalOrders: overrides?.totalOrders ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildOrder(merchantId: string, customerId: string, overrides?: Partial<{
  id: string;
  status: string;
  totalAmount: number;
  source: string;
  notes: string | null;
}>) {
  return {
    id: overrides?.id ?? uuid(),
    merchantId,
    customerId,
    status: overrides?.status ?? 'PENDING',
    totalAmount: overrides?.totalAmount ?? 50000,
    source: overrides?.source ?? 'wa_chat',
    notes: overrides?.notes ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildWebStore(merchantId: string, overrides?: Partial<{
  id: string;
  slug: string;
  template: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  heroText: string | null;
}>) {
  return {
    id: overrides?.id ?? uuid(),
    merchantId,
    slug: overrides?.slug ?? `toko-${counter}`,
    template: overrides?.template ?? 'modern',
    isPublished: overrides?.isPublished ?? false,
    customDomain: null,
    seoTitle: overrides?.seoTitle ?? null,
    seoDesc: overrides?.seoDesc ?? null,
    theme: null,
    heroImage: null,
    heroText: overrides?.heroText ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
