import { prisma } from '../config/prisma.js';

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface TemplateFonts {
  heading: string;
  body: string;
}

export interface TemplateLayout {
  style: string;
  rounded: boolean;
  shadows: boolean;
}

export interface TemplateConfig {
  colors: TemplateColors;
  fonts: TemplateFonts;
  layout: TemplateLayout;
}

export interface RenderedTheme {
  name: string;
  label: string;
  config: TemplateConfig;
  cssVars: Record<string, string>;
  css: string;
  googleFonts: string[];
}

const DEFAULT_TEMPLATE = 'modern';

const DEFAULT_CONFIG: TemplateConfig = {
  colors: { primary: '#4F46E5', secondary: '#7C3AED', accent: '#F59E0B', background: '#FFFFFF', text: '#1F2937' },
  fonts: { heading: 'Inter', body: 'Inter' },
  layout: { style: 'modern', rounded: true, shadows: true },
};

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '0, 0, 0';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function generateCssVars(config: TemplateConfig): Record<string, string> {
  return {
    '--store-primary': config.colors.primary,
    '--store-primary-rgb': hexToRgb(config.colors.primary),
    '--store-secondary': config.colors.secondary,
    '--store-secondary-rgb': hexToRgb(config.colors.secondary),
    '--store-accent': config.colors.accent,
    '--store-accent-rgb': hexToRgb(config.colors.accent),
    '--store-bg': config.colors.background,
    '--store-bg-rgb': hexToRgb(config.colors.background),
    '--store-text': config.colors.text,
    '--store-text-rgb': hexToRgb(config.colors.text),
    '--store-font-heading': config.fonts.heading,
    '--store-font-body': config.fonts.body,
    '--store-radius-sm': config.layout.rounded ? '0.375rem' : '0',
    '--store-radius-md': config.layout.rounded ? '0.5rem' : '0',
    '--store-radius-lg': config.layout.rounded ? '0.75rem' : '0',
    '--store-radius-xl': config.layout.rounded ? '1rem' : '0',
    '--store-shadow-sm': config.layout.shadows ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
    '--store-shadow-md': config.layout.shadows ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none',
    '--store-shadow-lg': config.layout.shadows ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none',
  };
}

function generateCss(config: TemplateConfig): string {
  const { colors, layout } = config;
  const r = layout.rounded;
  const s = layout.shadows;

  return `
.store-card {
  background: ${colors.background};
  border: 1px solid ${colors.text}10;
  border-radius: ${r ? '0.75rem' : '0'};
  box-shadow: ${s ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none'};
  transition: all 0.2s ease;
}
.store-card:hover {
  box-shadow: ${s ? '0 10px 15px -3px rgb(0 0 0 / 0.15)' : 'none'};
  transform: ${s ? 'translateY(-2px)' : 'none'};
}
.store-btn {
  background: ${colors.primary};
  color: ${colors.background};
  border-radius: ${r ? '0.5rem' : '0'};
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}
.store-btn:hover {
  background: ${colors.text}dd;
}
.store-btn-outline {
  background: transparent;
  color: ${colors.primary};
  border: 2px solid ${colors.primary};
  border-radius: ${r ? '0.5rem' : '0'};
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}
.store-btn-outline:hover {
  background: ${colors.primary};
  color: ${colors.background};
}
.store-hero {
  background: linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15);
  border-radius: ${r ? '1rem' : '0'};
}
.store-badge {
  background: ${colors.primary}20;
  color: ${colors.primary};
  border-radius: ${r ? '9999px' : '0'};
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
}
.store-divider {
  border-color: ${colors.text}10;
}
.store-tag {
  background: ${colors.accent}20;
  color: ${colors.accent};
  border-radius: ${r ? '0.25rem' : '0'};
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
}
.store-input {
  border: 1px solid ${colors.text}20;
  border-radius: ${r ? '0.5rem' : '0'};
  background: ${colors.background};
  color: ${colors.text};
}
.store-input:focus {
  border-color: ${colors.primary};
  box-shadow: 0 0 0 3px ${colors.primary}20;
}
.store-modal-overlay {
  background: ${colors.text}80;
}
.store-modal {
  background: ${colors.background};
  border-radius: ${r ? '1rem' : '0'};
  box-shadow: ${s ? '0 25px 50px -12px rgb(0 0 0 / 0.25)' : 'none'};
}
.store-nav {
  background: ${colors.background};
  border-bottom: 1px solid ${colors.text}10;
}
.store-footer {
  background: ${colors.text}08;
  color: ${colors.text};
}
.store-link {
  color: ${colors.primary};
  text-decoration: none;
}
.store-link:hover {
  text-decoration: underline;
}
`.trim();
}

