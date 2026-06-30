import { z } from "zod"

const socialPlatforms = [
  "instagram", "facebook", "tiktok", "youtube",
  "shopee", "tokopedia", "twitter", "linkedin",
] as const

export const socialMediaSchema = z.record(
  z.enum(socialPlatforms),
  z.string().url().optional().or(z.literal("")),
)

export const updateWebsiteSchema = z.object({
  heroHeadline: z.string().optional(),
  heroSubheadline: z.string().optional(),
  aboutText: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be hex color").optional(),
  phone: z.string().optional(),
  selectedProductIds: z.array(z.string()).optional(),
  template: z.string().optional(),
  theme: z.enum(["classic", "modern", "vibrant", "elegant"]).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactMapsUrl: z.string().url().optional().or(z.literal("")),
  socialMedia: socialMediaSchema.optional(),
  heroImageUrl: z.string().nullable().optional(),
  aboutImageUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  ctaText: z.string().optional(),
})

export const generateWebsiteSchema = z.object({
  template: z.string().default("default"),
})
