# TPL-28 — Template Preview & Selector di Dashboard

## Deskripsi
Buat UI di dashboard untuk memilih dan preview template, plus theme customization (warna, font, layout).

## Task Checklist

### 1. Template Selector UI
```
┌─ Pilih Template ─────────────────────────────────────┐
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │          │  │          │  │          │          │
│  │  Modern  │  │  Minimal │  │  Classic │          │
│  │  (Active)│  │          │  │          │          │
│  │          │  │          │  │          │          │
│  │  🖼️      │  │  🖼️      │  │  🖼️      │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  [Terapkan Template]                                 │
└──────────────────────────────────────────────────────┘
```

- [ ] Grid dengan card preview per template
- [ ] Thumbnail preview (color swatches + sample layout)
- [ ] Active state: border + check mark
- [ ] Nama template di bawah card
- [ ] "Terapkan" button → update WebStore.template
- [ ] Preview on hover: tooltip atau modal

### 2. Theme Customization
```
┌─ Kustomisasi Tema ──────────────────────────────────────┐
│                                                         │
│  Warna                                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Primary:   [■ #4F46E5] [🎨]  Secondary: [■ ...]│    │
│  │ Background:[■ #FFFFFF] [🎨]  Surface:   [■ ...]│    │
│  │ Text:      [■ #111827] [🎨]  Muted:     [■ ...]│    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Font                                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Heading: [Inter                          ▼]     │    │
│  │ Body:    [Inter                          ▼]     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Layout                                                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Hero Style:    [Centered ▼]  Card Style: [Elevated]│  │
│  │ Border Radius: [Large   ▼]  Spacing: [Comfortable]│  │
│  │ Hero Height:   [Medium  ▼]                         │  │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Reset ke Default Template]  [Simpan Kustomisasi]     │
└─────────────────────────────────────────────────────────┘
```

- [ ] **Color picker**: input type="color" atau custom color picker
- [ ] **Font selector**: dropdown dengan pilihan Google Fonts
- [ ] **Layout options**: dropdown untuk tiap layout property
- [ ] **Reset button**: kembali ke config default template
- [ ] **Save**: `PUT /api/web-store/:merchantId` dengan theme config

### 3. Live Preview
- [ ] "Preview" button → buka `/store/[slug]?preview=true` di tab baru
- [ ] Atau iframe di dalam dashboard untuk live preview
- [ ] Jika iframe: auto-refresh saat theme berubah (debounce)

### 4. Template Thumbnail Generation
- [ ] Generate thumbnail sederhana untuk tiap template (color swatches)
- [ ] Atau simpan image URL di database

### 5. Integration
- [ ] Tab "Templates" di halaman `/dashboard/web-store`
- [ ] Atau bagian terpisah di halaman yang sama

## Verification
- [ ] Template selector menampilkan 3 template
- [ ] Click template → highlight active
- [ ] Color picker berfungsi
- [ ] Font selector dropdown
- [ ] Layout options dropdown
- [ ] Save → theme tersimpan
- [ ] Preview → tampilkan dengan theme baru

## Labels
`frontend`, `dashboard`, `template`, 🟢 low

## Dependencies
TPL-27, DSH-14

## Estimasi
1-2 hari
