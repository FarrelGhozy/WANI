# AI Pipeline

Semua pemrosesan pesan berjalan lewat satu pipeline bertipe di `api/src/ai/pipeline/`, dibangun dari **16 step** dengan pola `PipelineBuilder` + `Either` (railway-oriented programming).

Entry point:

```ts
import { processMessage } from "@/ai/pipeline"
const result = await processMessage({ ownerId, phone, name, text, waMsgId })
// → { reply, intent, qrisImageUrl? }
```

File utama:

| File | Peran |
|------|-------|
| `ai/pipeline/index.ts` | Menyusun 16 step, mengekspor `processMessage()` |
| `ai/pipeline/builder.ts` | `PipelineBuilder<I,O>` — `.pipe(step)` bertipe, `.build()` mengembalikan runner |
| `ai/pipeline/either.ts` | `ok(value)` / `fail({ type, reply, intent })` |
| `ai/pipeline/types.ts` | Tipe I/O antar step (`NormalizedInput` → … → `GuardedInput`) + `STEP_REPLIES` |

---

## 1. 16 Step

| # | Step | File | Yang dilakukan | Gagal → |
|---|------|------|----------------|---------|
| 1 | `normalize` | `steps/normalize.ts` | Strip karakter kontrol/zero-width, NFKC normalisasi, trim, potong `MAX_INPUT_CHARS` | — |
| 2 | `ensure_customer` | `steps/ensureCustomer.ts` | Upsert `Customer` + `Conversation` (per `ownerId` + phone) | — |
| 3 | `dedup` | `steps/dedup.ts` | Bila `waMsgId` sudah pernah tersimpan → short-circuit dengan `reply: ""` (bot tidak mengirim apa pun, mencegah balasan ganda saat retry jaringan) | short-circuit `intent: "duplicate"` |
| 4 | `persist_inbound` | `steps/persistInbound.ts` | Simpan pesan masuk (`role: CUSTOMER`) | — |
| 5 | `rate_limit` | `steps/rateLimit.ts` | Sliding window per pelanggan (pendek + panjang) | `STEP_REPLIES.RATE_LIMIT` |
| 6 | `pii_scan` | `steps/piiScan.ts` | Deteksi & catat PII di pesan masuk (tidak memblokir) | — |
| 7 | `firewall` | `steps/firewall.ts` | 3-tier pertahanan prompt injection | `STEP_REPLIES.INJECTION` |
| 8 | `budget_check` | `steps/budget.ts` | Budget LLM harian (`UsageCounter`) | `STEP_REPLIES.BUDGET` |
| 9 | `load_context` | `steps/contextLoader.ts` | Ambil `Store`, produk tersedia, `AiConfig`, metode pembayaran aktif; batal bila `AiConfig.isActive = false` | "bot sedang tidak aktif" |
| 10 | `build_messages` | `steps/messageBuilder.ts` | Susun system prompt + 10 pesan riwayat + pesan saat ini | — |
| 11 | `llm_call` | `steps/llmCall.ts` | Panggil LLM (dibungkus circuit breaker) | `STEP_REPLIES.FALLBACK` |
| 12 | `parse_output` | `steps/outputParser.ts` | Ekstrak & validasi JSON keluaran LLM | fallback ke intent `unknown` |
| 13 | `intent_executor` | `steps/intentExecutor.ts` → `ai/actions.ts` | Jalankan aksi sesuai intent | balasan error ramah |
| 14 | `output_guardrails` | `steps/outputGuardrails.ts` | `sanitizeReply` → `scanOutput` → redaksi PII → grounding check | `STEP_REPLIES.LEAK` |
| 15 | `usage_recorder` | `steps/usageRecorder.ts` | Catat panggilan & token ke `UsageCounter` | — |
| 16 | `outbound_persister` | `steps/outboundPersister.ts` | Simpan pesan keluar (`role: BOT`), `touch` conversation | — |

Step gagal mengembalikan `fail(...)` yang membawa balasan siap kirim; step berikutnya dilewati (short-circuit). Semua balasan fallback terpusat di `STEP_REPLIES` agar mudah dites.

---

## 2. Perakitan Prompt

`buildSystemPrompt(store, products, knowledgeBase, customPrompt)` di `ai/prompts.ts` menyusun:

- info toko: nama, alamat, jam buka, pembayaran (termasuk metode pembayaran terstruktur), pengiriman, retur;
- katalog produk (nama, harga, stok);
- `knowledgeBase` dan `systemPrompt` kustom dari `AiConfig`;
- aturan keamanan + **wajib output JSON** sesuai schema intent;
- **canary token** `WANI-CANARY-7Q2F8X` (untuk mendeteksi kebocoran prompt);
- instruksi bahwa pesan pelanggan selalu dibungkus delimiter.

Pesan yang dikirim ke LLM:

```
[ system: <system prompt> ]
[ … 10 pesan terakhir (role assistant/user, pesan user dibungkus delimiter) ]
[ user: <customer_message> … </customer_message> ]
```

Riwayat diambil 20 pesan terakhir lalu di-`slice(-10)`; pesan masuk saat ini difilter dari riwayat agar tidak dobel. Pesan lampau pelanggan dibungkus `wrapCustomerMessage()` dengan delimiter `<customer_message>` / `</customer_message>`.

---

## 3. LLM Engine (`ai/engine.ts`)

```ts
complete(messages, { model, maxTokens, temperature, baseUrl, apiKey, fallbackModel, retries, timeout })
```

