-- CreateTable
CREATE TABLE "Creds" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "Creds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalKey" (
    "type" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "SignalKey_pkey" PRIMARY KEY ("type","id")
);
