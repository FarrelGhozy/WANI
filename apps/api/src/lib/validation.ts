import { z } from 'zod';

// ═════════════════════════════════════════════════════════
// Auth
// ═════════════════════════════════════════════════════════

export const registerSchema = z.object({
  businessName: z.string().min(1, 'Nama usaha wajib diisi').max(100),
  phone: z.string().min(10, 'Nomor WA minimal 10 digit').max(20),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

export const loginSchema = z.object({
  phone: z.string().min(1, 'Nomor WA wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ═════════════════════════════════════════════════════════
// Merchant
// ═════════════════════════════════════════════════════════

export const createMerchantSchema = z.object({
  businessName: z.string().min(1).max(200),
  phone: z.string().min(8).max(20),
  address: z.string().optional(),
  passwordHash: z.string().optional(),
});

export const updateMerchantSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type UpdateMerchantInput = z.infer<typeof updateMerchantSchema>;

// ═════════════════════════════════════════════════════════
// Category
// ═════════════════════════════════════════════════════════

export const createCategorySchema = z.object({
  merchantId: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ═════════════════════════════════════════════════════════
// Product
// ═════════════════════════════════════════════════════════

export const createProductSchema = z.object({
  merchantId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ═════════════════════════════════════════════════════════
// Customer
// ═════════════════════════════════════════════════════════

export const createCustomerSchema = z.object({
  merchantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  phone: z.string().min(8).max(20),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
  notes: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// ═════════════════════════════════════════════════════════
// Order
// ═════════════════════════════════════════════════════════

export const createOrderSchema = z.object({
  merchantId: z.string().uuid(),
  customerId: z.string().uuid(),
  source: z.string().default('wa_chat'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      qty: z.number().int().positive(),
    }),
  ).min(1),
});

export const updateOrderSchema = z.object({
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const transitionOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type TransitionOrderInput = z.infer<typeof transitionOrderSchema>;

// ═════════════════════════════════════════════════════════
// Payment
// ═════════════════════════════════════════════════════════

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(['CASH', 'TRANSFER', 'QRIS']).optional(),
  amount: z.number().positive(),
});

export const updatePaymentSchema = z.object({
  method: z.enum(['CASH', 'TRANSFER', 'QRIS']).optional(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  paidAt: z.string().datetime().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// ═════════════════════════════════════════════════════════
// Conversation
// ═════════════════════════════════════════════════════════

export const createConversationSchema = z.object({
  merchantId: z.string().uuid(),
  customerId: z.string().uuid(),
});

export const updateConversationSchema = z.object({
  status: z.enum(['ACTIVE', 'RESOLVED', 'ARCHIVED', 'ESCALATED']).optional(),
});

export const sendMessageSchema = z.object({
  role: z.enum(['CUSTOMER', 'BOT', 'HUMAN']),
  content: z.string().min(1),
  msgType: z.string().default('text'),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ═════════════════════════════════════════════════════════
// AI Agent
// ═════════════════════════════════════════════════════════

export const createAIAgentSchema = z.object({
  merchantId: z.string().uuid(),
  systemPrompt: z.string().min(1),
  model: z.string().default('google/gemma-4-26b-a4b-it:free'),
  greetingMessage: z.string().optional(),
  knowledgeBase: z.string().optional(),
  maxTokens: z.number().int().positive().default(2048),
  temperature: z.number().min(0).max(2).default(0.7),
});

export const updateAIAgentSchema = z.object({
  isActive: z.boolean().optional(),
  systemPrompt: z.string().min(1).optional(),
  model: z.string().optional(),
  greetingMessage: z.string().optional(),
  knowledgeBase: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type CreateAIAgentInput = z.infer<typeof createAIAgentSchema>;
export type UpdateAIAgentInput = z.infer<typeof updateAIAgentSchema>;

// ═════════════════════════════════════════════════════════
// Web Store
// ═════════════════════════════════════════════════════════

export const themeSchema = z.object({
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
  fonts: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
  }).optional(),
  layout: z.object({
    style: z.enum(['modern', 'minimal', 'classic']).optional(),
    rounded: z.boolean().optional(),
    shadows: z.boolean().optional(),
  }).optional(),
}).optional();

export const updateWebStoreSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  template: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
  heroImage: z.string().url().optional(),
  heroText: z.string().max(200).optional(),
  customDomain: z.string().optional(),
  theme: themeSchema,
});

export type UpdateWebStoreInput = z.infer<typeof updateWebStoreSchema>;

// ═════════════════════════════════════════════════════════
// Settings
// ═════════════════════════════════════════════════════════

export const updateSettingsSchema = z.object({
  currency: z.string().optional(),
  timezone: z.string().optional(),
  min_order: z.number().optional(),
  free_delivery_km: z.number().optional(),
  delivery_fee_city: z.number().optional(),
  delivery_fee_outside: z.number().optional(),
  estimated_delivery: z.string().optional(),
  delivery_area: z.string().optional(),
  business_hours: z.any().optional(),
  payment_methods: z.any().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_holder: z.string().optional(),
  qris_image: z.string().optional(),
  qris_holder: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
