# BUG-008: `.env` dengan Live Credentials Committed ke Git

| Field | Value |
|-------|-------|
| **ID** | BUG-008 |
| **Severity** | 🔴 CRITICAL |
| **Modul** | wa-bot |
| **File** | `wa-bot/.env` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

File `wa-bot/.env` mengandung database credentials dan API token real yang terlanjur di-commit ke git history. `.env` seharusnya di `.gitignore` tapi entah bagaimana file ini masuk ke git tracking.

## Dampak

1. **Database credentials exposed** — siapa pun dengan akses repo bisa connect ke database
2. **API token exposed** — bisa bypass auth dan kirim chat sebagai bot
3. **Jika repo public** — seluruh internet bisa akses infrastructure
4. **Compliance violation** — melanggar aturan lomba dan best practice keamanan

## Cara Reproduksi

```bash
# Cek apakah .env di-tracking oleh git
git ls-files wa-bot/.env
# Output: wa-bot/.env  ← FILE INI DI-TRACKING!

# Lihat isinya
git show HEAD:wa-bot/.env
# Output: berisi database password + API token real
```

## Rekomendasi Fix

### Langkah 1: Rotate semua credentials

```bash
# Di server production, generate credentials baru:
# 1. Database password baru
ALTER USER postgres WITH PASSWORD 'new-secure-password';

# 2. API token baru
openssl rand -hex 32

# Update .env dengan credentials baru
```

### Langkah 2: Hapus dari git tracking

```bash
# Hapus dari tracking (tapi file tetap ada di lokal)
git rm --cached wa-bot/.env

# Juga cek .env lain
git rm --cached api/.env 2>/dev/null
git rm --cached web-gen/.env 2>/dev/null

# Commit perubahan
git commit -m "fix: remove .env files from git tracking — rotate credentials"
```

### Langkah 3: Verifikasi .gitignore

```bash
# Pastikan .gitignore include:
echo ".env" >> .gitignore
echo "**/.env" >> .gitignore

# Verifikasi tidak ada .env yang di-tracking
git ls-files | grep '\.env$'
# Harusnya tidak ada output
```

### Langkah 4: Bersihkan git history (jika perlu)

```bash
# Jika repo public, pertimbangkan untuk membersihkan history:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch wa-bot/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Atau pakai BFG Repo-Cleaner:
bfg --delete-files .env

# Force push (HATI-HATI — ini rewrite history)
git push origin --force --all
```

### Langkah 5: Audit seluruh repo

```bash
# Cari potential secrets lain di git history
git grep -E '(API_TOKEN|DATABASE_PASSWORD|JWT_SECRET|OPENROUTER_API_KEY)' \
  $(git rev-list --all) || echo "No secrets found"

# Cek juga untuk pola credential umum
git log --all --full-history -- '**/.env'
```

## Catatan

Setelah rotate credentials, **SEMUA** service yang menggunakan credentials lama harus di-update:
- `docker-compose.yml`
- Environment di CI/CD
- `.env` lokal developer
