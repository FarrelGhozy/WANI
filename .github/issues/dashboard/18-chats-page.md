# DSH-18 — Chats/Conversations Page

## Deskripsi
Halaman riwayat percakapan dengan pelanggan. Menampilkan daftar percakapan, chat window, dan kemampuan admin untuk reply sebagai human.

## Task Checklist

### 1. Layout Split Panel
```
┌──────────────────────────────────────────────────────┐
│  Chats                               [🔍 Search]    │
│                                                      │
│  ┌─── List ────┐  ┌─── Chat Window ───────────────┐ │
│  │ 👤 Budi     │  │  Budi Santoso                  │ │
│  │ "Kak, ini..│  │  +62 812-3456-7890           │ │
│  │ 🟢 10:23   │  │  [🤖 AI Active]               │ │
│  ├─────────────┤  ├────────────────────────────────┤ │
│  │ 👤 Sari     │  │  10:23                         │ │
│  │ "Kapan      │  │  👤 Budi: Kak, ini udah       │ │
│  │  dikirim?"  │  │        termasuk ongkir?        │ │
│  │ 💬 09:15   │  │                                │ │
│  ├─────────────┤  │  10:23                         │ │
│  │ 👤 Adi      │  │  🤖 AI: Untuk pengiriman       │ │
│  │ "Ready?"   │  │        dalam kota, ongkir Rp5rb │ │
│  │ 💬 08:00   │  │                                │ │
│  ├─────────────┤  │                                │ │
│  │ ...         │  │  ┌─ Reply ─────────────────┐  │ │
│  └─────────────┘  │  │ [Ketik pesan...] [Kirim]│  │ │
│                   │  └─────────────────────────┘  │ │
│  ← Prev Next →    │  [🤖 AI Mode] [👤 Human Mode]  │ │
└──────────────────────────────────────────────────────┘
```

### 2. Conversation List (Left Panel)
- [ ] Scrollable list percakapan
- [ ] Avatar lingkaran (2 huruf pertama nama)
- [ ] Nama customer, preview pesan terakhir (truncated)
- [ ] Timestamp relatif
- [ ] Status indicator: 🟢 Online, 💬 Offline, 🤖 AI handling
- [ ] Highlight: percakapan yang belum dibaca (bold)
- [ ] Search customer by name/nomor WA
- [ ] Filter: All | AI Active | Human Mode
- [ ] Pagination / infinite scroll

### 3. Chat Window (Right Panel)
- [ ] Header: nama customer, nomor WA, AI/Human status badge
- [ ] **Message bubbles**:
  - Customer: left-aligned, gray background
  - AI: right-aligned, blue background, robot icon
  - Human: right-aligned, green background, person icon
- [ ] Timestamp setiap pesan
- [ ] Auto-scroll ke pesan terbaru
- [ ] Typing indicator saat AI memproses
- [ ] Tanggal separator untuk hari berbeda

### 4. Reply Box
- [ ] Text area (auto-resize)
- [ ] Enter untuk kirim, Shift+Enter untuk newline
- [ ] Send button
- [ ] Karakter counter / limit
- [ ] Submit → `POST /api/conversations/:id/messages`
- [ ] Pesan langsung muncul di chat window (optimistic update)

### 5. AI/Human Mode Toggle
- [ ] Toggle switch: AI Active / Human Mode
- [ ] AI Active: AI handle incoming messages
- [ ] Human Mode: AI stop reply, semua reply dari admin
- [ ] Status indicator jelas

### 6. Customer Detail (Right-side Panel atau Modal)
- [ ] Customer info card: nama, WA, bergabung sejak
- [ ] Total orders dari customer ini
- [ ] Total spending
- [ ] Riwayat order (list)
- [ ] Escalate / Resolve buttons

### 7. Empty & Loading States
- [ ] No conversation selected: "Pilih percakapan untuk mulai"
- [ ] No conversations: "Belum ada percakapan. Bagikan nomor WA."
- [ ] Loading: skeleton untuk list + chat window

## Verification
- [ ] Conversation list muncul dengan preview
- [ ] Click percakapan → chat window muncul
- [ ] Message bubbles format benar (customer/AI/human)
- [ ] Reply terkirim dan muncul di chat
- [ ] AI/Human toggle berfungsi
- [ ] Search customer bekerja

## Labels
`frontend`, `dashboard`, 🟡 medium

## Dependencies
DSH-14

## Estimasi
2 hari
