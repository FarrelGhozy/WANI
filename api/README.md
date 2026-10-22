# api

REST API server WANI — Express 5 + Prisma 7 + AI pipeline (OpenRouter-compatible).
Bagian dari platform omnichannel [WANI](https://github.com/anomalyco/WANI).

```bash
bun install                         # install dependencies
bun run prisma:generate             # generate Prisma client
bun run prisma:migrate              # apply dev migrations
bun run src/index.ts                # start server (port 3001)
bun run test                        # unit tests (bun test test/)
bun run test:e2e                    # integration tests (bun test e2e/)
```

Dokumentasi lengkap: [Docs/SERVICES/API.md](../Docs/SERVICES/API.md) ·
[ARSITEKTUR.md](ARSITEKTUR.md) (symlink ke file yang sama).
