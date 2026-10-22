# dashboard

Dashboard admin WANI — React 19 + TypeScript 6 + Vite 8 (Rolldown) + Tailwind v4.
Bagian dari platform omnichannel [WANI](https://github.com/anomalyco/WANI).

```bash
bun install        # install dependencies
bun run dev        # dev server (HMR, port 5173)
bun run build      # tsc -b && vite build
bun run lint       # eslint
bun run test       # vitest run
bun run preview    # vite preview
```

API base URL: `VITE_API_URL` (dari `dashboard/.env`) → `window.__ENV__.API_URL` → `/api`.
Vite dev server **tidak** mem-proxy `/api`, jadi untuk dev lokal isi
`VITE_API_URL=http://localhost:3001/api`. Di Docker, nginx yang mem-proxy `/api`, `/uploads`, `/s`.

Dokumentasi lengkap: [Docs/SERVICES/DASHBOARD.md](../Docs/SERVICES/DASHBOARD.md) ·
[ARCHITECTURE.md](ARCHITECTURE.md) (symlink ke file yang sama).
