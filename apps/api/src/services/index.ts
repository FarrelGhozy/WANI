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
  createMerchantSchema,
  updateMerchantSchema,
} from './merchant.service.js';

export type {
  CreateMerchantInput,
  UpdateMerchantInput,
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
  createCustomerSchema,
  updateCustomerSchema,
} from './customer.service.js';

export type {
  CreateCustomerInput,
  UpdateCustomerInput,
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
  createProductSchema,
  updateProductSchema,
} from './product.service.js';

export type {
  CreateProductInput,
  UpdateProductInput,
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
  createOrderSchema,
  updateOrderSchema,
  transitionOrderSchema,
} from './order.service.js';

export type {
  CreateOrderInput,
  UpdateOrderInput,
  TransitionOrderInput,
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
  createPaymentSchema,
  updatePaymentSchema,
} from './payment.service.js';

export type {
  CreatePaymentInput,
  UpdatePaymentInput,
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
  createConversationSchema,
  updateConversationSchema,
  sendMessageSchema,
} from './conversation.service.js';

export type {
  CreateConversationInput,
  UpdateConversationInput,
  SendMessageInput,
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
  createAIAgentSchema,
  updateAIAgentSchema,
} from './ai-agent.service.js';

export type {
  CreateAIAgentInput,
  UpdateAIAgentInput,
} from './ai-agent.service.js';
