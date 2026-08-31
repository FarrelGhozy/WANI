CREATE TABLE "ApiKey" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");
CREATE INDEX "ApiKey_ownerId_createdAt_idx" ON "ApiKey"("ownerId", "createdAt");
CREATE INDEX "ApiKey_ownerId_revokedAt_idx" ON "ApiKey"("ownerId", "revokedAt");
