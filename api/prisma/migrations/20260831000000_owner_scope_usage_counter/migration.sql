-- Convert the global daily usage counter into an owner-scoped daily counter.
ALTER TABLE "UsageCounter"
ADD COLUMN "ownerId" TEXT,
ADD COLUMN "date" TEXT;

-- Preserve existing counters by assigning them to the first existing owner.
UPDATE "UsageCounter"
SET
  "ownerId" = COALESCE(
    (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    '00000000-0000-0000-0000-000000000000'
  ),
  "date" = id;

ALTER TABLE "UsageCounter"
ALTER COLUMN "ownerId" SET NOT NULL,
ALTER COLUMN "date" SET NOT NULL;

ALTER TABLE "UsageCounter" DROP CONSTRAINT "UsageCounter_pkey";
ALTER TABLE "UsageCounter" DROP COLUMN "id";
ALTER TABLE "UsageCounter"
ADD CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("ownerId", "date");
