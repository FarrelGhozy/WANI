# API-06 — Web Store CRUD Endpoints

## Deskripsi
Buat REST API endpoints untuk mengelola Web Store config dan Template.

## Task Checklist

### 1. Service: `apps/api/src/services/web-store.service.ts`
- [ ] `getWebStore(merchantId)` — ambil config web store
- [ ] `updateWebStore(merchantId, data)` — update slug, template, theme, SEO
- [ ] `publishWebStore(merchantId)` — set isPublished = true
- [ ] `unpublishWebStore(merchantId)` — set isPublished = false
- [ ] `getWebStoreBySlug(slug)` — untuk public access (hanya published)
- [ ] `listTemplates()` — ambil semua template
- [ ] `getTemplate(name)` — detail satu template

### 2. Routes: `apps/api/src/routes/web-store.routes.ts`
```typescript
GET    /api/web-store/:merchantId    → getWebStore
PUT    /api/web-store/:merchantId    → updateWebStore
POST   /api/web-store/:merchantId/publish   → publishWebStore
POST   /api/web-store/:merchantId/unpublish → unpublishWebStore
GET    /api/web-store/public/:slug   → getWebStoreBySlug (no auth)
GET    /api/templates                → listTemplates
GET    /api/templates/:name          → getTemplate
```

### 3. Validasi (Zod schemas)
```typescript
const updateWebStoreSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  template: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
  heroImage: z.string().url().optional(),
  heroText: z.string().max(200).optional(),
  theme: z.object({
    colors: z.object({ ... }).optional(),
    fonts: z.object({ ... }).optional(),
    layout: z.object({ ... }).optional(),
  }).optional(),
});
```

### 4. Tambahkan WebStore model ke Prisma (jika belum)
```prisma
model WebStore {
  id           String   @id @default(uuid())
  merchantId   String   @unique @map("merchant_id")
  slug         String   @unique
  template     String   @default("default")
  isPublished  Boolean  @default(false) @map("is_published")
  customDomain String?  @map("custom_domain")
  seoTitle     String?
  seoDesc      String?
  theme        Json?
  heroImage    String?  @map("hero_image")
  heroText     String?  @map("hero_text")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  merchant Merchant @relation(fields: [merchantId], references: [id])
  @@map("web_stores")
}

model Template {
  id        String   @id @default(uuid())
  name      String   @unique
  label     String
  thumbnail String?
  config    Json?
  isPublic  Boolean  @default(true) @map("is_public")
  createdAt DateTime @default(now()) @map("created_at")
  @@map("templates")
}
```

### 5. Seed data templates
- [ ] Tambah seed untuk minimal 3 template di `prisma/seed.ts`

### 6. Register routes di `server.ts`
```typescript
import { webStoreRouter } from './routes/web-store.routes.js';
app.use('/api', webStoreRouter);
```

## Verification
- [ ] `POST /api/web-store/:id/publish` → isPublished = true
- [ ] `GET /api/web-store/public/:slug` → return data (hanya published)
- [ ] `GET /api/templates` → return list templates
- [ ] Validasi error: slug duplikat → 409

## Labels
`api`, `web-store`, 🔴 high

## Dependencies
FND-02, FND-03

## Estimasi
1 hari
