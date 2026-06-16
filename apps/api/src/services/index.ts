export {
  // Merchant
  listMerchants,
  getMerchantById,
  getMerchantByPhone,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  toggleMerchantActive,
  getMerchantStats,
} from './merchant.service.js';

export {
  // Customer
  listCustomers,
  getCustomerById,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  incrementOrderCount,
  getCustomerOrders,
  searchCustomers,
} from './customer.service.js';

export {
  // Product
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  toggleProductAvailability,
  searchProducts,
  getProductsByCategory,
  getAvailableProducts,
} from './product.service.js';

export {
  // Order
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  transitionOrderStatus,
  getPendingOrders,
  getTodayOrders,
  getOrderStats,
} from './order.service.js';

export {
  // Payment
  listPayments,
  getPaymentById,
  getPaymentByOrder,
  createPayment,
  updatePayment,
  deletePayment,
  payOrder,
  refundPayment,
  getPaymentStats,
} from './payment.service.js';

export {
  // Conversation
  listConversations,
  getConversationById,
  getConversationByParticipants,
  createConversation,
  updateConversation,
  deleteConversation,
  sendMessage,
  getMessages,
  resolveConversation,
  escalateConversation,
  getActiveConversations,
  getConversationStats,
} from './conversation.service.js';

export {
  // Category
  listCategories,
} from './category.service.js';

export {
  // AI Agent
  getAIAgent,
  getAIAgentByMerchant,
  createAIAgent,
  updateAIAgent,
  deleteAIAgent,
  toggleAIAgent,
  updateAIAgentPrompt,
  updateAIAgentModel,
  updateKnowledgeBase,
  getActiveAIAgentByMerchant,
} from './ai-agent.service.js';

// ─── Re-export Zod schemas & types from shared validation ─

export {
  registerSchema,
  loginSchema,
  createMerchantSchema,
  updateMerchantSchema,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createOrderSchema,
  updateOrderSchema,
  transitionOrderSchema,
  createPaymentSchema,
  updatePaymentSchema,
  createConversationSchema,
  updateConversationSchema,
  sendMessageSchema,
  createAIAgentSchema,
  updateAIAgentSchema,
  updateWebStoreSchema,
  updateSettingsSchema,
} from '../lib/validation.js';

export type {
  RegisterInput,
  LoginInput,
  CreateMerchantInput,
  UpdateMerchantInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateOrderInput,
  UpdateOrderInput,
  TransitionOrderInput,
  CreatePaymentInput,
  UpdatePaymentInput,
  CreateConversationInput,
  UpdateConversationInput,
  SendMessageInput,
  CreateAIAgentInput,
  UpdateAIAgentInput,
  UpdateWebStoreInput,
  UpdateSettingsInput,
} from '../lib/validation.js';
