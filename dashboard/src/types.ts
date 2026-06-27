export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface Category {
  id: string
  name: string
  description: string | null
}

export interface Product {
  id: string
  categoryId: string | null
  category: Category | null
  name: string
  description: string | null
  price: number
  stock: number
  isAvailable: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductFormData {
  name: string
  price: number
  stock: number
  categoryId: string | null
  description: string | null
  isAvailable: boolean
  imageUrl: string | null
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
export type OrderSortField = 'id' | 'customerName' | 'items' | 'totalAmount' | 'status' | 'createdAt'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  qty: number
  unitPrice: number
  subtotal: number
}

export interface Payment {
  method: string | null
  amount: number
  status: string
  paidAt: string | null
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  status: OrderStatus
  totalAmount: number
  source: string
  notes: string | null
  items: OrderItem[]
  payment: Payment | null
  createdAt: string
  updatedAt: string
}

export type MessageRole = 'CUSTOMER' | 'BOT' | 'HUMAN'
export type ConversationStatus = 'ACTIVE' | 'RESOLVED' | 'ARCHIVED' | 'ESCALATED'

export interface Message {
  id: string
  role: MessageRole
  content: string
  msgType: string
  waMsgId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface Conversation {
  id: string
  customerId: string
  status: ConversationStatus
  messages: Message[]
}

export interface Customer {
  id: string
  phone: string
  name: string
  notes: string | null
  totalOrders: number
  unreadCount: number
  lastMessage: Pick<Message, 'content' | 'role' | 'createdAt'> | null
  recentOrder: { id: string; status: string; totalAmount: number; createdAt: string } | null
  createdAt: string
  updatedAt: string
}

export interface StoreProfile {
  id: string
  businessName: string
  phone: string
  logoUrl: string | null
  address: string | null
  businessHours: string | null
  paymentMethods: string | null
  shippingInfo: string | null
  returnPolicy: string | null
  isActive: boolean
  hasPaymentMethods?: boolean
}

export type PaymentMethodType = 'QRIS' | 'BANK_TRANSFER' | 'E_WALLET' | 'COD'

export interface StorePaymentMethod {
  id: string
  storeId: string
  type: PaymentMethodType
  label: string
  accountName: string | null
  accountNumber: string | null
  bankName: string | null
  providerName: string | null
  phoneNumber: string | null
  qrImageUrl: string | null
  instructions: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
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

export interface WaStatus {
  qr: string
  connection: string
  phone: string
  connectedAt: string | null
  loading: boolean
  error: string | null
}

export interface WebsiteConfig {
  heroHeadline: string
  heroSubheadline: string
  aboutText: string
  primaryColor: string
  secondaryColor: string
  phone: string
  selectedProductIds: string[]
  template: string
  theme: string
}

export interface GenerateLog {
  id: string
  timestamp: string
  status: 'success' | 'failed'
  productCount: number
  message: string
}
