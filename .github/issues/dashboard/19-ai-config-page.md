# DSH-19 — AI Configuration Page

## Deskripsi
Halaman untuk mengatur AI Customer Service: system prompt, knowledge base, model settings, dan auto-reply rules.

## Task Checklist

### 1. AI Status Card
```
┌─ AI Status ────────────────────────────────────────┐
│  🤖 AI Customer Service: [● ON / ○ OFF]             │
│  Model: [opencode/deepseek-v4-flash-free        ▼]  │
│  Status: Active — 1,234 messages handled hari ini   │
└─────────────────────────────────────────────────────┘
```

- [ ] Toggle ON/OFF dengan konfirmasi
- [ ] Model dropdown dengan opsi: deepseek, gemini, gpt (dari config)
- [ ] Stats: total messages handled hari ini

### 2. System Prompt Editor
```
┌─ System Prompt ─────────────────────────────────────┐
│  Kamu adalah AI Customer Service untuk              │
│  Warung Berkah. Gunakan bahasa Indonesia            │
│  yang sopan dan ramah.                              │
│                                                     │
│  === INFO TOKO ===                                  │
│  Jam operasional: 08:00 - 21:00 WIB                 │
│  ...                                                │
│                                                     │
│  [Edit Prompt]  [Preview]  [Reset ke Default]       │
│  📝 1,234 / 4,096 characters                        │
└─────────────────────────────────────────────────────┘
```

- [ ] Textarea dengan monospace font
- [ ] Character counter
- [ ] "Reset to Default" button (confirm dialog)
- [ ] "Preview" button → modal simulasi chat AI

### 3. Knowledge Base
```
┌─ Knowledge Base ────────────────────────────────────┐
│  Info toko yang AI harus tahu:                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Jam operasional: 08:00 - 21:00 WIB           │   │
│  │ Hari libur: Minggu                            │   │
│  │ Area pengiriman: Dalam kota Rp5rb ongkir     │   │
│  │ Pembayaran: QRIS, Transfer BCA, Cash          │   │
│  │ Minimal order: Rp0                            │   │
│  │ FAQ:                                          │   │
│  │ - Berapa lama pengiriman? 30-60 menit         │   │
│  │ - Bisa pesan antar? Bisa, via Gojek           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Edit]                                              │
└─────────────────────────────────────────────────────┘
```

- [ ] Textarea untuk knowledge base
- [ ] Pre-filled template: jam operasional, ongkir, FAQ, dll
- [ ] Save button

### 4. Greeting Message
- [ ] Input text: "Halo! 👋 Selamat datang di [nama toko]. Ada yang bisa saya bantu?"
- [ ] Preview bubble chat

### 5. Advanced Settings
```
┌─ Advanced Settings ─────────────────────────────────┐
│  Max Tokens:  [2048    ]  (biaya per token)         │
│  Temperature: [0.7     ]  [────●────────] 0-2       │
│  Auto-Confirm Orders: [ON / OFF]                    │
│  Auto-Reply Interval: [2 seconds ▼]                 │
│  Human Escalation Threshold: [70% ▼] confidence     │
└─────────────────────────────────────────────────────┘
```

- [ ] Max tokens: number input
- [ ] Temperature: slider 0-2
- [ ] Auto-confirm toggle (trusted customer → auto confirm)
- [ ] Auto-reply interval dropdown
- [ ] Escalation threshold: slider 0-100%

### 6. Save
- [ ] Single save button (bisa batch update semua settings)
- [ ] `PUT /api/ai-agent/:merchantId`
- [ ] Success toast: "Pengaturan AI berhasil disimpan"

### 7. Preview Modal
- [ ] Simulasi chat: input → LLM response (beneran panggil AI atau mock)
- [ ] Atau minimal tampilkan contoh format reply yang akan dihasilkan

## Verification
- [ ] ON/OFF toggle → status berubah
- [ ] Edit system prompt → tersimpan
- [ ] Edit knowledge base → tersimpan
- [ ] Temperature slider works
- [ ] Save → toast konfirmasi

## Labels
`frontend`, `dashboard`, `ai`, 🟡 medium

## Dependencies
DSH-14

## Estimasi
1 hari
