import {
  existsSync,
  cpSync,
  rmSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import type { GenerateParams, GenerateResult } from "./types.ts";

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

  let workingDir = "";
  try {
    workingDir = mkdtempSync(join(tmpdir(), `wani-web-${params.slug}-`));
    cpSync(templatePath, workingDir, { recursive: true });

    const theme = params.theme ?? "classic"
    const themeSrc = join(templatePath, "src", "themes", `${theme}.css`)
    if (existsSync(themeSrc)) {
      const publicDir = join(workingDir, "public")
      mkdirSync(publicDir, { recursive: true })
      writeFileSync(join(publicDir, "theme.css"), readFileSync(themeSrc, "utf-8"))
    }

    writeDataFile(workingDir, "store.json", {
      businessName: params.store.businessName,
      phone: params.store.phone,
      address: params.store.address,
      businessHours: params.store.businessHours,
      paymentMethods: params.store.paymentMethods,
    });

    writeDataFile(
      workingDir,
      "products.json",
      params.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        isAvailable: p.isAvailable,
        imageUrl: p.imageUrl,
      })),
    );

    writeDataFile(workingDir, "site-config.json", {
      hero: params.config.hero,
      about: params.config.about,
      contact: params.config.contact,
      colors: params.config.colors,
      waOrderTemplate:
        params.config.waOrderTemplate ?? buildDefaultWaTemplate(),
    });

    writeDataFile(workingDir, "orders-stats.json", {
      totalOrders: params.stats.totalOrders,
      completed: params.stats.completed,
      pending: params.stats.pending,
    });

    const install = spawnSync("bun", ["install", "--silent"], {
      cwd: workingDir,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });

    if (install.status !== 0) {
      const msg = install.stderr?.toString() || "npm install failed";
      return { success: false, outputPath: null, error: msg };
    }

    const build = spawnSync("bunx", ["astro", "build"], {
      cwd: workingDir,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });

    if (build.status !== 0) {
      const msg = build.stderr?.toString() || "astro build failed";
      return { success: false, outputPath: null, error: msg };
    }

    if (existsSync(params.outputDir)) {
      rmSync(params.outputDir, { recursive: true, force: true });
    }
    mkdirSync(params.outputDir, { recursive: true });
    cpSync(join(workingDir, "dist"), params.outputDir, { recursive: true });

    return { success: true, outputPath: params.outputDir };
  } finally {
    if (workingDir) {
      rmSync(workingDir, { recursive: true, force: true });
    }
  }
}

function writeDataFile(workingDir: string, filename: string, data: unknown) {
  const dataDir = join(workingDir, "src", "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, filename), JSON.stringify(data, null, 2));
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
