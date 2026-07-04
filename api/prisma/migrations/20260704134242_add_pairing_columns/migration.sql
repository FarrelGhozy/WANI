-- AlterTable
ALTER TABLE "WaSession" ADD COLUMN     "pairingCode" TEXT,
ADD COLUMN     "pairingPhone" TEXT;

-- RenameIndex
ALTER INDEX "idx_orders_status_created_at" RENAME TO "Order_status_createdAt_idx";
