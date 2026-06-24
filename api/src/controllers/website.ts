import type { Request, Response } from "express"
import type { z } from "zod"
import path from "node:path"
import { existsSync } from "node:fs"
import jwt from "jsonwebtoken"
import { WebSiteModel } from "@/src/models/website"
import { StoreModel } from "@/src/models/store"
import { ProductModel } from "@/src/models/catalog"
import { OrderModel } from "@/src/models/order"
import { sendResponse } from "@/src/utils/response"
import { BadRequestError, InternalServerError, NotFoundError, UnauthorizedError } from "@/src/utils/errors"
import { updateWebsiteSchema, generateWebsiteSchema } from "@/src/schemas/website"
import { generate } from "../../../web-gen/src/index.ts"
import { createZipStream } from "../../../web-gen/src/index.ts"

type UpdateWebsiteBody = z.infer<typeof updateWebsiteSchema>
type GenerateWebsiteBody = z.infer<typeof generateWebsiteSchema>

const JWT_SECRET = process.env.JWT_SECRET ?? "wani-dev-secret-change-in-production"

const GENERATED_DIR = path.resolve(import.meta.dir, "..", "..", "generated-sites")

function getConfigValue<T>(config: any, key: string, fallback: T): T {
  return config?.[key] ?? fallback
}

export async function getWebsiteConfig(_req: Request, res: Response): Promise<void> {
  const row = await WebSiteModel.getConfig()
  const config = (row?.config as Record<string, unknown>) ?? {}
  sendResponse(res, 200, "website config retrieved", config)
}

export async function updateWebsiteConfig(
  req: Request<Record<string, string>, any, UpdateWebsiteBody>,
  res: Response,
): Promise<void> {
  const row = await WebSiteModel.upsertConfig(req.body as Record<string, unknown>)
  sendResponse(res, 200, "website config updated", row.config)
}

export async function generateWebsite(
  req: Request<Record<string, string>, any, GenerateWebsiteBody>,
  res: Response,
): Promise<void> {
  const slug = "default"

  const store = await StoreModel.find()
  if (!store) {
    throw new BadRequestError("store not configured — set store info first")
  }

  const products = await ProductModel.getAll()
  const availableProducts = products.filter((p: any) => p.isAvailable)

  const webRow = await WebSiteModel.getConfig()
  const config = (webRow?.config as Record<string, unknown>) ?? {}
  const selectedIds: string[] = getConfigValue(config, "selectedProductIds", [])
  const selectedProducts = selectedIds.length > 0
    ? availableProducts.filter((p: any) => selectedIds.includes(p.id))
    : availableProducts

  const { totalOrders } = await OrderModel.getStats()
  const stats = await OrderModel.getStatusCounts()

  const result = await generate({
    slug,
    template: req.body.template,
    store: {
      businessName: store.businessName,
      phone: store.phone,
      address: store.address,
      businessHours: store.businessHours,
      paymentMethods: store.paymentMethods,
      shippingInfo: store.shippingInfo,
      returnPolicy: store.returnPolicy,
    },
    products: selectedProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      stock: p.stock,
      isAvailable: p.isAvailable,
      imageUrl: p.imageUrl,
    })),
    config: {
      hero: {
        headline: getConfigValue(config, "heroHeadline", store.businessName),
        subheadline: getConfigValue(config, "heroSubheadline", null),
        ctaText: null,
      },
      about: {
        description: getConfigValue(config, "aboutText", ""),
        mission: null,
      },
      contact: {
        email: null,
        mapsUrl: null,
      },
      selectedProductIds: selectedProducts.map((p: any) => p.id),
      colors: {
        primary: getConfigValue(config, "primaryColor", "#059669"),
        secondary: getConfigValue(config, "secondaryColor", "#f59e0b"),
      },
      waOrderTemplate: null,
    },
    stats: {
      totalOrders,
      completed: stats.completed,
      pending: stats.pending,
    },
    outputDir: path.join(GENERATED_DIR, slug),
  })

  if (!result.success) {
    throw new InternalServerError(result.error ?? "generate failed")
  }

  sendResponse(res, 200, "website generated", { outputPath: result.outputPath })
}

export async function downloadWebsite(req: Request, res: Response): Promise<void> {
  const slug = "default"

  const token = (req.query.token as string) ?? req.headers.authorization?.slice(7)
  if (!token) {
    throw new UnauthorizedError()
  }
  try {
    jwt.verify(token, JWT_SECRET)
  } catch {
    throw new UnauthorizedError("invalid or expired token")
  }

  const sourceDir = path.join(GENERATED_DIR, slug)
  if (!existsSync(sourceDir)) {
    throw new NotFoundError("no generated website found — generate first")
  }

  res.setHeader("Content-Type", "application/zip")
  res.setHeader("Content-Disposition", `attachment; filename="website-${slug}.zip"`)

  const stream = createZipStream({ sourceDir, slug })
  stream.pipe(res)
}

export async function publishWebsite(_req: Request, res: Response): Promise<void> {
  const slug = "default"
  const sourceDir = path.join(GENERATED_DIR, slug)
  if (!existsSync(sourceDir)) {
    throw new NotFoundError("no generated website found — generate first")
  }

  await WebSiteModel.markPublished()
  sendResponse(res, 200, "website published")
}
