# FND-04 — Scaffold Next.js apps/web

## Deskripsi
Buat foundation Next.js 14+ dengan App Router di `apps/web/`. Setup Tailwind, UI library, dan konfigurasi dasar.

## Task Checklist

### 1. Initialize Next.js
- [ ] `pnpm create next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir`
- [ ] Atau manual setup dengan konfigurasi yang tepat

### 2. Package.json
```json
{
  "name": "@wani/web",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@wani/database": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lucide-react": "^0.400.0",
    "next-themes": "^0.3.0",
    "zod": "^3.24.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### 3. Tailwind Config
- [ ] Setup tailwind.config.ts dengan custom colors:
  ```typescript
  colors: {
    primary: { 50: '...', 500: '#4F46E5', ... },
    surface: { ... },
    // dsb
  }
  ```
- [ ] Setup `cn()` utility di `src/lib/utils.ts`

### 4. next.config.ts
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { domains: ['localhost'] },
  output: 'standalone',
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
    },
  ],
};

export default nextConfig;
```

### 5. Global Layout & Styles
- [ ] Global CSS: `app/globals.css` dengan Tailwind directives
- [ ] Root layout: metadata, font Inter, body classes
- [ ] Test: `pnpm dev:web` → buka `http://localhost:3000` → Next.js muncul

### 6. Install dependencies
- [ ] `pnpm install` dari root — verifikasi `@wani/database` ter-link
- [ ] Coba import `@wani/database` di server component → sukses

## Definition of Done
- `pnpm dev:web` runs Next.js di port 3000
- `pnpm build` sukses tanpa error
- Import `@wani/database` works di server component
- Tailwind CSS generating correctly
- API proxy rewrite ke `localhost:3001` works

## Labels
`foundation`, `nextjs`, 🔴 high

## Dependencies
FND-01

## Estimasi
4-5 jam
