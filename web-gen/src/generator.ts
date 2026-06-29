import {
  existsSync,
  cpSync,
  rmSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import type { GenerateParams, GenerateResult, ProductData } from "./types.ts";

const TEMPLATES_DIR = join(import.meta.dir, "templates");

export async function generate(
  params: GenerateParams,
): Promise<GenerateResult> {
  const templatePath = join(TEMPLATES_DIR, params.template);

  if (!existsSync(templatePath)) {
    return {
      success: false,
      outputPath: null,
      error: `Template '${params.template}' not found`,
    };
  }

  const htmlTemplate = join(templatePath, "code.html");

  if (existsSync(htmlTemplate)) {
    return generateHtml(params, templatePath, htmlTemplate);
  }

  return generateAstro(params, templatePath);
}

/* ── HTML Template ──────────────────────────────────── */
function generateHtml(
  params: GenerateParams,
  templatePath: string,
  htmlPath: string,
): GenerateResult {
  const ctx = buildContext(params);
  let html = readFileSync(htmlPath, "utf-8");

  // product loop
  html = html.replace(
    /{{#products}}([\s\S]*?){{\/products}}/g,
    (_, block) => params.products.map((p) => renderItem(block, p)).join("\n"),
  );

  // simple replacements
  for (const [k, v] of Object.entries(ctx)) {
    html = html.replaceAll(`{{${k}}}`, String(v ?? ""));
  }

  const outDir = params.outputDir;
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  const assetsDir = join(templatePath, "assets");
  if (existsSync(assetsDir)) {
    cpSync(assetsDir, join(outDir, "assets"), { recursive: true, force: true });
  }
  return { success: true, outputPath: outDir };
}

function renderItem(block: string, item: ProductData): string {
  let out = block;
  for (const [k, v] of Object.entries(item)) {
    out = out.replaceAll(`{{.${k}}}`, String(v ?? ""));
  }
  out = out.replaceAll(/{{\.\w+}}/g, ""); // cleanup unused
  return out;
}

/* ── Astro Template ─────────────────────────────────── */
function generateAstro(
  params: GenerateParams,
  templatePath: string,
): GenerateResult {
  let workingDir = "";
  try {
    workingDir = mkdtempSync(join(tmpdir(), `wani-web-${params.slug}-`));
    cpSync(templatePath, workingDir, { recursive: true });

    const theme = params.theme ?? "classic";
    const themeSrc = join(templatePath, "src", "themes", `${theme}.css`);
    const baseSrc = join(templatePath, "src", "themes", "base.css");
    if (existsSync(themeSrc)) {
      const publicDir = join(workingDir, "public");
      mkdirSync(publicDir, { recursive: true });
      writeFileSync(join(publicDir, "theme.css"), readFileSync(themeSrc, "utf-8"));
      if (existsSync(baseSrc)) {
        writeFileSync(join(publicDir, "base.css"), readFileSync(baseSrc, "utf-8"));
      }
    }

    writeDataFile(workingDir, "store.json", {
      businessName: params.store.businessName,
      phone: params.store.phone,
      address: params.store.address,
      businessHours: params.store.businessHours,
      paymentMethods: params.store.paymentMethods,
    });

    writeDataFile(workingDir, "products.json",
      params.products.map((p) => ({
        id: p.id, name: p.name, description: p.description,
        price: p.price, stock: p.stock, isAvailable: p.isAvailable, imageUrl: p.imageUrl,
      })),
    );

    writeDataFile(workingDir, "site-config.json", {
      hero: params.config.hero,
      about: params.config.about,
      socialMedia: params.config.socialMedia ?? {},
      contact: params.config.contact,
      colors: params.config.colors,
      basePath: `/s/${params.slug}/`,
      waOrderTemplate: params.config.waOrderTemplate ?? buildDefaultWaTemplate(),
    });

    writeDataFile(workingDir, "orders-stats.json", {
      totalOrders: params.stats.totalOrders,
      completed: params.stats.completed,
      pending: params.stats.pending,
    });

    const install = spawnSync("bun", ["install", "--silent"], {
      cwd: workingDir, stdio: ["ignore", "pipe", "pipe"], timeout: 120_000,
    });
    if (install.status !== 0) {
      return { success: false, outputPath: null, error: install.stderr?.toString() || "npm install failed" };
    }

    const build = spawnSync("bunx", ["astro", "build"], {
      cwd: workingDir, stdio: ["ignore", "pipe", "pipe"], timeout: 120_000,
    });
    if (build.status !== 0) {
      return { success: false, outputPath: null, error: build.stderr?.toString() || "astro build failed" };
    }

    const outDir = params.outputDir;
    if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    cpSync(join(workingDir, "dist"), outDir, { recursive: true });
    return { success: true, outputPath: outDir };
  } finally {
    if (workingDir) rmSync(workingDir, { recursive: true, force: true });
  }
}

function writeDataFile(workingDir: string, filename: string, data: unknown) {
  const dataDir = join(workingDir, "src", "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, filename), JSON.stringify(data, null, 2));
}

function buildContext(params: GenerateParams): Record<string, unknown> {
  const { store, config, stats } = params;
  const fmtPrice = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  return {
    "store.businessName": store.businessName,
    "store.phone": store.phone,
    "store.address": store.address ?? "",
    "store.businessHours": store.businessHours ?? "",
    "store.paymentMethods": store.paymentMethods ?? "",
    "hero.headline": config.hero.headline,
    "hero.subheadline": config.hero.subheadline ?? "",
    "hero.ctaText": config.hero.ctaText ?? "Lihat Produk",
    "about.description": config.about.description,
    "social.instagram": config.socialMedia.instagram ?? "",
    "social.facebook": config.socialMedia.facebook ?? "",
    "social.tiktok": config.socialMedia.tiktok ?? "",
    "social.youtube": config.socialMedia.youtube ?? "",
    "social.shopee": config.socialMedia.shopee ?? "",
    "social.tokopedia": config.socialMedia.tokopedia ?? "",
    "social.twitter": config.socialMedia.twitter ?? "",
    "social.linkedin": config.socialMedia.linkedin ?? "",
    "contact.email": config.contact.email ?? "",
    "contact.mapsUrl": config.contact.mapsUrl ?? "",
    "color.primary": config.colors.primary,
    "color.secondary": config.colors.secondary,
    "stats.totalOrders": String(stats.totalOrders),
    "stats.completed": String(stats.completed),
    "stats.pending": String(stats.pending),
    "wa.text": encodeURIComponent(
      config.waOrderTemplate ?? buildDefaultWaTemplate(),
    ),
    "wa.phone": store.phone,
  };
}

function buildDefaultWaTemplate(): string {
  return [
    `Halo {store.businessName}, saya tertarik dengan produk berikut:`,
    ``,
    `\u2022 {product.name}`,
    `\u2022 Harga: Rp {product.price}`,
    ``,
    `Apakah produk ini tersedia? Mohon info cara pemesanan dan pembayaran. Terima kasih.`,
  ].join("\n");
}

// ponytail: CLI demo mode
if (import.meta.main) {
  const params: GenerateParams = {
    slug: "demo-toko",
    template: "modern",
    theme: "classic",
    store: {
      businessName: "Demo Toko",
      phone: "6281234567890",
      address: "Jl. Demo No. 123, Jakarta",
      businessHours: "Senin - Sabtu, 08:00 - 17:00",
      paymentMethods: "Tunai, Transfer Bank, QRIS",
      shippingInfo: "JNE, J&T, SiCepat",
      returnPolicy: "Barang dapat dikembalikan dalam 7 hari",
    },
    products: [
      {
        id: "p1", name: "Produk A", description: "Deskripsi produk A",
        price: 25000, stock: 10, isAvailable: true, imageUrl: null,
      },
      {
        id: "p2", name: "Produk B", description: "Deskripsi produk B",
        price: 50000, stock: 5, isAvailable: true, imageUrl: null,
      },
    ],
    config: {
      hero: { headline: "Selamat Datang", subheadline: "Toko demo kami", ctaText: "Lihat Produk" },
      about: { description: "Toko demo untuk testing generator", mission: null },
      socialMedia: { instagram: "https://instagram.com/demo" },
      contact: { email: null, mapsUrl: null },
      selectedProductIds: ["p1", "p2"],
      colors: { primary: "#059669", secondary: "#f59e0b" },
      waOrderTemplate: null,
    },
    stats: { totalOrders: 10, completed: 7, pending: 3 },
    outputDir: join(import.meta.dir, "..", "generated-sites", "demo-toko"),
  }

  const result = await generate(params)
  if (result.success) {
    console.log(`✓ Generated: ${result.outputPath}`)
  } else {
    console.error(`✗ Failed: ${result.error}`)
    process.exit(1)
  }
}
