---
name: Classic Renaissance
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#4d4635'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#7f7663'
  outline-variant: '#d0c5af'
  surface-tint: '#735c00'
  primary: '#735c00'
  on-primary: '#ffffff'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#e9c349'
  secondary: '#954742'
  on-secondary: '#ffffff'
  secondary-container: '#fe9b94'
  on-secondary-container: '#78302d'
  tertiary: '#2b6954'
  on-tertiary: '#ffffff'
  tertiary-container: '#81bfa7'
  on-tertiary-container: '#074f3c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ad'
  on-secondary-fixed: '#3d0506'
  on-secondary-fixed-variant: '#77302d'
  tertiary-fixed: '#b0f0d6'
  tertiary-fixed-dim: '#95d3ba'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#0b513d'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Libre Franklin
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Libre Franklin
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Libre Franklin
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  stack-sm: 16px
  stack-md: 32px
  stack-lg: 64px
---

## Brand & Style
The brand personality is authoritative, intellectual, and deeply rooted in historical elegance. Designed for the WANI website generator, this design system transforms digital canvases into virtual manuscripts. It targets creators, academics, and luxury brands who value heritage over trends.

The aesthetic follows a **Modern Editorial** approach—a blend of classical publishing traditions and contemporary digital precision. It utilizes generous whitespace, "Golden Ratio" proportions, and a disciplined application of decorative elements to evoke a sense of permanence and prestige. The emotional response should be one of quiet confidence and curated sophistication.

## Colors
The palette is anchored by **Renaissance Gold**, used primarily for highlights, borders, and significant calls to action. The primary background (Parchment) is an off-white that reduces eye strain and provides a tactile, paper-like quality. 

- **Primary (Gold):** Symbolizes excellence and craftsmanship. Use for iconography and primary interactive states.
- **Secondary (Burgundy):** Used for deep emphasis, such as headers or active navigation states to provide a regal contrast.
- **Surface:** In the default mode, the surface is textured only by its warm hue. In "Midnight," the palette shifts to an ebony-ink feel, while "Grandeur" introduces a royal purple foundation with high-luminance accents for a more theatrical presentation.

## Typography
The typography system relies on the interplay between the dramatic, high-contrast strokes of **Bodoni Moda** and the utilitarian clarity of **Libre Franklin**. 

Headlines should be treated as architectural elements. Large display sizes benefit from tight letter-spacing and high-contrast serifs. Body text is prioritized for legibility with a slightly increased line-height to mirror the spacing of traditional typesetting. All labels and secondary metadata should be set in Libre Franklin with uppercase styling and increased tracking to maintain a clean, organized hierarchy.

## Layout & Spacing
This design system utilizes a **Fixed Centered Grid** for desktop and a **Fluid Grid** for mobile. The layout is inspired by classical book design, featuring wide margins that frame the content.

- **Desktop:** A 12-column grid with a maximum width of 1280px. Gutters are kept generous (24px) to ensure breathing room between technical elements.
- **Mobile:** A 4-column grid with 20px side margins. 
- **Rhythm:** Vertical spacing follows a geometric progression (16, 32, 64, 128) to create clear sections. Use the larger `stack-lg` units between distinct content blocks to maintain an editorial feel.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Hairline Outlines** rather than heavy shadows. The goal is to simulate layers of parchment or stacked vellum.

- **Outlines:** Use 1px solid borders in a muted version of the Primary Gold or a subtle Neutral Grey to define sections.
- **Shadows:** Only use shadows for "floating" elements like dropdown menus or modals. These should be "Ambient Shadows"—very soft, long-range, and low-opacity (5-10%) to avoid breaking the flat, classic aesthetic.
- **Interactive Depth:** When hovering over cards or buttons, a subtle shift in background tone (inner glow) or a slight border-weight increase is preferred over vertical lifting.

## Shapes
Shapes are disciplined and architectural. The system uses a "Soft" setting (0.25rem / 4px) to take the edge off digital harshness while maintaining a formal, structured appearance. 

Avoid fully rounded or pill-shaped elements as they conflict with the classical Serif typography. Large containers (cards, hero sections) should use the standard 4px radius, while small utility items like tags or checkboxes should remain sharp (0-2px) to look like traditional lead-type blocks.

## Components
- **Buttons:** Primary buttons feature a solid Burgundy or Gold background with uppercase label text. Secondary buttons should be "Ghost" style with a 1px Gold border and a subtle hover fill.
- **Input Fields:** Use "Underline" style inputs (border only on the bottom) to mimic a signature line on a document, or 1px outlined boxes with sharp corners.
- **Cards:** Cards should have a thin, 1px border and no shadow. Use a slightly different shade of the surface color (e.g., a lighter parchment) to distinguish them from the background.
- **Chips & Tags:** Small, rectangular containers with 2px radius and uppercase text. Use these for categories or metadata.
- **Dividers:** Use ornamental dividers—thin lines with a small diamond or flourish at the center—to separate major content sections, reinforcing the Renaissance manuscript theme.
- **Lists:** Bullet points should be replaced with small "Diamond" icons or traditional Roman numerals for a more formal structure.