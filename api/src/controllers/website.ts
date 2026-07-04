import type { Request, Response } from "express"
import type { z } from "zod"
import path from "node:path"
import { existsSync, rmSync, symlinkSync, unlinkSync, readlinkSync } from "node:fs"
import { WebSiteModel } from "@/src/models/website"
import { StoreModel } from "@/src/models/store"
import { ProductModel } from "@/src/models/catalog"
import type { Product } from "@db/client"
import { OrderModel } from "@/src/models/order"
import { sendResponse } from "@/src/utils/response"
import { BadRequestError, InternalServerError, NotFoundError } from "@/src/utils/errors"
import { getOwnerId, getOwnerIdOrFirst } from "@/src/middleware/owner"
import { updateWebsiteSchema, generateWebsiteSchema } from "@/src/schemas/website"
import { generate, createZipStream } from "@web-gen/index.ts"

type UpdateWebsiteBody = z.infer<typeof updateWebsiteSchema>
type GenerateWebsiteBody = z.infer<typeof generateWebsiteSchema>

const GENERATED_DIR = path.resolve(import.meta.dir, "..", "generated-sites")
const UPLOADS_DIR = path.resolve(import.meta.dir, "..", "..", "uploads")

function getConfigValue<T>(config: Record<string, unknown>, key: string, fallback: T): T {
  return (config[key] as T) ?? fallback
}

export async function getWebsiteConfig(req: Request, res: Response): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const row = await WebSiteModel.getByOwner(ownerId)
  const config = (row?.config as Record<string, unknown>) ?? {}
  sendResponse(res, 200, "website config retrieved", config)
}

export async function updateWebsiteConfig(
  req: Request<Record<string, string>, any, UpdateWebsiteBody>,
  res: Response,
): Promise<void> {
  const ownerId = getOwnerId(req)
  const row = await WebSiteModel.upsertByOwner(ownerId, req.body as Record<string, unknown>)
  sendResponse(res, 200, "website config updated", row.config)
}

function makeSlug(): string {
  const now = new Date()
  const y = now.getFullYear()
  const M = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const h = String(now.getHours()).padStart(2, "0")
  const m = String(now.getMinutes()).padStart(2, "0")
  const s = String(now.getSeconds()).padStart(2, "0")
  return `gen-${y}${M}${d}-${h}${m}${s}`
}

export async function generateWebsite(
  req: Request<Record<string, string>, any, GenerateWebsiteBody>,
  res: Response,
): Promise<void> {
  const ownerId = getOwnerId(req)
  const store = await StoreModel.findByOwner(ownerId)
  if (!store) {
    throw new BadRequestError("store not configured — set store info first")
  }

  const products = await ProductModel.listAll(ownerId)
  const availableProducts = products.filter((p) => p.isAvailable)

  const webRow = await WebSiteModel.getByOwner(ownerId)
  const config = (webRow?.config as Record<string, unknown>) ?? {}
  const selectedIds: string[] = getConfigValue(config, "selectedProductIds", [])
  const selectedProducts = selectedIds.length > 0
    ? availableProducts.filter((p) => selectedIds.includes(p.id))
    : availableProducts

  const { totalOrders } = await OrderModel.getStats(ownerId)
  const stats = await OrderModel.getStatusCounts(ownerId)

  const theme = getConfigValue(config, "theme", "classic")
  const slug = makeSlug()
  const outputDir = path.join(GENERATED_DIR, slug)

  const result = await generate({
    slug,
    template: req.body.template,
    theme,
    store: {
      businessName: store.businessName,
      phone: store.phone,
      address: store.address,
      businessHours: store.businessHours,
      paymentMethods: store.paymentMethods,
      shippingInfo: store.shippingInfo,
      returnPolicy: store.returnPolicy,
      logoUrl: store.logoUrl,
    },
    products: selectedProducts.map((p) => ({
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
        ctaText: getConfigValue(config, "ctaText", null),
        imageUrl: getConfigValue(config, "heroImageUrl", null),
      },
      about: {
        description: getConfigValue(config, "aboutText", ""),
        mission: null,
        imageUrl: getConfigValue(config, "aboutImageUrl", null),
      },
      socialMedia: getConfigValue(config, "socialMedia", {}),
      contact: {
        email: getConfigValue(config, "contactEmail", null),
        mapsUrl: getConfigValue(config, "contactMapsUrl", null),
      },
      selectedProductIds: selectedProducts.map((p) => p.id),
      colors: {
        primary: getConfigValue(config, "primaryColor", "#059669"),
        secondary: getConfigValue(config, "secondaryColor", "#f59e0b"),
      },
      waOrderTemplate: null,
      logoUrl: getConfigValue(config, "logoUrl", store.logoUrl),
      faviconUrl: getConfigValue(config, "faviconUrl", null),
    },
    stats: {
      totalOrders,
      completed: stats.completed,
      pending: stats.pending,
    },
    outputDir,
    uploadsDir: UPLOADS_DIR,
  })

  if (!result.success) {
    await WebSiteModel.createGeneration(ownerId, {
      slug,
      status: "failed",
      productCount: selectedProducts.length,
      message: result.error ?? "generate failed",
    })
    throw new InternalServerError(result.error ?? "generate failed")
  }

  await WebSiteModel.createGeneration(ownerId, {
    slug,
    status: "success",
    productCount: selectedProducts.length,
    message: `Website berhasil di-generate (${slug})`,
  })

  const latestLink = path.join(GENERATED_DIR, "latest")
  try {
    const existing = readlinkSync(latestLink)
    if (existing !== slug) {
      unlinkSync(latestLink)
    }
  } catch {}
  try {
    symlinkSync(slug, latestLink)
  } catch {}

  sendResponse(res, 200, "website generated", { slug, outputPath: result.outputPath })
}

export async function listGenerations(req: Request, res: Response): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const gens = await WebSiteModel.listGenerations(ownerId)
  sendResponse(res, 200, "generations retrieved", gens)
}

