---
name: WANI Store Core
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  3xl: 80px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: auto
---

## Brand & Style
This design system is built to provide a versatile foundation for SME (UMKM) storefronts, balancing commercial efficiency with aesthetic flexibility. The system supports three distinct visual directions:

1.  **Modern Professional:** A "Corporate-Modern" hybrid focusing on reliability and trust. It utilizes structured grids and precise typography to convey competence.
2.  **Minimalist Elegant:** A "Minimalist" approach characterized by generous whitespace, high-contrast serif pairings, and a sophisticated, calm atmosphere.
3.  **Vibrant Playful:** A "High-Contrast & Bold" style using rounded forms and energetic saturations to evoke friendliness and approachability.

The core objective is to ensure that regardless of the chosen theme, the underlying structural integrity and usability remain consistent.

## Colors
The color architecture uses a functional approach to support theme switching. 

- **Primary:** Used for main actions, brand identifiers, and active states.
- **Secondary:** Used for supporting information, icons, and less prominent UI elements.
- **Tertiary (Accent):** Reserved for highlights, badges, and "New" or "Sale" indicators to draw immediate attention.
- **Neutral:** A deep slate used for maximum legibility in text and structural borders.

Each theme maintains high accessibility standards, ensuring a minimum contrast ratio of 4.5:1 for body text against the surface.

## Typography
The typography system is designed for high readability in a commercial context. 

- **Headlines:** Use *Plus Jakarta Sans* for a contemporary and inviting feel. In the "Elegant" theme, developers should swap this for *Libre Caslon Text* to elevate the sophistication.
- **Body:** *Inter* provides a systematic, neutral base that performs exceptionally well at small sizes on mobile screens.
- **Labels:** *JetBrains Mono* is used sparingly for technical data (SKUs, pricing, dimensions) to provide a clear, "plotted" look that differentiates data from prose.

Line heights are generous to prevent visual fatigue during long browsing sessions.

## Layout & Spacing
This design system utilizes a **Fluid Grid** model with a standard 12-column layout for desktop and a 4-column layout for mobile. 

- **Vertical Rhythm:** Built on a 4px baseline grid. All component heights and vertical margins must be multiples of 4.
- **Container:** Maximum content width is set to 1280px.
- **Adaptive Rules:** On mobile devices, side margins shrink to 16px to maximize real estate for product imagery. 
- **Section Spacing:** Use `xl` (40px) or `2xl` (64px) to separate distinct content blocks like "Featured Products" and "Testimonials."

## Elevation & Depth
Visual hierarchy is established through a combination of **Tonal Layers** and **Ambient Shadows**.

- **Level 0 (Base):** The page background.
- **Level 1 (Cards):** Low-opacity, extra-diffused shadows (`0px 4px 20px rgba(0,0,0,0.05)`) with a 1px neutral-200 border to define edges clearly.
- **Level 2 (Modals/Dropdowns):** Deeper shadows with a slight Y-axis offset to suggest physical separation from the UI plane.
- **Theme Specifics:** 
    - *Modern:* Uses sharp borders and crisp Level 1 shadows.
    - *Elegant:* Relies on whitespace and thin rules rather than shadows.
    - *Vibrant:* Uses "Neomorphism-lite" or thick 2px solid borders (Brutalist influence) instead of soft shadows.

## Shapes
The default shape language is **Rounded** (8px), providing a balanced look that fits most SME brands.

- **Theme Overrides:**
    - *Modern:* Use `roundedness: 1` (4px) for a more precise, engineered look.
    - *Vibrant:* Use `roundedness: 3` (16px+) for a bubbly, friendly, and energetic personality.
- **Consistent Application:** Apply the chosen radius to buttons, input fields, product cards, and image containers to maintain visual harmony.

## Components

- **Buttons:** Primary buttons use a solid fill with white text. Secondary buttons use a ghost style (outline only). Height should be fixed at 48px for mobile tap-targets.
- **Chips:** Used for product categories or filters. These should have a subtle background (Neutral 100) and no border, becoming Primary color only when active.
- **Input Fields:** 1px border with a 12px horizontal padding. The label should be permanent (not floating) using the `label-sm` style for accessibility.
- **Product Cards:** Must contain an image ratio of 1:1 or 4:5. Text content (Title, Price) should be left-aligned with a 16px padding from the card edge.
- **Lists:** Use a 1px bottom border for list items in mobile menus, ensuring a minimum touch height of 56px.
- **Checkboxes/Radios:** Use the Primary color for checked states. Ensure the hit area is a minimum of 24x24px even if the visual icon is smaller.