# TPL-27 — Template System Engine + Seed Templates

## Deskripsi
Buat sistem template yang memungkinkan web store tampil dengan gaya berbeda. Template berisi konfigurasi warna, font, layout, dan diterapkan via CSS variables.

## Task Checklist

### 1. Template Architecture
```typescript
// src/lib/template-engine.ts

export interface TemplateConfig {
  name: string;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    heroStyle: 'centered' | 'left-aligned' | 'full-width' | 'minimal';
    cardStyle: 'elevated' | 'bordered' | 'minimal' | 'flat';
    borderRadius: 'none' | 'sm' | 'md' | 'lg';
    spacing: 'compact' | 'comfortable' | 'spacious';
    heroHeight: 'small' | 'medium' | 'large' | 'full';
  };
}
```

- [ ] Buat type `TemplateConfig` dengan semua property
- [ ] Buat fungsi `getTemplateConfig(templateName, merchantOverrides?)` → merge default + merchant theme
- [ ] Buat CSS variable generator dari config

### 2. Template Provider Component
```typescript
// src/components/store/template-provider.tsx
'use client';

import { createContext, useContext } from 'react';

// Apply CSS variables to :root based on template config
function TemplateProvider({ config, children }) {
  const cssVars = {
    '--color-primary': config.colors.primary,
    '--color-secondary': config.colors.secondary,
    '--color-background': config.colors.background,
    '--color-surface': config.colors.surface,
    '--color-text': config.colors.text,
    '--color-text-muted': config.colors.textMuted,
    '--font-heading': config.fonts.heading,
    '--font-body': config.fonts.body,
    '--radius': getRadiusValue(config.layout.borderRadius),
    '--spacing': getSpacingValue(config.layout.spacing),
  };

  return <div style={cssVars as React.CSSProperties}>{children}</div>;
}
```

### 3. Three Seed Templates
Buat 3 template dengan karakter berbeda:

#### Modern (Default)
```typescript
{
  name: 'modern',
  label: 'Modern',
  colors: {
    primary: '#4F46E5',     // Indigo
    secondary: '#F59E0B',   // Amber
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textMuted: '#6B7280',
    accent: '#10B981',      // Green
  },
  fonts: { heading: 'Inter', body: 'Inter' },
  layout: {
    heroStyle: 'centered',
    cardStyle: 'elevated',
    borderRadius: 'lg',
    spacing: 'comfortable',
    heroHeight: 'medium',
  },
}
```

#### Minimal
```typescript
{
  name: 'minimal',
  label: 'Minimal',
  colors: {
    primary: '#1F2937',     // Dark gray
    secondary: '#3B82F6',   // Blue
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#1F2937',
    textMuted: '#9CA3AF',
    accent: '#3B82F6',
  },
  fonts: { heading: 'Inter', body: 'Inter' },
  layout: {
    heroStyle: 'left-aligned',
    cardStyle: 'bordered',
    borderRadius: 'sm',
    spacing: 'compact',
    heroHeight: 'small',
  },
}
```

#### Classic
```typescript
{
  name: 'classic',
  label: 'Classic',
  colors: {
    primary: '#92400E',     // Warm brown
    secondary: '#D97706',   // Amber
    background: '#FFFBEB',
    surface: '#FEF3C7',
    text: '#1C1917',
    textMuted: '#78716C',
    accent: '#92400E',
  },
  fonts: { heading: 'Playfair Display', body: 'Inter' },
  layout: {
    heroStyle: 'centered',
    cardStyle: 'minimal',
    borderRadius: 'none',
    spacing: 'spacious',
    heroHeight: 'medium',
  },
}
```

### 4. CSS Variable Integration
- [ ] Update `globals.css` untuk menggunakan CSS variables dari template:
  ```css
  :root {
    --color-primary: #4F46E5;
    --color-secondary: #F59E0B;
    /* ... defaults */
  }

  .btn-primary {
    background-color: var(--color-primary);
  }

  .card {
    background-color: var(--color-surface);
    border-radius: var(--radius);
  }
  ```

### 5. Seed Template Data
- [ ] Tambah ke `prisma/seed.ts`: insert 3 templates ke database
- [ ] WebStore default template = 'modern'

### 6. Template API
- [ ] `GET /api/templates` — return semua template dengan config
- [ ] `GET /api/templates/:name` — detail satu template

## Verification
- [ ] 3 template tersedia di database
- [ ] Template config bisa di-merge dengan override merchant
- [ ] CSS variables ter-generate dengan benar
- [ ] Ganti template → warna & layout berubah

## Labels
`frontend`, `template`, 🟡 medium

## Dependencies
WST-24

## Estimasi
1-2 hari
