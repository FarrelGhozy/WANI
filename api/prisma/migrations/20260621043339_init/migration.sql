-- CreateTable
CREATE TABLE "WaSession" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "phone" TEXT,
    "qr" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaSession_pkey" PRIMARY KEY ("id")
);