- Provider gaya OpenAI-compatible (`POST` ke `LLM_BASE_URL`, body `{ model, messages, max_tokens, temperature }`).
- **Retry 2×** dengan exponential backoff; pada percobaan ulang pertama model diganti ke `fallbackModel`.
- **Timeout 30 detik** via `AbortController` (default; pipeline memakai `30_000`).
- Status `429` dan `≥500` dianggap *retryable*; error lain (`4xx`) final.
- Tanpa `apiKey` → melempar `LLMError` non-retryable.
- Header `HTTP-Referer` + `X-Title` ditambahkan otomatis bila base URL mengandung `openrouter.ai`.
- Mengembalikan `{ content, model, finishReason, usage: { promptTokens, completionTokens } }`.

### Circuit breaker (`ai/circuit-breaker/index.ts`)

- Registry per-label (pipeline memakai label default).
- Ambang **3 kegagalan** → circuit terbuka **60 detik** → half-open (satu percobaan uji) → tertutup bila sukses.
- Eksekusi diserialisasi lewat antrean agar tidak ada race pada state breaker.
- Bila circuit terbuka, step LLM mengembalikan `STEP_REPLIES.FALLBACK` + mencatat `ActivityLog` tipe `llm_failed`.

---

## 4. Kontrak Keluaran LLM (`ai/schemas.ts`)

Model **wajib** membalas JSON valid; `LLMOutputSchema` adalah discriminated union 6 intent:

| Intent | Field wajib | Aksi (`ai/actions.ts`) |
|--------|-------------|------------------------|
| `order` | `items: [{ name, qty }]` (min 1), `notes?` | Buat `Order` + `OrderItem`, kirim instruksi pembayaran |
| `inquiry` | `query`, `reply?` | Balas hasil pencarian/penjelasan produk |
| `greeting` | `reply` | Balas sapaan |
| `complaint` | `reply`, `escalate: boolean` | Bila `escalate` → tandai conversation `ESCALATED` + catat log |
| `escalate` | `reason` | Eskalasi ke manusia (status percakapan + log) |
| `unknown` | `reply` | Balas apa adanya |

Parsing (`outputParser.ts`) bertingkat: `JSON.parse` → validasi Zod → bila gagal, cari blok `{...}` pertama dan validasi ulang → bila tetap gagal, intent `unknown` dengan balasan minta ulang.

### Detail aksi `order`

1. Nama produk dicocokkan **case-insensitive** terhadap katalog milik `ownerId` (`ProductModel.findByNames`).
2. Tolak bila: stok `0` ("sedang habis"), `qty > stok`, `qty > 100`, atau ada nama produk tak dikenal.
3. Buat order + item dalam satu transaksi (`OrderModel.createFromItems`), `totalAmount` dihitung server.
4. `Customer.totalOrders` di-increment, `ActivityLog` tipe `order_created` dicatat.
5. Balasan berisi rincian item, total Rupiah, dan instruksi pembayaran dari `StorePaymentMethod` aktif (QRIS/transfer/e-wallet/COD).
6. Bila ada metode QRIS dengan gambar → `qrisImageUrl` dikembalikan dan bot mengirim gambar + caption.

---

## 5. Guardrail di Dalam Pipeline

Step 6, 7, 14 memanggil modul `guardrails/`:

| Step | Modul | Ringkas |
|------|-------|---------|
| `pii_scan` | `guardrails/pii.ts` | Deteksi phone/email/NIK/API key/alamat pada input — hanya dicatat |
| `firewall` | `guardrails/firewall/*` | Tier 1 regex (`analyzeTurn` + `classifyVerdict`) → Tier 2 classifier → Tier 3 judge |
| `output_guardrails` | `guardrails/output.ts` + `firewall/output.ts` + `guardrails/classifier.ts` | Sanitasi, deteksi kebocoran/kebocoran PII/eksfiltrasi, redaksi PII, cek grounding untuk `inquiry` & `order` |

Rincian lengkap di [GUARDRAILS.md](GUARDRAILS.md).

---

## 6. Observability Pipeline

- `api/src/debug/tracer.ts` mencatat trace per request (`TraceContext`): verdict firewall, jumlah riwayat, model & token, intent, hasil scan, grounding.
- Endpoint dev-only: `GET /api/debug/traces`, `GET /api/debug/traces/:id`, `DELETE /api/debug/traces`, `GET /api/debug/status`, `POST /api/debug/circuit/reset`.
- Aktivitas penting masuk `ActivityLog` dengan tipe: `injection_blocked`, `budget_exceeded`, `llm_failed`, `output_blocked`, `pii_output`, `grounding_failed`, `order_created`, `action_failed`, dan lain-lain.

---

## 7. Invarian Penting

- Pipeline **selalu** mengembalikan `reply` berupa string siap kirim — tidak ada jalur yang menghasilkan `undefined` ke bot.
- Dedup (`waMsgId` unik) mencegah pesan WA yang sama diproses dua kali saat retry jaringan.
- Kegagalan guardrail LLM (classifier/judge/grounding) **fail-open**: pesan tetap diproses, tetapi dicatat di log.
- `AiConfig.isActive = false` mematikan balasan AI (short-circuit sebelum panggilan LLM).
- Hasil sukses menyimpan balasan BOT lewat step terakhir, lalu **langsung** menandainya terkirim (`waMsgId = "sent-<id>"`) dan `touch` conversation — jadi balasan AI tidak akan terkirim ulang oleh `/api/outgoing`.
- Short-circuit (`blocked: true`) **tidak** menjalankan step 15–16; hanya step `firewall` dan `rate_limit` yang secara eksplisit menyimpan pesan BOT penolakan. Balasan budget/LLM-fallback tidak tersimpan sebagai pesan BOT.
- Hasil pipeline selalu punya `reply: string` (bisa string kosong pada kasus duplikat), `intent`, `blocked`, dan `qrisImageUrl` sehingga bot dapat memutuskan apakah perlu mengirim pesan (`if (reply)`).
