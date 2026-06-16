# FIN-33 — Dev Tooling + GitHub Templates + Final Verification

## Deskripsi
Setup development tooling (ESLint, Prettier, Husky), GitHub issue/PR templates, dan final verification checklist untuk memastikan semuanya siap.

## Task Checklist

### 1. ESLint & Prettier
- [ ] **ESLint** — setup untuk TypeScript:
  - [ ] `@typescript-eslint/parser`
  - [ ] `@typescript-eslint/eslint-plugin`
  - [ ] Rules: no-unused-vars, no-explicit-any (warning), consistent-return
  - [ ] `eslint.config.js` (flat config)
- [ ] **Prettier** — format config:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
    "tabWidth": 2,
    "printWidth": 100
  }
  ```
- [ ] Integrasi: ESLint + Prettier (eslint-config-prettier)
- [ ] `pnpm lint` — ESLint check semua code
- [ ] `pnpm format` — Prettier format semua code
- [ ] `pnpm lint:fix` — auto-fix ESLint issues

### 2. Husky + lint-staged
- [ ] `husky install`
- [ ] **Pre-commit hook**: lint-staged
  - [ ] `*.ts` → eslint --fix + prettier --write
  - [ ] `*.tsx` → eslint --fix + prettier --write
  - [ ] `*.json` → prettier --write
  - [ ] `*.md` → prettier --write
- [ ] **Pre-push hook**: pnpm test
- [ ] **Commit msg hook**: commitlint (conventional commits)

### 3. Editor Config
- [ ] `.editorconfig`:
  ```ini
  root = true

  [*]
  indent_style = space
  indent_size = 2
  charset = utf-8
  trim_trailing_whitespace = true
  insert_final_newline = true
  end_of_line = lf
  ```
- [ ] `.vscode/extensions.json`:
  ```json
  {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "bradlc.vscode-tailwindcss",
      "Prisma.prisma"
    ]
  }
  ```
- [ ] `.vscode/settings.json`:
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    },
    "typescript.tsdk": "node_modules/typescript/lib"
  }
  ```

### 4. GitHub Issue Templates (`.github/ISSUE_TEMPLATE/`)
- [ ] **Bug report** (`bug_report.md`):
  ```markdown
  ---
  name: Bug Report
  about: Laporkan bug untuk membantu kami improve
  ---
  
  **Deskripsi Bug**
  [jelaskan bugnya]
  
  **Steps to Reproduce**
  1. Buka halaman ...
  2. Click ...
  3. Error ...
  
  **Expected Behavior**
  ...
  
  **Screenshots**
  ...
  
  **Environment**
  - Browser: [e.g., Chrome 120]
  - OS: [e.g., Ubuntu 22.04]
  - Docker: [yes/no]
  ```

- [ ] **Feature request** (`feature_request.md`):
  ```markdown
  ---
  name: Feature Request
  about: Saran fitur baru untuk WANI
  ---
  
  **Fitur yang diminta**
  [jelaskan fiturnya]
  
  **Kenapa fitur ini penting?**
  ...
  
  **Alternatif saat ini**
  ...
  ```

### 5. GitHub PR Template (`.github/PULL_REQUEST_TEMPLATE.md`)
```markdown
## Deskripsi
[jelaskan apa yang diubah]

## Related Issue
Closes #...

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Saya sudah test perubahan ini
- [ ] Kode mengikuti coding standards
- [ ] Sudah ada test untuk perubahan ini (jika relevan)
- [ ] Documentation sudah diupdate

## Screenshots (jika UI change)
```

### 6. Final Pre-Ship Verification
Complete checklist untuk memastikan semuanya siap:

- [ ] `pnpm install` — clean install works tanpa error
- [ ] `pnpm lint` — no ESLint errors
- [ ] `pnpm format` — all files formatted
- [ ] `pnpm test` — all tests passing
- [ ] `pnpm build` — API + Web build sukses
- [ ] `pnpm dev:api` — API starts on port 3001
- [ ] `pnpm dev:web` — Web starts on port 3000
- [ ] `curl localhost:3001/health` — `{"status":"ok","db":"connected"}`
- [ ] Login page at `localhost:3000/login`
- [ ] Register works → redirect ke dashboard
- [ ] Dashboard layout with sidebar
- [ ] Products CRUD works
- [ ] Orders list with data
- [ ] Web store at `/store/[slug]` accessible
- [ ] `docker compose up` — 3 containers running
- [ ] Semua documentation file ada
- [ ] Husky hooks installed

## Verification
- [ ] `pnpm lint` passes
- [ ] Pre-commit hook runs linter
- [ ] GitHub templates visible in `.github/`
- [ ] Final checklist all items completed

## Labels
`tooling`, `github`, `quality-of-life`, 🟢 low

## Dependencies
Semua issue sebelumnya

## Estimasi
1 hari
