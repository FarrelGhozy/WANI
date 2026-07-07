/*
  Warnings:

  - The primary key for the `Creds` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SignalKey` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Creds" DROP CONSTRAINT "Creds_pkey",
ADD COLUMN     "ownerId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
ADD CONSTRAINT "Creds_pkey" PRIMARY KEY ("ownerId", "id");

-- AlterTable
ALTER TABLE "SignalKey" DROP CONSTRAINT "SignalKey_pkey",
ADD COLUMN     "ownerId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
ADD CONSTRAINT "SignalKey_pkey" PRIMARY KEY ("ownerId", "type", "id");
