export interface StoreData {
  businessName: string
  phone: string
  address: string | null
  businessHours: string | null
  paymentMethods: string | null
  shippingInfo: string | null
  returnPolicy: string | null
}

export interface ProductData {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  isAvailable: boolean
  imageUrl: string | null
}

export interface OrdersStats {
  totalOrders: number
  completed: number
  pending: number
}

export interface SiteConfig {
  hero: {
    headline: string
    subheadline: string | null
    ctaText: string | null
  }
  about: {
    description: string
    mission: string | null
  }
  contact: {
    email: string | null
    mapsUrl: string | null
  }
  selectedProductIds: string[]
  colors: {
    primary: string
    secondary: string
  }
  waOrderTemplate: string | null
}

export interface GenerateParams {
  slug: string
  template: string
  store: StoreData
  products: ProductData[]
  config: SiteConfig
  stats: OrdersStats
  outputDir: string
}

export interface GenerateResult {
  success: boolean
  outputPath: string | null
  error?: string
}

export interface ZipParams {
  sourceDir: string
  slug: string
}
