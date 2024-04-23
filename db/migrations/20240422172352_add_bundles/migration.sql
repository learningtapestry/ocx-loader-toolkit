/*
  Warnings:

  - You are about to drop the `OcxBundle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "OcxBundle";

-- CreateTable
CREATE TABLE "Bundle" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "sitemapUrl" TEXT NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);
