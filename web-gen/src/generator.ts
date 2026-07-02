import {
  existsSync,
  cpSync,
  rmSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  copyFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
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

/* ── HTML Template (multi-page + partials) ──────────── */
function generateHtml(
  params: GenerateParams,
  templatePath: string,
  _htmlPath: string,
): GenerateResult {
  const ctx = buildContext(params);

  // load partials (_*.html)
  const partials: Record<string, string> = {};
  for (const f of readdirSync(templatePath)) {
    if (f.startsWith("_") && f.endsWith(".html")) {
      partials[f.slice(1, -5)] = readFileSync(join(templatePath, f), "utf-8");
    }
  }

  // determine pages: all .html that aren't partials; fallback code.html
  let pages = readdirSync(templatePath)
    .filter((f) => f.endsWith(".html") && !f.startsWith("_"));

  // ponytail: single-file redirect until migrated
  if (pages.length === 0) {
    if (existsSync(join(templatePath, "code.html"))) {
      pages = ["code.html"];
    }
  }

  if (pages.length === 0) {
    return { success: false, outputPath: null, error: "no HTML templates found" };
  }

  const outDir = params.outputDir;
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // Copy images and merge their resolved paths into the context
  const imageMap = copyAssetImages(params, outDir);
  const fullCtx = { ...ctx, ...imageMap };

  // shared fonts dir (per-template fallback to shared)
  const fontsSrc = join(dirname(TEMPLATES_DIR), "assets", "fonts");

  // Resolve product image URLs to local copies where available
  const resolvedProducts = params.products.map((p) => ({
    ...p,
    imageUrl: imageMap[`product.${p.id}.imageUrl`] ?? p.imageUrl,
  }));

  for (const page of pages) {
    let html = readFileSync(join(templatePath, page), "utf-8");

    // inject partials
    for (const [name, content] of Object.entries(partials)) {
      html = html.replaceAll(`{{>${name}}}`, content);
    }

    // strip Google Fonts CDN links (but keep Material Symbols), inject local fonts.css
    html = html.replace(/<link(?![^>]*Material\+Symbols)[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/gi, "");
    html = html.replace("</head>", '<link href="./assets/fonts.css" rel="stylesheet"/></head>');

    // product loop
    html = html.replace(
      /{{#products}}([\s\S]*?){{\/products}}/g,
      (_, block) => resolvedProducts.map((p) => renderItem(block, p)).join("\n"),
    );

    // {{^products}} fallback
    html = html.replace(
      /{{\^products}}([\s\S]*?){{\/products}}/g,
      (_, block) => resolvedProducts.length === 0 ? block : "",
    );

    // page context for active nav highlighting
    const rawName = page.replace(/\.html$/, "");
    const pageCtx: Record<string, string> = { "page.name": rawName };
    // "code" page is the home page (beranda)
    const pageKey = rawName === "code" ? "beranda" : rawName;
    for (const p of ["beranda", "produk", "tentang", "kontak"]) {
      pageCtx[`page.${p}`] = pageKey === p ? "1" : "";
    }

    // conditional & negation sections — loop for nested sections
    for (let i = 0; i < 10; i++) {
      let before = html;
      html = html.replace(
        /{{#([a-zA-Z.]+)}}([\s\S]*?){{\/\1}}/g,
        (_, key, block) => {
          const val = fullCtx[key] ?? pageCtx[key];
          return val && String(val).length > 0 ? block : "";
        },
      );
      html = html.replace(
        /{{\^([a-zA-Z.]+)}}([\s\S]*?){{\/\1}}/g,
        (_, key, block) => {
          const val = fullCtx[key] ?? pageCtx[key];
          return (val && String(val).length > 0) ? "" : block;
        },
      );
      if (html === before) break;
    }

    // simple replacements — {{var}} escaped, {{{var}}} raw
    for (const [k, v] of Object.entries({ ...fullCtx, ...pageCtx })) {
      const val = String(v ?? "");
      html = html.replaceAll(`{{${k}}}`, escapeHtml(val));
      html = html.replaceAll(`{{{${k}}}}`, val);
    }

    // ponytail: "index" → index.html for clean URL, others keep name
    const pageName = page.replace(/\.html$/, "");
    const outName = pageName === "index" || page === "code.html" ? "index.html" : `${pageName}.html`;
    writeFileSync(join(outDir, outName), html);
  }

  const assetsDir = join(templatePath, "assets");
  if (existsSync(assetsDir)) {
    cpSync(assetsDir, join(outDir, "assets"), { recursive: true, force: true });
  }
  // copy shared fonts to output
  if (existsSync(fontsSrc)) {
    cpSync(fontsSrc, join(outDir, "assets"), { recursive: true, force: true });
  }

  // Write asset manifest
  const manifestEntries = Object.entries(imageMap).filter(([k]) => k.startsWith("product.") || k === "hero.imageUrl" || k === "about.imageUrl" || k === "store.logoUrl");
  if (manifestEntries.length > 0) {
    writeFileSync(join(outDir, "assets-manifest.json"), JSON.stringify(Object.fromEntries(manifestEntries), null, 2));
  }

  return { success: true, outputPath: outDir };
}

function renderItem(block: string, item: ProductData): string {
  let out = block;
  for (const [k, v] of Object.entries(item)) {
    const val = String(v ?? "");
    out = out.replaceAll(`{{.${k}}}`, escapeHtml(val));
    out = out.replaceAll(`{{{.${k}}}}`, val);
    const truthy = v !== null && v !== undefined && v !== false && v !== "";
    const startTag = `{{#.${k}}}`;
    const endTag = `{{/.${k}}}`;
    const negTag = `{{^.${k}}}`;
    while (out.includes(startTag)) {
      const s = out.indexOf(startTag);
      const e = out.indexOf(endTag, s);
      if (e === -1) break;
      const blockContent = out.slice(s + startTag.length, e);
      // ponytail: nested blocks not supported
      const before = out.slice(0, s);
      const after = out.slice(e + endTag.length);
      out = truthy ? before + blockContent + after : before + after;
    }
    while (out.includes(negTag)) {
      const s = out.indexOf(negTag);
      const e = out.indexOf(endTag, s);
      if (e === -1) break;
      const blockContent = out.slice(s + negTag.length, e);
      const before = out.slice(0, s);
      const after = out.slice(e + endTag.length);
      out = truthy ? before + after : before + blockContent + after;
    }
  }
  out = out.replaceAll(/{{\.\w+}}/g, "");
  out = out.replaceAll(/\{\{\{\.\w+\}\}\}/g, "");
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
  const p = config.colors.primary;
  const s = config.colors.secondary;
  const logoUrl = config.logoUrl ?? store.logoUrl ?? "";
  const faviconUrl = config.faviconUrl ?? logoUrl ?? null;
  const hasHeroImage = !!(config.hero.imageUrl);
  const hasAboutImage = !!(config.about.imageUrl);
  const hasLogo = !!logoUrl;
  const hasFavicon = !!faviconUrl;
  const initial = store.businessName?.charAt(0)?.toUpperCase() ?? "S";
  return {
    "store.businessName": store.businessName,
    "store.name": store.businessName,
    "store.phone": store.phone,
    "store.address": store.address ?? "",
    "store.businessHours": store.businessHours ?? "",
    "store.paymentMethods": store.paymentMethods ?? "",
    "store.shippingInfo": store.shippingInfo ?? "",
    "store.returnPolicy": store.returnPolicy ?? "",
    "store.logoUrl": logoUrl,
    // deprecated aliases kept for backward compatibility
    "hero.aboutText": config.about.description,
    "hero.headline": config.hero.headline,
    "hero.subheadline": config.hero.subheadline ?? "",
    "hero.ctaText": config.hero.ctaText ?? "Lihat Produk",
    "hero.imageUrl": config.hero.imageUrl ?? "",
    "hero.hasImage": hasHeroImage ? "1" : "",
    "about.description": config.about.description,
    "about.imageUrl": config.about.imageUrl ?? "",
    "about.hasImage": hasAboutImage ? "1" : "",
    "store.hasLogo": hasLogo ? "1" : "",
    "favicon.url": faviconUrl ?? "",
    "favicon.has": hasFavicon ? "1" : "",
    "favicon.svg": makeFaviconSvg(initial, p),
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
    "color.primary": p,
    "color.secondary": s,
    "color.vars": `--twc-primary:${p};--twc-primary-container:${p}33;--twc-primary-fixed-dim:${p}66;--twc-on-primary:#ffffff;--twc-secondary:${s};--twc-secondary-container:${s}33;--twc-on-secondary:#ffffff;`,
    "stats.totalOrders": String(stats.totalOrders),
    "stats.completed": String(stats.completed),
    "stats.pending": String(stats.pending),
    "whatsapp.url": `https://wa.me/${store.phone}`,
    "wa.text": encodeURIComponent(
      config.waOrderTemplate ?? buildDefaultWaTemplate(),
    ),
    "placeholders.hero": makePlaceholderSvg(p, s, "Hero"),
    "placeholders.about": makePlaceholderSvg(p, s, "Tentang"),
    "placeholders.product": makePlaceholderSvg("#f5f5f4", "#e7e5e4", "Produk"),
    "placeholders.logo": makePlaceholderSvg(p, p, store.businessName.charAt(0).toUpperCase()),
  };
}

function buildDefaultWaTemplate(): string {
  return [
    `Halo, saya tertarik dengan produk yang ada di katalog.`,
    ``,
    `Mohon info cara pemesanan dan pembayaran. Terima kasih.`,
  ].join("\n");
}

function makePlaceholderSvg(primary: string, secondary: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:${escapeHtml(primary)}33"/>
<stop offset="100%" style="stop-color:${escapeHtml(secondary)}44"/>
</linearGradient></defs>
<rect fill="url(#g)" width="800" height="600"/>
<rect fill="none" stroke="${escapeHtml(primary)}22" stroke-width="1" x="40" y="40" width="720" height="520"/>
<text x="400" y="310" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="600" fill="${escapeHtml(primary)}66">${escapeHtml(label)}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function makeFaviconSvg(initial: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
<rect width="32" height="32" rx="6" fill="${escapeHtml(color)}"/>
<text x="16" y="22" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">${escapeHtml(initial)}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type ImageMap = Record<string, string>;

function resolveUploadsDir(params: GenerateParams): string {
  if (params.uploadsDir) return params.uploadsDir;
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  // fallback: assumes web-gen and api are sibling directories
  return join(dirname(TEMPLATES_DIR), "..", "api", "uploads");
}

function copyAssetImages(params: GenerateParams, outDir: string): ImageMap {
  const imagesDir = join(outDir, "assets", "images");
  mkdirSync(imagesDir, { recursive: true });

  const imageMap: ImageMap = {};
  const uploadsDir = resolveUploadsDir(params);

  function resolveImage(sourceUrl: string | null | undefined, destName: string): string | null {
    if (!sourceUrl) return null;

    // Local uploads: resolve from the uploads directory
    if (sourceUrl.startsWith("/uploads/")) {
      const filename = sourceUrl.split("/").pop() ?? destName;
      const sourcePath = join(uploadsDir, filename);
      if (existsSync(sourcePath)) {
        const ext = sourcePath.includes(".") ? `.${sourcePath.split(".").pop()}` : ".jpg";
        const dest = join(imagesDir, `${destName}${ext}`);
        copyFileSync(sourcePath, dest);
        return `./assets/images/${destName}${ext}`;
      }
      return null;
    }

    // External URLs: keep as-is
    if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
      return sourceUrl;
    }

    // Relative or other paths: try to copy if file exists, otherwise return null
    return null;
  }

  // Hero image
  const heroLocal = resolveImage(params.config.hero.imageUrl, "hero");
  if (heroLocal) imageMap["hero.imageUrl"] = heroLocal;

  // About image
  const aboutLocal = resolveImage(params.config.about.imageUrl, "about");
  if (aboutLocal) imageMap["about.imageUrl"] = aboutLocal;

  // Logo
  const logoSource = params.config.logoUrl ?? params.store.logoUrl;
  const logoLocal = resolveImage(logoSource, "logo");
  if (logoLocal) imageMap["store.logoUrl"] = logoLocal;

  // Favicon — fallback: faviconUrl → logoUrl → SVG (handled in template via favicon.svg)
  const faviconSource = params.config.faviconUrl ?? params.config.logoUrl ?? params.store.logoUrl;
  const faviconLocal = resolveImage(faviconSource, "favicon");
  if (faviconLocal) imageMap["favicon.url"] = faviconLocal;

  // Product images
  for (const product of params.products) {
    if (product.imageUrl) {
      const productLocal = resolveImage(product.imageUrl, `product-${product.id}`);
      if (productLocal) {
        // Inject into the product data so renderItem picks it up
        imageMap[`product.${product.id}.imageUrl`] = productLocal;
      }
    }
  }

  return imageMap;
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
      logoUrl: null,
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
