# Changelog

All notable changes to the WANI project are documented in this file.
Tags follow the format `{service}-v{semver}` (e.g. `api-v1.0.7`).

---

## api-v1.0.7 — 2026-07-05

### Security
- **🔒 api: protect GET /store and GET /ai-config with requireJwt**  
  `GET /api/store` and `GET /api/ai-config` were previously public and hard-coded to `ownerId = "default"`, causing all logged-in users to see the same store regardless of which account they used. Both routes now require JWT authentication and correctly scope data to the requesting user.

### Fixed
- **🔥 api: auto-create Store on user registration** (#105)  
  Previously, newly registered users had no store until they opened Settings for the first time. The `register` controller now calls `StoreModel.upsertByOwner` immediately after creating the user, ensuring every account has a ready-to-use store from the start.

### Added
- Multi-tenant schema: `ownerId` added to all user-owned data models (`Store`, `Product`, `Order`, `Customer`, `Conversation`, `AiConfig`, `Website`, `UsageCounter`, `ActivityLog`).
- Owner-scoping utilities: `getOwnerId()`, `getOwnerIdOrFirst()`, `ownerFilter()`, `ownerWhere()`.
- Pairing code login for WhatsApp Bot (QR + code dual mode).
- Composite DB index on `Order(status, createdAt)`.
- `crossOriginResourcePolicy` added to Helmet config.
- Unit + integration test suite (223 tests) for auth, store, products, guardrails, and AI pipeline.

---

## api-v1.0.6 — 2025-06-xx

### Added
- Composite index on `Order(status, createdAt)` for dashboard order-list performance.

---

## dashboard-v1.0.8 — 2025-06-xx

### Fixed
- Multiple lint fixes (react-refresh/only-export-components, missing deps, set-state-in-effect).
- Mobile logout button added to Topbar.

### Added
- Route progress bar, `type=button` fixes, Input consistency, `formatDate` fixes.
- Mobile UX improvements & full Indonesian localization.
- Unsaved-changes warning dialog and raised data limit to 500.
- Independent dashboard loading & full breadcrumb navigation.
- Skeleton loading states and inline error handling across all pages.
- Enhanced toast system with `apiError`, warning type, and action support.
- Global `ErrorBoundary` with retry UI.

---

## wa-bot-v1.0.8 — 2025-06-xx

### Fixed
- Replaced silent catch blocks with structured logging + backoff.

---
