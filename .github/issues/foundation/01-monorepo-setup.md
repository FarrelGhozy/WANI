# FND-01 — Setup pnpm Monorepo Workspace

## Deskripsi
Inisialisasi pnpm workspace di root project. Semua kode akan diorganisir sebagai monorepo dengan folder `apps/` dan `packages/`.

## Task Checklist
- [ ] Buat `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```
- [ ] Update root `package.json`:
  ```json
  {
    "name": "wani",
    "private": true,
    "scripts": {
      "dev:api": "pnpm --filter @wani/api dev",
      "dev:web": "pnpm --filter @wani/web dev",
      "dev": "pnpm run --parallel dev:api dev:web",
      "build": "pnpm run --parallel build",
      "test": "pnpm run --parallel test",
      "lint": "pnpm run --parallel lint"
    }
  }
  ```
- [ ] Hapus `node_modules` yang existing
- [ ] `pnpm install` dari root — verifikasi workspace terbaca
- [ ] Update `.gitignore` — tambah `node_modules` di semua level
- [ ] Update `.dockerignore` — tambah pattern untuk monorepo

## File yang Diubah
- `pnpm-workspace.yaml` — NEW
- `package.json` — UPDATE
- `.gitignore` — UPDATE
- `.dockerignore` — UPDATE

## Definition of Done
- `pnpm install` dari root sukses
- `pnpm ls -r` menampilkan workspace structure
- Folder strukturnya:
  ```
  WANI/
  ├── pnpm-workspace.yaml
  ├── package.json (root)
  ├── apps/         (kosong, akan diisi)
  └── packages/     (kosong, akan diisi)
  ```

## Labels
`foundation`, `monorepo`, 🔴 high

## Estimasi
3-4 jam
