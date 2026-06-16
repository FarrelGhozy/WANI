# DSH-14 — Dashboard Layout: Sidebar, Header, Responsive

## Task Checklist

### 1. Layout Component (`app/dashboard/layout.tsx`)
- [x] DashboardLayout component with Sidebar + Header + main content
- [x] Flex layout: sidebar fixed 256px, content fills remaining space
- [x] Overflow scroll on main area

### 2. Sidebar Component
- [x] Navigation menu (icon + label) from dashboardNav config
- [x] Active state: primary-50 background, primary-700 text
- [x] Collapsible on mobile with overlay
- [x] WANI logo at top (links to /dashboard)
- [x] Merchant name + avatar (initial letter) at bottom
- [x] Logout button at bottom
- [x] Smooth slide transition (translate-x)

### 3. Header Component
- [x] Breadcrumb: "Dashboard > PageName"
- [x] Merchant name + avatar on the right
- [x] Mobile hamburger button (toggles sidebar)
- [x] Responsive design

### 4. Mobile Responsive
- [x] Desktop (>1024px): sidebar always visible
- [x] Mobile (<1024px): sidebar hidden, overlay when open
- [x] Touch-friendly tap targets (44px+)

### 5. Shared UI Primitives
- [x] `Button` — variants: primary, secondary, outline, ghost, danger; sizes: sm, md, lg
- [x] `Input` — with label, error state, icon support
- [x] `Card` — with CardHeader, CardTitle sub-components
- [x] `Badge` — variants: default, success, warning, danger, info
- [x] `Table` — generic typed table with loading state
- [x] `Dialog` — modal with backdrop, escape to close
- [x] `Select` — dropdown with label and error state
- [x] `Switch` — toggle with label, disabled state
- [x] `Loading` — spinning loader
- [x] `Skeleton` — pulse placeholder (with TableSkeleton variant)

### 6. Navigation Config
- [x] `src/lib/navigation.ts` with lucide-react icons

## Verification
- [x] Build succeeds (Next.js + API)
- [x] All 32 tests pass
- [x] Dashboard layout renders with sidebar + header
- [x] Active state changes based on pathname

## Labels
`frontend`, `dashboard`, `layout`, 🔴 high

## Dependencies
DSH-13
