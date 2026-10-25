-- AlterTable
ALTER TABLE "AiConfig" ADD COLUMN     "fallbackModel" TEXT,
ADD COLUMN     "llmApiKey" TEXT,
ADD COLUMN     "llmBaseUrl" TEXT;
