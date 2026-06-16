# TST-11 — Unit Tests: AI Pipeline & Validator

## Deskripsi
Buat unit test untuk semua komponen AI pipeline: engine, validator, prompts, intent-classifier, order-parser, inquiry-handler, router, dan escalation.

## Setup
- Mock semua HTTP calls ke OpenRouter (MSW atau nock)
- Mock Prisma calls untuk database queries
- Buat sample LLM responses (valid JSON, invalid JSON, dll)

## Task Checklist

### 1. `ai/engine.ts` — 6-8 test cases
- [ ] `complete(messages)` → return LLM response
- [ ] `complete(API down)` → fallback ke secondary model
- [ ] `complete(all models down)` → return offline fallback message
- [ ] `complete(timeout > 15s)` → return offline fallback
- [ ] `complete(rate limited)` → retry with backoff
- [ ] Mock OpenRouter response dengan MSW

### 2. `ai/validator.ts` — 8-10 test cases
- [ ] `validateLLMOutput(valid JSON order)` → sukses, return parsed
- [ ] `validateLLMOutput(invalid JSON)` → error dengan pesan jelas
- [ ] `validateLLMOutput(order, valid product)` → sukses
- [ ] `validateLLMOutput(order, product not found)` → error
- [ ] `validateLLMOutput(order, insufficient stock)` → error
- [ ] `validateWithRetry(1st fail, 2nd success)` → sukses setelah retry
- [ ] `validateWithRetry(2x fail)` → return fallback
- [ ] `validateLLMOutput(inquiry intent)` → pass through

### 3. `ai/prompts.ts` — 3 test cases
- [ ] `buildSystemPrompt(merchant)` → contains business name
- [ ] `buildSystemPrompt(merchant with products)` → contains product list
- [ ] `buildSystemPrompt(empty product list)` → graceful handling

### 4. `pipeline/intent-classifier.ts` — 4-5 test cases
- [ ] `classifyIntent(message, merchantId)` → return LLMOutput
- [ ] Error: AI agent not found → return fallback
- [ ] Error: LLM timeout → return fallback
- [ ] System prompt includes knowledge base

### 5. `pipeline/order-parser.ts` — 5 test cases
- [ ] `processOrder(merchantId, customerId, items)` → order + items + payment created
- [ ] `processOrder(invalid product)` → error, no transaction created
- [ ] `processOrder(insufficient stock)` → error, stock unchanged
- [ ] Transaction rollback verification

### 6. `pipeline/inquiry-handler.ts` — 4 test cases
- [ ] `handleInquiry(merchantId, "nasi")` → matching products found
- [ ] `handleInquiry(merchantId, "menu")` → list all products
- [ ] `handleInquiry(merchantId, "xyz123")` → empty result, proper message
- [ ] Search by description (bukan cuma nama)

### 7. `pipeline/router.ts` — 6-8 test cases
- [ ] `handleIncomingMessage(message)` → complete flow: save → classify → reply
- [ ] Dedup: message ID already exists → skip
- [ ] New customer → customer upsert + conversation created
- [ ] Existing customer → conversation found, message appended
- [ ] Order intent → order-parser called
- [ ] Inquiry intent → inquiry-handler called
- [ ] Escalate intent → escalation called
- [ ] Error in pipeline → logged, not crashed

### 8. `pipeline/escalation.ts` — 2 test cases
- [ ] `escalateConversation(conversationId)` → status = ESCALATED
- [ ] ActivityLog created with type = 'escalation'

## Target
- Minimal 40 test cases untuk AI pipeline
- Coverage >80%
- Mock semua external calls (no real API calls)

## Labels
`testing`, `unit-test`, `ai`, 🟡 medium

## Dependencies
API-09

## Estimasi
2 hari
