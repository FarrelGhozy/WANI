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
@source "**/*.html";
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
    // display & responsive
    "hidden md:hidden md:flex md:block md:flex-row lg:flex sm:flex-row",
    "grid md:grid-cols-2 md:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:grid-cols-2",
    "md:col-span-2 md:col-span-full col-span-full md:row-span-2 md:row-span-1",
    "md:grid-rows-2 lg:grid-rows-2",
    // spacing responsive
    "md:px-margin-desktop md:py-sm md:py-md md:py-lg md:py-xl md:p-lg md:p-md",
    "lg:ml-52 md:ml-64 md:w-52 lg:w-64 md:w-auto md:h-16 md:h-[600px] md:h-[800px]",
    "md:aspect-square md:aspect-[4/5] md:aspect-[1/1]",
    // text responsive
    "md:text-left md:text-display-lg md:font-display-lg md:text-headline-sm md:text-3xl md:text-4xl md:text-8xl",
    // positioning responsive
    "md:translate-y-0 md:items-start md:justify-start md:justify-center",
    // interactive
    "hover:scale-105 hover:scale-110 active:scale-95 active:scale-95",
    "group-hover:scale-105 group-hover:scale-110 group-hover:opacity-100 group-hover:rotate-0 group-hover:translate-y-0 group-hover:text-primary group-hover:bg-vibrant-orange",
    "hover:bg-primary hover:bg-primary-container hover:bg-primary-fixed hover:bg-primary-fixed-dim",
    "hover:bg-surface hover:bg-surface-container hover:bg-surface-container-low hover:bg-surface-variant",
    "hover:bg-on-surface hover:bg-secondary hover:bg-secondary-fixed hover:bg-on-surface",
    "hover:bg-neutral-100 hover:bg-neutral-200 hover:bg-vibrant-purple",
    "hover:text-primary hover:text-primary-fixed hover:text-on-primary-fixed hover:text-white hover:text-surface",
    "hover:border-primary hover:border-primary-fixed hover:brightness-110 hover:underline",
    "hover:shadow-xl hover:glow-cyan hover:glow-secondary",
    "hover:translate-x-1 hover:translate-y-0",
    "focus:ring-2 focus:ring-4 focus:ring-vibrant-purple/30 focus:outline-none focus:border-primary-fixed focus:bg-surface-container-high",
    "focus:bg-surface-container-high",
    // common
    "hidden", "block", "flex", "inline-flex", "grid", "inline-block",
    "fixed", "sticky", "absolute", "relative",
    "overflow-hidden", "overflow-x-hidden",
    "rounded-full", "rounded-2xl", "rounded-xl", "rounded-lg",
    "border", "border-2", "border-t", "border-b", "border-r", "border-l",
    "border-dashed", "border-outline-variant",
    "shadow-sm", "shadow-lg", "shadow-2xl",
    "backdrop-blur", "backdrop-blur-lg", "backdrop-blur-xl", "backdrop-blur-md", "backdrop-blur-xs",
    "gap-sm", "gap-md", "gap-lg", "gap-xl", "gap-base", "gap-gutter",
    "space-y-sm", "space-y-md", "space-y-lg", "space-y-xl", "space-y-1", "space-y-2", "space-y-3",
    "space-x-sm", "space-x-md", "space-x-lg",
    "p-sm", "p-md", "p-lg", "p-xl", "p-xs", "p-base", "p-3", "p-4", "p-6",
    "px-sm", "px-md", "px-lg", "px-xl", "px-xs", "px-base", "px-3", "px-4", "px-6", "px-8",
    "py-sm", "py-md", "py-lg", "py-xl", "py-xs", "py-base", "py-1", "py-2", "py-3", "py-4",
    "pt-md", "pt-lg", "pt-xl", "pb-md", "pb-lg", "pb-xl",
    "pl-md", "pr-md",
    "m-sm", "m-md", "m-lg", "m-xl", "mx-auto", "mx-lg", "my-md",
    "mt-md", "mt-lg", "mt-xl", "mb-md", "mb-lg", "mb-xl",
    "-mt-10", "-mt-32", "-mb-32", "-mr-32", "-ml-32",
    "-top-1", "-top-10", "-top-12", "-right-1", "-right-8", "-right-12",
    "-bottom-4", "-bottom-10", "-bottom-12",
    "-left-4", "-left-10", "-left-12",
    "w-full", "w-10", "w-12", "w-14", "w-16", "w-20", "w-32", "w-48", "w-52", "w-64",
    "h-full", "h-px", "h-1", "h-2", "h-4", "h-8", "h-10", "h-12", "h-14", "h-16", "h-20",
    "min-h-screen", "min-w-[300px]",
    "max-w-2xl", "max-w-4xl", "max-w-5xl", "max-w-7xl", "max-w-xl", "max-w-lg", "max-w-md", "max-w-sm", "max-w-xs",
    "max-w-max-width",
    "aspect-square", "aspect-[4/5]", "aspect-[1/1]", "aspect-[3/4]",
    "inset-0", "inset-4", "inset-x-0",
    "z-0", "z-10", "z-40", "z-50", "z-[9999]",
    "opacity-0", "opacity-20", "opacity-30", "opacity-40", "opacity-60", "opacity-80", "opacity-100",
    "translate-y-full", "translate-y-0", "translate-y-8",
    "scale-150",
    "line-clamp-2", "line-clamp-3",
    "uppercase", "lowercase", "capitalize",
    "tracking-widest", "tracking-tighter",
    "leading-tight", "leading-relaxed", "leading-none",
    "text-center", "text-left", "text-right",
    "font-bold", "font-semibold", "font-medium", "font-black", "font-extrabold", "font-light",
    "italic", "not-italic",
    "whitespace-nowrap", "no-underline",
    "transition-all", "transition-colors", "transition-transform",
    "duration-100", "duration-200", "duration-300", "duration-500", "duration-700", "duration-1000",
    "animate-pulse", "animate-ping", "animate-spin",
    "grayscale", "grayscale-[10%]", "grayscale-[20%]",
    "mix-blend-overlay",
    "object-cover",
    "select-none", "pointer-events-none",
    "cursor-pointer",
    "sr-only",
    "gap-1", "gap-2", "gap-4", "gap-6", "gap-8",
    "flex-col", "flex-wrap", "flex-grow", "flex-1",
    "items-center", "items-start", "items-end",
    "justify-center", "justify-between", "justify-around", "justify-end", "justify-start",
    "self-start", "self-center", "self-end",
    "border-l-4", "border-r-2", "border-b-2", "border-t-2",
    "ring-4",
    "blur-2xl", "blur-3xl", "-mr-64",
    "rotate-12", "rotate-3", "-rotate-6",
    "decorate-4", "underline-offset-8",
  ]
  writeFileSync(join(inputDir, "_known.html"), `<div class="${allRefs.join(" ")}"></div>`)

  // run tailwindcss CLI
  const outFile = join(tp, "assets", "tailwind.css")
  mkdirSync(join(tp, "assets"), { recursive: true })
  const r = spawnSync("bunx", ["@tailwindcss/cli", "-i", join(inputDir, "input.css"), "-o", outFile], {
    cwd: inputDir, stdio: ["ignore", "pipe", "pipe"], timeout: 60_000,
  })

  if (r.status !== 0) {
    console.error(`[${t}] tailwind build failed:`, ((r.stderr || r.stdout)?.toString() || "no output").slice(0, 200))
  } else {
    const kb = (existsSync(outFile) ? readFileSync(outFile).length : 0) / 1024
    console.log(`[${t}] tailwind.css — ${kb.toFixed(0)}KB`)
  }
}

rmSync(TMP, { recursive: true, force: true })
