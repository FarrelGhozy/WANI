import { useState, useCallback } from 'react'

export interface StoreProfile {
  id: string
  businessName: string
  phone: string
  address: string | null
  businessHours: string | null
  paymentMethods: string | null
  shippingInfo: string | null
  returnPolicy: string | null
  isActive: boolean
}

export interface AiConfig {
  id: string
  isActive: boolean
  systemPrompt: string
  model: string
  greetingMessage: string | null
  knowledgeBase: string | null
  maxTokens: number
  temperature: number
}

export interface WaSession {
  status: 'connected' | 'disconnected' | 'connecting'
  phone: string | null
  qr: string | null
}

const MOCK = true

const mockStore: StoreProfile = {
  id: 'default',
  businessName: 'WANI Kitchen',
  phone: '+6281234567890',
  address: 'Jl. Merdeka No. 123, Jakarta Pusat',
  businessHours: 'Sen-Sab 08:00-20:00, Min 10:00-18:00',
  paymentMethods: 'QRIS, Transfer Bank, Cash',
  shippingInfo: 'Gojek, Grab, Shopee Express',
  returnPolicy: 'Komplain maksimal 1x24 jam setelah pesanan diterima',
  isActive: true,
}

const mockAiConfig: AiConfig = {
  id: 'default',
  isActive: true,
  systemPrompt: 'Kamu adalah asisten penjualan untuk WANI Kitchen, sebuah UMKM makanan Indonesia. Balas dengan ramah, singkat, dan informatif. Gunakan bahasa Indonesia sehari-hari.',
  model: 'gpt-4o-mini',
  greetingMessage: 'Halo! Selamat datang di WANI Kitchen 😊 Ada yang bisa kami bantu?',
  knowledgeBase: 'Menu: Nasi Goreng Spesial Rp25.000, Mie Ayam Bakso Rp20.000, Ayam Geprek Rp22.000, Kopi Susu Gula Aren Rp18.000, dll.',
  maxTokens: 256,
  temperature: 0.7,
}

const mockWaSession: WaSession = {
  status: 'disconnected',
  phone: null,
  qr: null,
}

export function useSettings() {
  const [store, setStore] = useState(MOCK ? { ...mockStore } : mockStore)
  const [aiConfig, setAiConfig] = useState(MOCK ? { ...mockAiConfig } : mockAiConfig)
  const [waSession, setWaSession] = useState(MOCK ? { ...mockWaSession } : mockWaSession)
  const updateStore = useCallback((patch: Partial<StoreProfile>) => {
    setStore((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateAiConfig = useCallback((patch: Partial<AiConfig>) => {
    setAiConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const disconnectWa = useCallback(() => {
    setWaSession({ status: 'disconnected', phone: null, qr: null })
  }, [])

  return {
    store,
    aiConfig,
    waSession,
    updateStore,
    updateAiConfig,
    disconnectWa,
    loading: false,
  }
}
