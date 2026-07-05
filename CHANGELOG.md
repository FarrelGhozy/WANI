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

### Added (since api-v1.0.6)
- Multi-tenant schema: `ownerId` added to all user-owned data models (`Store`, `Product`, `Order`, `Customer`, `Conversation`, `AiConfig`, `Website`, `UsageCounter`, `ActivityLog`).
- Owner-scoping utilities: `getOwnerId()`, `getOwnerIdOrFirst()`, `ownerFilter()`, `ownerWhere()` in `api/src/middleware/owner.ts`.
- Pairing code login for WhatsApp Bot (QR + code dual mode).
- Composite DB index on `Order(status, createdAt)` for faster order-list queries.
- `crossOriginResourcePolicy` added to Helmet config to fix CORP blocking cross-origin images.
- `getValidatedQuery<T>()` type-guard helper to replace unsafe `req.validatedQuery!` casts.
- Extensive test suite:
  - Unit tests: `OrderModel`, circuit breaker, `LLMError`.
  - Integration tests: auth endpoints, store endpoints, products endpoints.

### Changed / Refactored (since api-v1.0.6)
- Replaced all `as any` / `as unknown` casts in API controllers and models with proper Prisma types or `Record<string, unknown>`.
- Extracted injection-regex patterns to a shared module (`guardrails/firewall/injection.ts`) for single-source-of-truth maintenance.
- Cleaned up `req.user!` non-null assertions and fixed JWT `expiresIn` typing.

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
