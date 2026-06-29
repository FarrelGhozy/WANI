---
name: Neon Syndicate
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#ebb2ff'
  on-secondary: '#520071'
  secondary-container: '#ce5dff'
  on-secondary-container: '#480064'
  tertiary: '#fff5f5'
  on-tertiary: '#67001d'
  tertiary-container: '#ffcfd2'
  on-tertiary-container: '#c0003e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ebb2ff'
  on-secondary-fixed: '#320047'
  on-secondary-fixed-variant: '#74009f'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b8'
  on-tertiary-fixed: '#40000f'
  on-tertiary-fixed-variant: '#91002d'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '900'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '900'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
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
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1440px
---

## Brand & Style

This design system embodies a "Cyberpunk Retro" aesthetic, blending high-tech futurism with a nostalgic 80s digital edge. The target audience is tech-enthusiasts, gamers, and collectors of digital/physical edge-case products. The UI should evoke a sense of being inside a high-end hacking terminal or a futuristic marketplace in a sprawling megalopolis.

The style is a hybrid of **High-Contrast Bold** and **Glassmorphism**, set against a deep-space backdrop. It utilizes vibrant neon glows, sharp geometries, and semi-transparent surfaces to create a sense of digital depth. Visuals are aggressive and unapologetic, prioritizing high-energy accents and technical precision.

## Colors

The palette is anchored by a nearly black base to provide maximum contrast for the neon accents. 

- **Primary (Neon Cyan):** Used for primary actions, success states, and critical navigation links. It represents the "active" digital flow.
- **Secondary (Electric Purple):** Used for interactive elements, hover states, and promotional highlights.
- **Tertiary (Cyber Pink):** Reserved for alerts, sale tags, or high-urgency notifications.
- **Neutral:** The background is a solid deep navy-black (#0a0a0c). Surface colors utilize various opacities of these neons mixed with blacks to create "glowing" dark greys.

## Typography

Typography is used to distinguish between narrative/marketing content and technical data. 

**Inter** is the workhorse for headings and body copy, utilized in heavy weights to command attention. Headlines should use tight tracking and uppercase styling for a more aggressive, structural feel.

**JetBrains Mono** is used for all "technical" information, including prices, SKU numbers, specifications, and UI labels. This reinforces the "terminal" aesthetic and ensures clarity for data-heavy e-commerce grids.

## Layout & Spacing

This design system uses a **Fluid Grid** model based on an 8px technical scale. 

- **Desktop:** 12-column grid with 24px gutters. Wide margins (64px) allow the neon glows to "breathe" against the black background.
- **Mobile:** 4-column grid with 16px margins.
- **Spacing Philosophy:** Layouts should feel structured and modular, like a circuit board. Use consistent padding inside cards and containers to maintain a "contained" digital look. Horizontal separators should be thin, high-contrast lines.

## Elevation & Depth

Depth is achieved through light and transparency rather than traditional soft shadows.

1.  **Glassmorphism:** Surfaces use a background blur (12px - 20px) and a semi-transparent dark fill (e.g., `rgba(10, 10, 12, 0.7)`).
2.  **Glowing Borders:** Instead of shadows, use 1px inner or outer strokes with the primary or secondary neon colors. For higher elevation, add a "bloom" effect using a drop-shadow with 0 offset and a 10px-15px blur of the border color.
3.  **Tonal Stacking:** Higher elevation elements use slightly lighter background values or higher opacity blurs.

## Shapes

The shape language is sharp and industrial. While the default roundedness is set to "Soft" (4px), it is used sparingly to prevent the UI from looking too friendly. 

- **Containers:** 4px radius for a slight "screen-edge" feel.
- **Interactive Elements:** Use 0px (sharp) corners for buttons and inputs to lean into the retro-brutalist cyberpunk vibe.
- **Accents:** Use 45-degree clipped corners (chamfers) for decorative elements or primary "Call to Action" buttons to reinforce the sci-fi aesthetic.

## Components

- **Buttons:** Primary buttons feature a solid Cyan background with black text. On hover, they should emit a cyan outer glow. Secondary buttons use a 1px Purple border with a transparent background.
- **Chips/Tags:** Use the "Data" typography style. Rectangular with 0px radius. Backgrounds should be low-opacity versions of the accent colors.
- **Input Fields:** Bottom-border only or a full 1px border in a muted grey-blue. When focused, the border turns Neon Cyan and the label "glitches" or changes to the cyan color.
- **Cards:** Glassmorphic backgrounds with a subtle 1px border. Product images should have a slight blue tint or "scanline" overlay that disappears on hover.
- **Lists:** Items separated by 1px dotted or dashed lines (mimicking technical schematics).
- **Checkboxes/Radios:** Square-only, sharp corners. Use Neon Cyan for the "Checked" state with a small inner square instead of a checkmark.
- **Price Displays:** Always in JetBrains Mono. Large prices should have a subtle "glow" text-shadow in the secondary color.