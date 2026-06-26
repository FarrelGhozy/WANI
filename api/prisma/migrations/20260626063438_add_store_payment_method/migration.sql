-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'E_WALLET';

-- CreateTable
CREATE TABLE "StorePaymentMethod" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL DEFAULT 'default',
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "providerName" TEXT,
    "phoneNumber" TEXT,
    "qrImageUrl" TEXT,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorePaymentMethod_storeId_idx" ON "StorePaymentMethod"("storeId");