export async function deleteGeneration(req: Request, res: Response): Promise<void> {
  const ownerId = getOwnerId(req)
  const gen = await WebSiteModel.getGenerationById(req.params.id as string)
  if (!gen) {
    throw new NotFoundError("generation not found")
  }

  const sourceDir = path.join(GENERATED_DIR, gen.slug)
  if (existsSync(sourceDir)) {
    rmSync(sourceDir, { recursive: true, force: true })
  }

  const latestLink = path.join(GENERATED_DIR, "latest")
  try {
    const target = readlinkSync(latestLink)
    if (target === gen.slug) {
      unlinkSync(latestLink)
      const next = await WebSiteModel.getLatestGeneration(ownerId)
      if (next) {
        symlinkSync(next.slug, latestLink)
      }
    }
  } catch {}

  await WebSiteModel.deleteGeneration(req.params.id as string)
  sendResponse(res, 200, "generation deleted")
}

export async function downloadWebsite(req: Request, res: Response): Promise<void> {
  const ownerId = await getOwnerIdOrFirst(req)
  const slug = (req.query.slug as string) || ""
  const gen = slug
    ? await WebSiteModel.getGenerationByOwnerSlug(ownerId, slug)
    : await WebSiteModel.getLatestGeneration(ownerId)

  if (!gen) {
    throw new NotFoundError("no generated website found — generate first")
  }

  const sourceDir = path.join(GENERATED_DIR, gen.slug)
  if (!existsSync(sourceDir)) {
    throw new NotFoundError("generated files not found on disk")
  }

  res.setHeader("Content-Type", "application/zip")
  res.setHeader("Content-Disposition", `attachment; filename="website-${gen.slug}.zip"`)

  const stream = createZipStream({ sourceDir, slug: gen.slug })
  stream.pipe(res)
}

export async function publishWebsite(req: Request, res: Response): Promise<void> {
  const ownerId = getOwnerId(req)
  const latest = await WebSiteModel.getLatestGeneration(ownerId)
  if (!latest) {
    throw new NotFoundError("no generated website found — generate first")
  }
  const sourceDir = path.join(GENERATED_DIR, latest.slug)
  if (!existsSync(sourceDir)) {
    throw new NotFoundError("generated files not found on disk")
  }

  await WebSiteModel.markPublished(ownerId)
  sendResponse(res, 200, "website published")
}
