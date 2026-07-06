-- AlterTable
ALTER TABLE "User" ALTER COLUMN "emailVerificationExpires" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ActivityLog_ownerId_type_createdAt_idx" ON "ActivityLog"("ownerId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "StorePaymentMethod_ownerId_isActive_idx" ON "StorePaymentMethod"("ownerId", "isActive");
