import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"
import { spawnSync } from "node:child_process"

const TPL_DIR = join(dirname(import.meta.dir), "src", "templates")
const SRC_DIR = join(dirname(import.meta.dir), "templates_webgen")
const TMP = join(import.meta.dir, "..", "tmp-css")

const SRC_MAP: Record<string, string> = {
  modern: "modern_template_wani_store",
  vibrant: "vibrant_template_wani_store",
  cyberpunk: "cyberpunk_template_wani_store",
  minimalist: "minimalist_template_wani_store",
  classic: "classic_renaissance_default_wani_store",
}

for (const [t, src] of Object.entries(SRC_MAP)) {
  const tp = join(TPL_DIR, t)
  const srcFile = join(SRC_DIR, src, "code.html")
  if (!existsSync(srcFile)) {
    console.warn(`[${t}] source not found: ${srcFile}`)
    continue
  }

  // read colors block from ORIGINAL source template (has full tailwind.config)
  const raw = readFileSync(srcFile, "utf-8")
  const cm = raw.match(/["']?colors["']?\s*:\s*\{([\s\S]*?)\}\s*,?\s*\n\s*["']?(?:borderRadius|spacing|fontFamily|fontSize)/)
  if (!cm) {
    console.warn(`[${t}] no colors block in source`)
    continue
  }
  const colorsBlock = cm[1]
  const colorRegex = /["']?([a-zA-Z][a-zA-Z0-9-]*)["']?\s*:\s*"([^"]+)"/g
  const colors: Record<string, string> = {}
  let m: RegExpExecArray | null
  while ((m = colorRegex.exec(colorsBlock)) !== null) {
    colors[m[1]] = m[2]
  }

  // user-configurable colors — primary + secondary + derivatives
  const DYNAMIC = new Set(["primary", "primary-container", "primary-fixed-dim",
    "on-primary", "secondary", "secondary-container", "on-secondary"])
  const themeVars = Object.entries(colors).map(([name, val]) => {
    if (DYNAMIC.has(name)) {
      return `  --color-${name}: var(--twc-${name}, ${val});`
    }
    return `  --color-${name}: ${val};`
  })

  const input = `@import "tailwindcss";
@source "./*.html";
@theme {
${themeVars.join("\n")}
}
`

  const inputDir = join(TMP, t)
  mkdirSync(inputDir, { recursive: true })
  writeFileSync(join(inputDir, "input.css"), input)

  // copy all template pages (stripped of placeholders) for Tailwind scanning
  for (const f of readdirSync(tp)) {
    if (!f.endsWith(".html") || f.startsWith("_")) continue
    const cleaned = readFileSync(join(tp, f), "utf-8")
      .replace(/\{\{[#^/].*?\}\}/g, "")
      .replace(/\{\{[a-zA-Z. ]+\}\}/g, "")
    writeFileSync(join(inputDir, f), cleaned)
  }

  // dummy file forcing all color utilities + common responsive classes
  const allRefs = Object.keys(colors).flatMap((c) =>
    [`bg-${c}`, `text-${c}`, `border-${c}`, `hover:bg-${c}`, `hover:text-${c}`,
     `bg-${c}/20`, `text-${c}/80`, `border-${c}/50`,
     `active:bg-${c}`, `focus:ring-${c}`, `focus:border-${c}`,
     `shadow-${c}`, `outline-${c}`, `ring-${c}`,
    ])
  allRefs.push("md:flex lg:grid-cols-2 sm:grid-cols-2 sm:col-span-2 hover:scale-105 active:scale-95")
  writeFileSync(join(inputDir, "_colors.html"), `<div class="${allRefs.join(" ")}"></div>`)

  // run tailwindcss CLI
  const outFile = join(tp, "assets", "tailwind.css")
  mkdirSync(join(tp, "assets"), { recursive: true })
  const r = spawnSync("npx", ["@tailwindcss/cli", "-i", join(inputDir, "input.css"), "-o", outFile], {
    cwd: inputDir, stdio: ["ignore", "pipe", "pipe"], timeout: 60_000,
    env: { ...process.env, NODE_ENV: "production" },
  })

  if (r.status !== 0) {
    console.error(`[${t}] tailwind build failed:`, (r.stderr || r.stdout).toString().slice(0, 200))
  } else {
    const kb = (existsSync(outFile) ? readFileSync(outFile).length : 0) / 1024
    console.log(`[${t}] tailwind.css — ${kb.toFixed(0)}KB`)
  }
}

rmSync(TMP, { recursive: true, force: true })
