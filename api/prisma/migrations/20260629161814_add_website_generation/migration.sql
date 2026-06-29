-- CreateTable
CREATE TABLE "WebsiteGeneration" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteGeneration_slug_key" ON "WebsiteGeneration"("slug");

-- CreateIndex
CREATE INDEX "WebsiteGeneration_createdAt_idx" ON "WebsiteGeneration"("createdAt");
