# Guardrails

Pertahanan berlapis di `api/src/guardrails/` untuk bot WhatsApp: mencegah prompt injection, melindungi PII, membatasi laju pesan, membatasi biaya LLM, dan mencegah kebocoran prompt.

Filosofi: **fail-open untuk lapisan LLM, fail-closed untuk auth.** Bila classifier/judge/grounding error atau circuit terbuka, pesan dianggap aman dan dicatat di log — bot tetap melayani pelanggan.

---

## 1. Peta Lapisan

| # | Lapisan | File | Kapan |
|---|---------|------|-------|
| 1 | Normalisasi input | `guardrails/input.ts` | Setiap pesan |
| 2 | PII scan (input) | `guardrails/pii.ts` | Setiap pesan |
| 3 | Rate limit per pelanggan | `guardrails/ratelimit.ts` | Setiap pesan |
| 4 | Firewall Tier 1 (regex) | `guardrails/firewall/injection.ts` + `context.ts` | Setiap pesan |
| 5 | Firewall Tier 2 (classifier) | `guardrails/classifier.ts` | Hanya bila Tier 1 `UNCERTAIN` |
| 6 | Firewall Tier 3 (judge) | `guardrails/classifier.ts` | Hanya bila Tier 2 `SUSPICIOUS` |
| 7 | Budget harian LLM | `guardrails/budget.ts` | Sebelum panggilan LLM |
| 8 | Output sanitasi | `guardrails/output.ts` | Setiap balasan |
| 9 | Output scan (leak) | `guardrails/firewall/output.ts` | Setiap balasan |
| 10 | Redaksi PII (output) | `guardrails/pii.ts` | Setiap balasan |
| 11 | Grounding check | `guardrails/classifier.ts` | Intent `inquiry` & `order` |

Urutan pemanggilan di pipeline: [AI_PIPELINE.md](AI_PIPELINE.md).

---

## 2. Normalisasi & Anti-obfuscation

`guardrails/input.ts` — `normalizeInput()`:

- buang karakter kontrol dan zero-width (termasuk `\u200b`, `\ufeff`, dsb.);
- **NFKC normalization** → fullwidth (`ｉｇｎｏｒｅ`) dan Mathematical Alphanumerics (`𝐢𝐠𝐧𝐨𝐫𝐞`) menjadi ASCII;
- `trim` + potong ke `MAX_INPUT_CHARS` (default 4000).

`guardrails/firewall/encoding.ts`:

| Fungsi | Fungsi deteksi |
|--------|----------------|
| `detectObfuscation()` | base64 panjang (≥40 char), hex panjang (≥24 byte), dan **homoglyph** — 13 rentang Unicode yang lolos NFKC (Cyrillic, Greek, Letterlike Symbols, Enclosed Alphanumerics, Latin Extended A–E, IPA, Phonetic Extensions) dengan ambang >20% karakter non-Latin |
| `normalizeLeet()` | NFKC lalu peta leet: digit `0-9` → huruf **hanya pada token yang juga mengandung huruf** (agar harga/tahun tidak rusak), simbol `@ $ ! +` selalu dipetakan |

---

## 3. Firewall 3 Tingkat

### Tier 1 — regex (`scanInput` + `classifyVerdict`)

Sembilan kelompok aturan, semuanya dijalankan pada teks ter-NFKC dan (untuk deteksi leet) teks ter-normalisasi-leet:

| Reason | Kelompok | Keyakinan | Verdict |
|--------|----------|-----------|---------|
| `delimiter_escape` | Upaya menutup/membuka delimiter sistem | HIGH | BLOCK |
| `token_injection` | Token kontrol/canary palsu | HIGH | BLOCK |
| `leet_obfuscated` | Instruksi tersamar leet | HIGH | BLOCK |
| `instruction_override` | "abaikan instruksi sebelumnya" | MEDIUM | BLOCK |
| `prompt_extraction` | Minta system prompt / aturan | MEDIUM | BLOCK |
| `role_hijack` | "kamu sekarang adalah …" | MEDIUM | BLOCK |
| `authority_claim` | Mengaku admin/developer | MEDIUM | BLOCK |
| `crescendo_marker` | Pola eskalasi bertahap | LOW | UNCERTAIN |
| `context_overflow` | Pesan sangat panjang/berulang (many-shot) | LOW | UNCERTAIN |

`classifyVerdict()`: tanpa reason → `SAFE`; ada HIGH/MEDIUM → `BLOCK`; hanya LOW → `UNCERTAIN`.

