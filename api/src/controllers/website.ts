import type { Request, Response } from "express"
import type { z } from "zod"
import path from "node:path"
import { existsSync, rmSync, symlinkSync, unlinkSync, readlinkSync } from "node:fs"
import { WebSiteModel } from "@/src/models/website"
import { StoreModel } from "@/src/models/store"
import { ProductModel } from "@/src/models/catalog"
import { OrderModel } from "@/src/models/order"
import { sendResponse } from "@/src/utils/response"
import { BadRequestError, InternalServerError, NotFoundError } from "@/src/utils/errors"
import { updateWebsiteSchema, generateWebsiteSchema } from "@/src/schemas/website"
import { generate, createZipStream } from "@web-gen/index.ts"

type UpdateWebsiteBody = z.infer<typeof updateWebsiteSchema>
type GenerateWebsiteBody = z.infer<typeof generateWebsiteSchema>

const GENERATED_DIR = path.resolve(import.meta.dir, "..", "generated-sites")

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
      selectedProductIds: selectedProducts.map((p: any) => p.id),
      colors: {
        primary: getConfigValue(config, "primaryColor", "#059669"),
        secondary: getConfigValue(config, "secondaryColor", "#f59e0b"),
      },
      waOrderTemplate: null,
      logoUrl: getConfigValue(config, "logoUrl", store.logoUrl),
    },
    stats: {
      totalOrders,
      completed: stats.completed,
      pending: stats.pending,
    },
    outputDir,
  })

  if (!result.success) {
    await WebSiteModel.createGeneration({
      slug,
      status: "failed",
      productCount: selectedProducts.length,
      message: result.error ?? "generate failed",
    })
    throw new InternalServerError(result.error ?? "generate failed")
  }

  await WebSiteModel.createGeneration({
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

export async function listGenerations(_req: Request, res: Response): Promise<void> {
  const gens = await WebSiteModel.listGenerations()
  sendResponse(res, 200, "generations retrieved", gens)
}

export async function deleteGeneration(req: Request, res: Response): Promise<void> {
  const gen = await WebSiteModel.getGenerationById(req.params.id)
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
      const next = await WebSiteModel.getLatestGeneration()
      if (next) {
        symlinkSync(next.slug, latestLink)
      }
    }
  } catch {}

  await WebSiteModel.deleteGeneration(req.params.id)
  sendResponse(res, 200, "generation deleted")
}

export async function downloadWebsite(req: Request, res: Response): Promise<void> {
  const slug = (req.query.slug as string) || ""
  const gen = slug
    ? await WebSiteModel.getGenerationBySlug(slug)
    : await WebSiteModel.getLatestGeneration()

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

export async function publishWebsite(_req: Request, res: Response): Promise<void> {
  const latest = await WebSiteModel.getLatestGeneration()
  if (!latest) {
    throw new NotFoundError("no generated website found — generate first")
  }
  const sourceDir = path.join(GENERATED_DIR, latest.slug)
  if (!existsSync(sourceDir)) {
    throw new NotFoundError("generated files not found on disk")
  }

  await WebSiteModel.markPublished()
  sendResponse(res, 200, "website published")
}
