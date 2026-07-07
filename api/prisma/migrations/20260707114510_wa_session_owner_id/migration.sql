-- Rename id to ownerId for multi-tenant bot support
ALTER TABLE "WaSession" RENAME COLUMN "id" TO "ownerId";
ALTER TABLE "WaSession" ALTER COLUMN "ownerId" DROP DEFAULT;
