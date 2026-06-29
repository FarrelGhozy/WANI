---
name: Renaissance Modern
colors:
  surface: '#fff8f3'
  surface-dim: '#e3d8cc'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf2e5'
  surface-container: '#f7ecdf'
  surface-container-high: '#f1e7d9'
  surface-container-highest: '#ece1d4'
  on-surface: '#201b13'
  on-surface-variant: '#4f4535'
  inverse-surface: '#353027'
  inverse-on-surface: '#faefe2'
  outline: '#817563'
  outline-variant: '#d3c4af'
  surface-tint: '#7b5800'
  primary: '#785600'
  on-primary: '#ffffff'
  primary-container: '#986d00'
  on-primary-container: '#fffbff'
  inverse-primary: '#f7bd48'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#085ea2'
  on-tertiary: '#ffffff'
  tertiary-container: '#3477bc'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea6'
  primary-fixed-dim: '#f7bd48'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5d4200'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#a1c9ff'
  on-tertiary-fixed: '#001c37'
  on-tertiary-fixed-variant: '#004880'
  background: '#fff8f3'
  on-background: '#201b13'
  surface-variant: '#ece1d4'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 32px
  margin: max(40px, 5vw)
---

## Brand & Style

This design system draws inspiration from the Golden Ratio and classical architectural symmetry. It balances the ornate elegance of high-Renaissance aesthetics with a clean, modern digital utility. The target audience values sophistication, intellectual depth, and premium quality.

The visual style is a blend of **Minimalism** and **Tactile** refinement. It utilizes expansive whitespace (luxurious "breathing room") to frame content like art in a gallery. Visual elements are governed by strict proportions, while subtle metallic textures and high-contrast typography evoke a sense of timeless authority and curated excellence.

## Colors

The palette is anchored in three distinct emotional states:

1.  **Default (Heritage):** A warm, parchment-inspired ivory (`#FAF9F6`) serves as the canvas, with "Old Gold" and charcoal providing a grounded, prestigious atmosphere.
2.  **Dark (Midnight Gallery):** A transition to deep charcoal and midnight blues. Gold and silver accents act as "jewelry" against the dark background, maintaining legibility and luxury.
3.  **Neon (Modern Baroque):** An avant-garde interpretation using absolute black surfaces. Electric gold and vibrant purple create high-energy focal points, reminiscent of neon lighting in a classical cathedral.

Use the primary gold primarily for call-to-actions, borders, and delicate separators.

## Typography

The typographic hierarchy relies on the high-contrast tension between the serif and sans-serif faces. 

**Bodoni Moda** is reserved for large headlines and display moments. Its vertical stress and sharp serifs provide the "classical" anchor. Avoid using it for long-form body text.

**Plus Jakarta Sans** provides a clean, approachable counterpoint for functional text. Its modern geometry ensures readability at small scales. 

**Label styling:** Always use uppercase with increased letter-spacing (tracking) for labels and overlines to mimic classical inscriptions.

## Layout & Spacing

This design system uses a **Fluid Grid** model with generous vertical rhythm. 

- **Desktop:** 12-column grid with wide 32px gutters. Margins scale with viewport width to maintain a centered, editorial look.
- **Tablet:** 8-column grid with 24px gutters.
- **Mobile:** 4-column grid with 16px gutters and 20px margins.

Spacing should prioritize asymmetrical balance. Use "xl" (80px) spacing between major sections to emphasize a sense of luxury and unhurried exploration. Elements should never feel crowded; when in doubt, increase the padding.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Base):** The primary surface color.
- **Level 1 (Cards):** A slightly lighter or darker tint (depending on theme) with a 1px solid border in a metallic accent color (Gold/Silver). 
- **Overlay:** When using modals or menus, apply a subtle backdrop blur (8px) to suggest glass-like transparency without breaking the classical structure.
- **Shadows:** If used, they must be "Ambient Shadows"—extremely soft, 10% opacity, with a large spread and a tint matching the secondary color.

## Shapes

The shape language is architectural and structured. We use a **Soft (4px)** radius for most UI components (buttons, input fields, cards). This provides a hint of modern softness while maintaining the "chiseled" precision of classical stone masonry.

Interactive elements like icons should use "Sharp" or "Soft" variants to match this geometry. Avoid full circles unless used for profile avatars or specific decorative medals.

## Components

**Buttons:** 
- Primary: Solid fill (Primary Gold) with Label-SM text (White/Black depending on theme). 4px radius.
- Secondary: 1px Gold border with transparent background.
- Hover state: Slight increase in border weight or a very subtle inner glow.

**Input Fields:**
- Minimalist design. 1px bottom border only (Classical look) or a full 1px border with a 4px radius. 
- Use Plus Jakarta Sans for the input text and Bodoni Moda for the field labels.

**Cards:**
- Use a 1px border (`#D4AF37` at 30% opacity). 
- Include generous internal padding (MD or LG). 
- Always align text centrally or to a strict left grid line.

**Chips/Tags:**
- Small, uppercase, with 1px borders. Use them sparingly to avoid cluttering the elegant interface.

**Lists:**
- Use horizontal separators (rules) that are thin and elegant. The last item in a list should never have a bottom rule.