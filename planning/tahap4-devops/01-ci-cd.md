# CI/CD Pipeline — Tahap 4

> GitHub Actions untuk lint, typecheck, test, build, dan deploy

---

## Pipeline Stages

```
Push/PR
  │
  ├─► Lint (ESLint)
  ├─► TypeCheck (tsc --noEmit)
  ├─► Test (bun test + vitest)
  ├─► Build (Docker)
  │     ├─► api image
  │     ├─► dashboard image
  │     ├─► wa-bot image
  │     └─► (web-gen is library, no image)
  └─► Deploy (conditional on main branch)
```

---

## GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  BUN_VERSION: '1.3'

jobs:
  # ──── Lint ────
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Lint API
        run: cd api && bun install && bun run lint || echo "No lint script"

      - name: Lint Dashboard
        run: cd dashboard && bun install && bun run lint

  # ──── Type Check ────
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: TypeCheck API
        run: cd api && bun install && bun run prisma:generate && bun run tsc --noEmit

      - name: TypeCheck Dashboard
        run: cd dashboard && bun install && bun run build

      - name: TypeCheck Web-Gen
        run: cd web-gen && bun install && bun run tsc --noEmit

      - name: TypeCheck WA-Bot
        run: cd wa-bot && bun install && bun run prisma:generate && bun run tsc --noEmit

  # ──── Test ────
  test:
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: wani_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Test API
        run: |
          cd api
          bun install
          bun run prisma:generate
          DATABASE_URL=postgresql://postgres:test@localhost:5432/wani_test bun run prisma:migrate
          bun test --coverage
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_USER: postgres
          DATABASE_PASSWORD: test
          DATABASE_NAME: wani_test
          JWT_SECRET: test-secret

      - name: Test Dashboard
        run: cd dashboard && bun install && bun test --coverage

      - name: Test Web-Gen
        run: cd web-gen && bun install && bun test --coverage

      - name: Test WA-Bot
        run: cd wa-bot && bun install && bun run prisma:generate && bun test --coverage
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_USER: postgres
          DATABASE_PASSWORD: test
          DATABASE_NAME: wani_test

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: api/coverage/lcov.info,dashboard/coverage/lcov.info,web-gen/coverage/lcov.info,wa-bot/coverage/lcov.info

  # ──── Build Docker Images ────
  build:
    runs-on: ubuntu-latest
    needs: [test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push API
        uses: docker/build-push-action@v6
        with:
          context: .
          file: api/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/wani-api:latest

      - name: Build & Push Dashboard
        uses: docker/build-push-action@v6
        with:
          context: .
          file: dashboard/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/wani-dashboard:latest

      - name: Build & Push WA-Bot
        uses: docker/build-push-action@v6
        with:
          context: .
          file: wa-bot/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/wani-wa-bot:latest

  # ──── Coverage Gate ────
  coverage-gate:
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - name: Coverage Check
        uses: orgoro/coverage@v3
        with:
          coverageFile: api/coverage/coverage-summary.json
          thresholdAll: 0.8  # 80% overall
```

---

## PR Checks

Setiap PR harus lulus sebelum bisa merge:

1. ✅ Lint (ESLint)
2. ✅ TypeCheck (tsc --noEmit)
3. ✅ Test (bun test + vitest)
4. ✅ Coverage (≥ 80%)
5. ✅ Build (Docker images)

### Branch Protection Rules (GitHub Settings)

```
main branch:
  - Require PR before merging
  - Require approvals: 1
  - Require status checks: lint, typecheck, test, coverage-gate
  - Require conversation resolution
```

---

## Deployment

### Staging (auto-deploy dari main)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/wani
            docker compose pull
            docker compose up -d --remove-orphans
```

### Production (manual trigger)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production
on:
  workflow_dispatch:  # Manual trigger

jobs:
  deploy:
    # ... deploy ke production server
```

---

## Checklist CI/CD

- [ ] GitHub Actions workflow running
- [ ] Lint stage green
- [ ] TypeCheck stage green
- [ ] Test stage green
- [ ] Coverage gate ≥ 80%
- [ ] Docker images built and pushed ke GHCR
- [ ] Staging auto-deploy dari main
- [ ] Production deploy via manual trigger
- [ ] Branch protection rules enabled
- [ ] PR template dengan checklist
