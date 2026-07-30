-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('STOPPED', 'STARTING', 'SCAN_QR_CODE', 'PASSKEY_REQUIRED', 'PASSKEY_CONFIRMATION_REQUIRED', 'WORKING', 'FAILED');

-- AlterTable
ALTER TABLE "WaSession" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastSeenActiveAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "waSessionName" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'STARTING';

-- CreateIndex
CREATE UNIQUE INDEX "WaSession_ownerId_key" ON "WaSession"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "WaSession_waSessionName_key" ON "WaSession"("waSessionName");
