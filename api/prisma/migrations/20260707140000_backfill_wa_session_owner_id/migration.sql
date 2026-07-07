-- Backfill WaSession ownerId from 'default' to first user's UUID
UPDATE "WaSession"
SET "ownerId" = (SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1)
WHERE "ownerId" = 'default'
  AND EXISTS (SELECT 1 FROM "User");
