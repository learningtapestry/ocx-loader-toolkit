/*
  Warnings:

  - Added the required column `content` to the `Node` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadata` to the `Node` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Node` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;