Tracking per percakapan (`firewall/context.ts` — `analyzeTurn`): skor kecurigaan per giliran disimpan dalam sliding window; **cumulative drift** (≥3 giliran bernilai tinggi) menaikkan kecurigaan → mendeteksi *persona erosion* bertahap. State disimpan in-memory per nomor pelanggan; `resetConversationState()` untuk pembersihan.

Blocking Tier 1 dicatat sebagai `ActivityLog` tipe `injection_blocked` (dengan tier, alasan, dan potongan teks), dan bot membalas `STEP_REPLIES.INJECTION`.

### Tier 2 — classifier ML (`classifyInput`)

- Dipanggil **hanya** bila Tier 1 menghasilkan `UNCERTAIN` (<1% pesan).
- Model cepat via `CLASSIFIER_MODEL` (default `north-mini-code-free`), output JSON `{ verdict: SAFE|SUSPICIOUS|INJECTION, confidence, reasons }`.
- `INJECTION` → blokir. `SUSPICIOUS` → lanjut ke Tier 3.
- `CLASSIFIER_ENABLED=false` → selalu `SAFE` (`classifier_disabled`).
- Circuit breaker terpisah per label; circuit terbuka / parse error → `SAFE` + alasan `classifier_circuit_open` / `classifier_parse_error`.

### Tier 3 — deep judge (`judgeInput`)

- Dipanggil hanya untuk kasus `SUSPICIOUS` (<0.1% pesan).
- Model `JUDGE_MODEL`, diberikan maksimal **4 baris riwayat** percakapan sebagai konteks.
- Output `SAFE` / `BLOCK`; `BLOCK` → blokir + log.
- Error/disabled/circuit terbuka → `SAFE`.

### Latensi tipikal

| Tier | Frekuensi | Latensi |
|------|-----------|---------|
| T1 regex | 100% pesan | ~0 ms |
| T2 classifier | <1% | ~500–1000 ms |
| T3 judge | <0.1% | ~1000–2000 ms |
| Grounding | ~30–50% (intent `inquiry`/`order`) | ~500–1500 ms |

---

## 4. PII (`guardrails/pii.ts`)

Tipe yang dideteksi: `phone`, `email`, `nik`, `api_key`, `address` (pola Indonesia), plus pola kredensial generik.

| Fungsi | Perilaku |
|--------|----------|
| `scanPii(text)` | Mengembalikan daftar match `{ type, start, end, value }` terurut posisi |
| `hasPii(text)` | Boolean cepat (pola sama dengan `scanPii`) |
| `redactPii(text)` | Mengganti match dengan penanda `[PHONE]`, `[EMAIL]`, `[NIK]`, `[API_KEY]`, `[ADDRESS]` |

Catatan pola yang mudah menjebak:

- `PHONE_RE` = `(?:\+?62|0)8[1-9][0-9]{6,11}` → nomor rekening bank biasa **tidak** cocok, tetapi nomor bergaya HP (mis. `0812…`) cocok.
- `API_KEY_RE` memuat `[\w-]{20,}` → string alfanumerik ≥20 karakter (termasuk nomor rekening panjang tanpa spasi) akan terdeteksi sebagai `api_key`.

**Input**: PII hanya dicatat (`pii_scan` step) — tidak memblokir, karena pelanggan memang sering mengirim nomor HP/alamat untuk pengiriman.

**Output**: `scanOutput` memblokir balasan yang mengandung PII lebih dulu (§7), sehingga balasan ber-PII berakhir sebagai `STEP_REPLIES.LEAK` dan tercatat `output_blocked` — bukan di-redact. Blok redaksi PII di step `output_guardrails` tetap ada sebagai jaring pengaman bila urutan/aturan berubah; bila aktif, ia mencatat `ActivityLog` tipe `pii_output`.

---

## 5. Rate Limit per Pelanggan (`guardrails/ratelimit.ts`)

- Dua sliding window in-memory per `customerId`: **pendek** `RATE_LIMIT_SHORT_MAX`/`RATE_LIMIT_SHORT_WINDOW_MS` (default 8 / 30 detik) dan **panjang** `RATE_LIMIT_LONG_MAX`/`RATE_LIMIT_LONG_WINDOW_MS` (default 60 / 1 jam).
- Pesan yang diblokir **tidak** dihitung; notifikasi "mohon tunggu" dikirim **sekali** per jendela pendek (`notify` flag), agar pelanggan tidak dibanjiri balasan penolakan.
- Bucket lama dibersihkan tiap 5 menit (`unref()`, tidak menahan proses).
- Bersifat **single-process** dan **hilang saat restart** — cukup karena API berjalan satu instance; lihat [DEPLOYMENT.md](DEPLOYMENT.md) bila diskalakan.
- Berbeda dari rate limit HTTP global (120 req/menit/IP) di `server.ts`.

