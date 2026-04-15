/*
  Warnings:

  - You are about to drop the `usage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "usage";

-- CreateTable
CREATE TABLE "Usage" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("key")
);
