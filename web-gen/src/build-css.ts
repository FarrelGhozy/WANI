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

// Extract object content between matching braces starting at `start` offset
function extractBraced(source: string, start: number): string {
  let depth = 1, pos = start
  while (depth > 0 && pos < source.length) {
    if (source[pos] === "{") depth++
    else if (source[pos] === "}") depth--
    pos++
  }
  return source.slice(start, pos - 1)
}

// Extract section value from inside `extend: { ... }`
function extractSection(config: string, name: string): string | null {
  const re = new RegExp(`["']?${name}["']?\\s*:\\s*\\{`)
  const m = re.exec(config)
  if (!m) return null
  return extractBraced(config, m.index + m[0].length)
}

function parseStrMap(src: string): Record<string, string> {
  const r: Record<string, string> = {}
  const re = /["']?([a-zA-Z][a-zA-Z0-9-]*)["']?\s*:\s*"([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) r[m[1]] = m[2]
  return r
}

function parseFontFamily(src: string): Record<string, string> {
  const r: Record<string, string> = {}
  const re = /["']?([a-zA-Z][a-zA-Z0-9-]*)["']?\s*:\s*\[([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    // ["Plus Jakarta Sans"] -> "Plus Jakarta Sans"
    r[m[1]] = m[2].replace(/["']/g, "").trim()
  }
  return r
}

function parseFontSize(src: string): Record<string, string> {
  const r: Record<string, string> = {}
  // "key": ["size", { ... }]
  const re = /["']?([a-zA-Z][a-zA-Z0-9-]*)["']?\s*:\s*\["([^"]+)"(?:,\s*\{[^}]*\})?\s*\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    r[m[1]] = m[2]
  }
  return r
}

for (const [t, src] of Object.entries(SRC_MAP)) {
  const tp = join(TPL_DIR, t)
  const srcFile = join(SRC_DIR, src, "code.html")
  if (!existsSync(srcFile)) {
    console.warn(`[${t}] source not found: ${srcFile}`)
    continue
  }

  const raw = readFileSync(srcFile, "utf-8")
  // Extract the full tailwind config extend block
  const configMatch = raw.match(/tailwind\.config\s*=\s*\{[\s\S]*?theme\s*:\s*\{[\s\S]*?extend\s*:\s*\{/)
  if (!configMatch) {
    console.warn(`[${t}] no tailwind config found`)
    continue
  }
  const extendStart = configMatch.index! + configMatch[0].length
  const extendBlock = extractBraced(raw, extendStart)

  // Parse each section
  const colorsRaw = extractSection(extendBlock, "colors")
  if (!colorsRaw) {
    console.warn(`[${t}] no colors in config`)
    continue
  }
  const spacingRaw = extractSection(extendBlock, "spacing")
  const brRaw = extractSection(extendBlock, "borderRadius")
  const ffRaw = extractSection(extendBlock, "fontFamily")
  const fsRaw = extractSection(extendBlock, "fontSize")

  const colors = parseStrMap(colorsRaw)
  const spacing = spacingRaw ? parseStrMap(spacingRaw) : {}
  const br = brRaw ? parseStrMap(brRaw) : {}
  const fontFamily = ffRaw ? parseFontFamily(ffRaw) : {}
  const fontSize = fsRaw ? parseFontSize(fsRaw) : {}

  // user-configurable colors — primary + secondary + derivatives
  const DYNAMIC = new Set(["primary", "primary-container", "primary-fixed-dim",
    "on-primary", "secondary", "secondary-container", "on-secondary"])
  const themeLines: string[] = []

  // Colors
  for (const [name, val] of Object.entries(colors)) {
    if (DYNAMIC.has(name)) {
      themeLines.push(`  --color-${name}: var(--twc-${name}, ${val});`)
    } else {
      themeLines.push(`  --color-${name}: ${val};`)
    }
  }

  // Spacing
  for (const [name, val] of Object.entries(spacing)) {
    themeLines.push(`  --spacing-${name}: ${val};`)
  }

  // Border radius
  for (const [name, val] of Object.entries(br)) {
    if (name === "DEFAULT") {
      themeLines.push(`  --radius: ${val};`)
    } else {
      themeLines.push(`  --radius-${name}: ${val};`)
    }
  }

  // Font families
  for (const [name, val] of Object.entries(fontFamily)) {
    themeLines.push(`  --font-${name}: "${val}";`)
  }

  // Font sizes
  for (const [name, val] of Object.entries(fontSize)) {
    themeLines.push(`  --text-${name}: ${val};`)
  }

  const input = `@import "tailwindcss";
@source "./*.html";
@theme {
${themeLines.join("\n")}
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

  // dummy file forcing all color utilities + spacing + typography + common responsive classes
  const allRefs = [
    ...Object.keys(colors).flatMap((c) =>
      [`bg-${c}`, `text-${c}`, `border-${c}`, `hover:bg-${c}`, `hover:text-${c}`,
       `bg-${c}/20`, `text-${c}/80`, `border-${c}/50`,
       `active:bg-${c}`, `focus:ring-${c}`, `focus:border-${c}`,
       `shadow-${c}`, `outline-${c}`, `ring-${c}`,
      ]),
    ...Object.keys(spacing).flatMap((s) =>
      [`p-${s}`, `px-${s}`, `py-${s}`, `m-${s}`, `mx-${s}`, `my-${s}`,
       `gap-${s}`, `space-x-${s}`, `space-y-${s}`,
      ]),
    ...Object.keys(br).flatMap((b) =>
      b === "DEFAULT" ? [`rounded`, `rounded-lg`, `rounded-xl`, `rounded-full`]
        : [`rounded-${b}`]),
    ...Object.keys(fontFamily).flatMap((f) => [`font-${f}`]),
    ...Object.keys(fontSize).flatMap((s) => [`text-${s}`]),
    "md:flex lg:grid-cols-2 sm:grid-cols-2 sm:col-span-2 hover:scale-105 active:scale-95",
    "p-xl", "px-xl", "py-xl", "px-lg", "py-lg", "p-lg", "gap-lg", "gap-md", "gap-sm", "gap-xl",
  ]
  writeFileSync(join(inputDir, "_known.html"), `<div class="${allRefs.join(" ")}"></div>`)

  // run tailwindcss CLI
  const outFile = join(tp, "assets", "tailwind.css")
  mkdirSync(join(tp, "assets"), { recursive: true })
  const r = spawnSync("bunx", ["@tailwindcss/cli", "-i", join(inputDir, "input.css"), "-o", outFile], {
    cwd: inputDir, stdio: ["ignore", "pipe", "pipe"], timeout: 60_000,
    env: { ...process.env, NODE_ENV: "production" },
  })

  if (r.status !== 0) {
    console.error(`[${t}] tailwind build failed:`, ((r.stderr || r.stdout)?.toString() || "no output").slice(0, 200))
  } else {
    const kb = (existsSync(outFile) ? readFileSync(outFile).length : 0) / 1024
    console.log(`[${t}] tailwind.css — ${kb.toFixed(0)}KB`)
  }
}

rmSync(TMP, { recursive: true, force: true })
