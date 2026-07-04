-- DropIndex
DROP INDEX IF EXISTS "ActivityLog_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "Category_name_key";

-- DropIndex
DROP INDEX IF EXISTS "Conversation_customerId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Conversation_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "Customer_phone_key";

-- DropIndex
DROP INDEX IF EXISTS "Message_conversationId_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "Order_customerId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Order_status_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "Product_name_idx";

-- DropIndex
DROP INDEX IF EXISTS "StorePaymentMethod_storeId_idx";

-- DropIndex
DROP INDEX IF EXISTS "WebsiteGeneration_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "WebsiteGeneration_slug_key";

-- AlterTable: add ownerId as nullable first
ALTER TABLE "ActivityLog" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "AiConfig" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Category" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Message" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Order" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Product" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Store" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "StorePaymentMethod" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "WebSite" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "WebsiteGeneration" ADD COLUMN "ownerId" TEXT;

-- Backfill: assign existing data to first registered user (if any)
-- Uses subquery so it works on any environment (dev / prod / VPS).
-- Falls back to nil UUID if no user exists yet — data is empty on fresh deployments.
UPDATE "ActivityLog" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "AiConfig" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "Category" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "Conversation" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "Customer" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "Message" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "Order" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "Product" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "Store" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "StorePaymentMethod" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "WebSite" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');
UPDATE "WebsiteGeneration" SET "ownerId" = COALESCE((SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1), '00000000-0000-0000-0000-000000000000');

-- Make ownerId NOT NULL
ALTER TABLE "ActivityLog" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "AiConfig" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Conversation" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Message" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Store" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "StorePaymentMethod" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "WebSite" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "WebsiteGeneration" ALTER COLUMN "ownerId" SET NOT NULL;

-- Drop default on single-row tables (id no longer auto-defaults)
ALTER TABLE "AiConfig" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Store" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "WebSite" ALTER COLUMN "id" DROP DEFAULT;

-- Drop storeId from StorePaymentMethod (replaced by ownerId)
ALTER TABLE "StorePaymentMethod" DROP COLUMN "storeId";

-- CreateIndex
CREATE INDEX "ActivityLog_ownerId_createdAt_idx" ON "ActivityLog"("ownerId", "createdAt");
CREATE UNIQUE INDEX "AiConfig_ownerId_key" ON "AiConfig"("ownerId");
CREATE UNIQUE INDEX "Category_ownerId_name_key" ON "Category"("ownerId", "name");
CREATE INDEX "Conversation_ownerId_status_idx" ON "Conversation"("ownerId", "status");
CREATE INDEX "Conversation_ownerId_customerId_idx" ON "Conversation"("ownerId", "customerId");
CREATE INDEX "Customer_ownerId_idx" ON "Customer"("ownerId");
CREATE UNIQUE INDEX "Customer_ownerId_phone_key" ON "Customer"("ownerId", "phone");
CREATE INDEX "Message_ownerId_conversationId_createdAt_idx" ON "Message"("ownerId", "conversationId", "createdAt");
CREATE INDEX "Order_ownerId_customerId_idx" ON "Order"("ownerId", "customerId");
CREATE INDEX "Order_ownerId_status_createdAt_idx" ON "Order"("ownerId", "status", "createdAt");
CREATE INDEX "Product_ownerId_name_idx" ON "Product"("ownerId", "name");
CREATE UNIQUE INDEX "Store_ownerId_key" ON "Store"("ownerId");
CREATE INDEX "StorePaymentMethod_ownerId_idx" ON "StorePaymentMethod"("ownerId");
CREATE UNIQUE INDEX "WebSite_ownerId_key" ON "WebSite"("ownerId");
CREATE INDEX "WebsiteGeneration_ownerId_createdAt_idx" ON "WebsiteGeneration"("ownerId", "createdAt");
CREATE UNIQUE INDEX "WebsiteGeneration_ownerId_slug_key" ON "WebsiteGeneration"("ownerId", "slug");
