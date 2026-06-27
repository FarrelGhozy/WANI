# api

REST API server WANI — Express 5 + Prisma 7 + OpenRouter AI pipeline.
Bagian dari platform omnichannel [WANI](https://github.com/anomalyco/WANI).

```bash
bun install                         # install dependencies
bun run prisma:generate             # generate Prisma client
bun run prisma:migrate              # apply dev migrations
bun run src/index.ts                # start server (port 3001)
bun test                            # run tests
```

Lihat [ARSITEKTUR.md](ARSITEKTUR.md) untuk dokumentasi lengkap.