function parseConfig(raw: unknown): TemplateConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG };
  const c = raw as Record<string, unknown>;

  const colors = c.colors as Record<string, string> | undefined;
  const fonts = c.fonts as Record<string, string> | undefined;
  const layout = c.layout as Record<string, unknown> | undefined;

  return {
    colors: {
      primary: colors?.primary || DEFAULT_CONFIG.colors.primary,
      secondary: colors?.secondary || DEFAULT_CONFIG.colors.secondary,
      accent: colors?.accent || DEFAULT_CONFIG.colors.accent,
      background: colors?.background || DEFAULT_CONFIG.colors.background,
      text: colors?.text || DEFAULT_CONFIG.colors.text,
    },
    fonts: {
      heading: fonts?.heading || DEFAULT_CONFIG.fonts.heading,
      body: fonts?.body || DEFAULT_CONFIG.fonts.body,
    },
    layout: {
      style: typeof layout?.style === 'string' ? layout.style : DEFAULT_CONFIG.layout.style,
      rounded: typeof layout?.rounded === 'boolean' ? layout.rounded : DEFAULT_CONFIG.layout.rounded,
      shadows: typeof layout?.shadows === 'boolean' ? layout.shadows : DEFAULT_CONFIG.layout.shadows,
    },
  };
}

function mergeRawConfig(template: TemplateConfig, override?: Record<string, unknown> | null): TemplateConfig {
  if (!override) return { ...template };

  const colors = override.colors as Record<string, string> | undefined;
  const fonts = override.fonts as Record<string, string> | undefined;
  const layout = override.layout as Record<string, unknown> | undefined;

  return {
    colors: {
      primary: colors?.primary || template.colors.primary,
      secondary: colors?.secondary || template.colors.secondary,
      accent: colors?.accent || template.colors.accent,
      background: colors?.background || template.colors.background,
      text: colors?.text || template.colors.text,
    },
    fonts: {
      heading: fonts?.heading || template.fonts.heading,
      body: fonts?.body || template.fonts.body,
    },
    layout: {
      style: typeof layout?.style === 'string' ? layout.style : template.layout.style,
      rounded: typeof layout?.rounded === 'boolean' ? layout.rounded : template.layout.rounded,
      shadows: typeof layout?.shadows === 'boolean' ? layout.shadows : template.layout.shadows,
    },
  };
}

function getGoogleFonts(config: TemplateConfig): string[] {
  const fonts = new Set<string>();
  [config.fonts.heading, config.fonts.body].forEach((f) => {
    if (f && f !== 'system-ui') fonts.add(f);
  });
  return Array.from(fonts);
}

export async function renderTemplate(
  templateName?: string,
  override?: Record<string, unknown> | null,
): Promise<RenderedTheme> {
  const name = templateName || DEFAULT_TEMPLATE;

  try {
    const template = await prisma.template.findUnique({ where: { name } });
    if (!template) return renderDefault(override);

    const config = mergeRawConfig(parseConfig(template.config), override);
    const cssVars = generateCssVars(config);

    return {
      name: template.name,
      label: template.label,
      config,
      cssVars,
      css: generateCss(config),
      googleFonts: getGoogleFonts(config),
    };
  } catch {
    return renderDefault(override);
  }
}

export function renderDefault(override?: Record<string, unknown> | null): RenderedTheme {
  const config = mergeRawConfig(DEFAULT_CONFIG, override);
  return {
    name: 'default',
    label: 'Default',
    config,
    cssVars: generateCssVars(config),
    css: generateCss(config),
    googleFonts: getGoogleFonts(config),
  };
}

export async function listTemplates() {
  return prisma.template.findMany({
    where: { isPublic: true },
    orderBy: { name: 'asc' },
  });
}

export async function getTemplate(name: string) {
  return prisma.template.findUnique({ where: { name } });
}