---

## 6. Budget LLM Harian (`guardrails/budget.ts`)

- `DAILY_LLM_BUDGET` (default 2000 panggilan per hari, `0` = tanpa batas) — **global**, bukan per toko.
- Counter disimpan di tabel `UsageCounter` dengan PK `YYYY-MM-DD` (`llmCalls`, `tokensIn`, `tokensOut`).
- Bila terlampaui: bot membalas `STEP_REPLIES.BUDGET` + `ActivityLog` tipe `budget_exceeded`; panggilan LLM tidak dilakukan.
- Error baca counter → **fail-open** (dianggap belum melewati budget) + log error.
- Endpoint `GET /api/usage` menampilkan counter hari ini.

---

## 7. Perlindungan Output

1. **`sanitizeReply()`** (`guardrails/output.ts`) — hapus penanda code fence (```` ``` ````), trim, potong ke `MAX_REPLY_CHARS` (default 1500) dengan elipsis.
2. **`scanOutput()`** (`guardrails/firewall/output.ts`) — blokir bila terdeteksi:

| Reason | Isi |
|--------|-----|
| `canary_leak` | Token canary `WANI-CANARY-7Q2F8X` muncul |
| `delimiter_leak` | Delimiter internal `<customer_message>` muncul |
| `system_prompt_reconstruction` | Header aturan sistem (mis. `## Aturan Keamanan`) muncul |
| `pii_leak` | PII terdeteksi pada balasan |
| `exfiltration` | URL gambar markdown / data ter-encode (kanal eksfiltrasi) |

Bila diblokir → balasan diganti `STEP_REPLIES.LEAK` dan dicatat `output_blocked`.
3. **Redaksi PII** — jaring pengaman: bila (karena perubahan urutan) balasan ber-PII tidak terblokir di langkah 2, bagian ini mengganti match dengan penanda tipe dan mencatat `pii_output`.
4. **`checkGrounding()`** (`guardrails/classifier.ts`) — untuk intent `inquiry` dan `order` saja: LLM-as-judge membandingkan balasan dengan fakta yang diberikan (profil toko + katalog produk). Bila tidak *grounded* → balasan diganti dengan permintaan maaf + arahan hubungi CS, dan dicatat `grounding_failed`. Error/disabled → dianggap grounded.

`hasLeak()` (versi lama, berbasis canary + kata kunci prompt) masih tersedia sebagai pemeriksa cepat.

---

## 8. Circuit Breaker

- `ai/circuit-breaker/index.ts` — registry per label, ambang 3 kegagalan, cooldown 60 detik, lalu half-open.
- Setiap pemanggilan LLM guardrail (classifier, judge, grounding) memakai circuit-nya sendiri, sehingga masalah pada satu lapisan tidak memblokir lapisan lain.
- Status & reset dapat dilihat di dev: `GET /api/debug/status`, `POST /api/debug/circuit/reset`.

---

## 9. Variabel Lingkungan Terkait

| Variabel | Default | Efek |
|----------|---------|------|
| `MAX_INPUT_CHARS` | 4000 | Batas panjang pesan masuk |
| `MAX_REPLY_CHARS` | 1500 | Batas panjang balasan |
| `RATE_LIMIT_SHORT_MAX` / `_WINDOW_MS` | 8 / 30000 | Jendela pendek |
| `RATE_LIMIT_LONG_MAX` / `_WINDOW_MS` | 60 / 3600000 | Jendela panjang |
| `DAILY_LLM_BUDGET` | 2000 | Budget panggilan LLM harian |
| `CLASSIFIER_ENABLED` / `CLASSIFIER_MODEL` | true / `north-mini-code-free` | Tier 2 |
| `JUDGE_ENABLED` / `JUDGE_MODEL` | true / `north-mini-code-free` | Tier 3 |
| `GROUNDING_CHECK_ENABLED` / `GROUNDING_MODEL` | true / `north-mini-code-free` | Grounding |

---

## 10. Batasan yang Perlu Diketahui

- Rate limit dan state drift percakapan bersifat **in-memory** → tidak bertahan lintas restart dan tidak terbagi antar instance.
- `knowledgeBase` adalah teks biasa (tanpa embedding/RAG), sehingga grounding hanya memverifikasi terhadap data toko/katalog — bukan terhadap dokumen eksternal.
- Grounding **tidak** dijalankan untuk intent `greeting`, `complaint`, `escalate`, `unknown`.
- Canary bersifat statis di kode — jangan diubah tanpa memperbarui `ai/prompts.ts` dan `guardrails/output.ts` bersamaan (keduanya membaca konstanta yang sama).
